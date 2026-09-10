#!/usr/bin/env python3
"""Safely publish the frozen v2.15.0 public release to a GitHub release-candidate branch.

This script never merges main, never enables GitHub Pages, and never writes a secret.
It stages the exact extracted release in an isolated git worktree, compares the staged
Git tree to the source release tree, pushes only the configured release branch, and
then verifies the remote tree SHA and that remote main did not move.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
VERSION = "2.15.0"
MANIFEST_NAME = "release-manifest-v2.15.json"
DEFAULT_REPOSITORY = "gmoon-code/research-methods"
DEFAULT_BRANCH = "release/v2.15.0-free-public"
TEST_MODE_ENV = "RMS_PUBLICATION_HELPER_TEST_MODE"


class PublicationError(RuntimeError):
    pass


def run(cmd: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None,
        capture: bool = True, check: bool = True) -> subprocess.CompletedProcess[str]:
    merged = os.environ.copy()
    merged["PYTHONDONTWRITEBYTECODE"] = "1"
    if env:
        merged.update(env)
    return subprocess.run(
        cmd,
        cwd=str(cwd or ROOT),
        env=merged,
        text=True,
        stdout=subprocess.PIPE if capture else None,
        stderr=subprocess.PIPE if capture else None,
        check=check,
    )


def git(args: list[str], *, cwd: Path, capture: bool = True, check: bool = True) -> subprocess.CompletedProcess[str]:
    return run(["git", "-c", "core.autocrlf=false", *args], cwd=cwd, capture=capture, check=check)


def require_git() -> str:
    exe = shutil.which("git")
    if not exe:
        raise PublicationError("Git 2.x is required. Install Git before publishing.")
    cp = run([exe, "--version"])
    version = cp.stdout.strip()
    match = re.search(r"git version\s+(\d+)", version)
    if not match or int(match.group(1)) < 2:
        raise PublicationError(f"Git 2.x or newer is required; detected: {version}")
    return version


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def release_files(root: Path) -> list[Path]:
    out: list[Path] = []
    for p in root.rglob("*"):
        rel = p.relative_to(root)
        if ".git" in rel.parts:
            continue
        if p.is_symlink():
            raise PublicationError(f"Symlinks are not allowed in the publication release: {rel}")
        if p.is_file():
            out.append(p)
    return sorted(out, key=lambda p: p.relative_to(root).as_posix())


def verify_release_manifest(root: Path) -> dict:
    manifest_path = root / MANIFEST_NAME
    if not manifest_path.is_file():
        raise PublicationError(f"Missing {MANIFEST_NAME}.")
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise PublicationError(f"Cannot parse {MANIFEST_NAME}: {exc}") from exc
    if manifest.get("version") != VERSION:
        raise PublicationError(f"Manifest version is not {VERSION}.")
    expected = {item["path"]: item["sha256"] for item in manifest.get("files", [])}
    current = {
        p.relative_to(root).as_posix(): sha256(p)
        for p in release_files(root)
        if p.name != MANIFEST_NAME
    }
    if set(current) != set(expected):
        missing = sorted(set(expected) - set(current))
        extra = sorted(set(current) - set(expected))
        details = []
        if missing:
            details.append("missing: " + ", ".join(missing[:10]))
        if extra:
            details.append("extra: " + ", ".join(extra[:10]))
        raise PublicationError("Release file set differs from the frozen manifest (" + "; ".join(details) + ").")
    mismatched = [rel for rel, digest in current.items() if expected[rel] != digest]
    if mismatched:
        raise PublicationError("Release bytes differ from the frozen manifest: " + ", ".join(mismatched[:10]))
    return manifest


def copy_release_tree(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    for p in release_files(source):
        rel = p.relative_to(source)
        target = destination / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(p, target)
        # Publication files intentionally use a normalized non-executable mode.
        # This prevents ZIP extraction / Windows executable-bit differences from
        # changing the Git tree object ID. Scripts are invoked through Python/Node.
        try:
            target.chmod(0o644)
        except OSError:
            pass


def compute_source_git_tree(root: Path) -> str:
    """Compute the Git tree SHA for all frozen release bytes without modifying ROOT."""
    with tempfile.TemporaryDirectory(prefix="rms-v215-source-tree-") as td:
        work = Path(td) / "release"
        copy_release_tree(root, work)
        git(["init", "-q"], cwd=work)
        git(["config", "core.autocrlf", "false"], cwd=work)
        # -f guarantees the publication tree includes every frozen release file,
        # including files that a user's global excludes file might otherwise hide.
        git(["add", "-A", "-f", "--", "."], cwd=work)
        return git(["write-tree"], cwd=work).stdout.strip()


def normalize_github_repository(value: str) -> str | None:
    raw = value.strip()
    # GitHub HTTPS / SSH URL forms.
    patterns = [
        r"^(?:https?://)?github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$",
        r"^git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$",
        r"^ssh://git@github\.com/([^/]+)/([^/]+?)(?:\.git)?/?$",
        r"^([^/:]+)/([^/]+)$",
    ]
    for pattern in patterns:
        m = re.match(pattern, raw, re.I)
        if m:
            return f"{m.group(1)}/{m.group(2)}".lower()
    return None


def validate_target_repo(target: Path, expected_repository: str, allow_non_github_origin: bool) -> str:
    if not target.is_dir():
        raise PublicationError(f"Target clone does not exist: {target}")
    try:
        top = Path(git(["rev-parse", "--show-toplevel"], cwd=target).stdout.strip()).resolve()
    except subprocess.CalledProcessError as exc:
        raise PublicationError("--target must be an existing Git working tree.") from exc
    if top != target.resolve():
        raise PublicationError(f"--target must point to the repository root, not a subdirectory ({top}).")
    status = git(["status", "--porcelain=v1", "--untracked-files=all"], cwd=target).stdout
    if status.strip():
        raise PublicationError("Target clone is not clean. Commit, stash, or remove local changes before publication.")
    try:
        origin = git(["remote", "get-url", "origin"], cwd=target).stdout.strip()
    except subprocess.CalledProcessError as exc:
        raise PublicationError("Target clone has no origin remote.") from exc
    if not allow_non_github_origin:
        actual = normalize_github_repository(origin)
        expected = normalize_github_repository(expected_repository)
        if not actual or not expected or actual != expected:
            raise PublicationError(f"Origin is {origin!r}; expected GitHub repository {expected_repository!r}.")
    return origin


def ls_remote(target: Path, ref: str) -> str:
    cp = git(["ls-remote", "origin", ref], cwd=target, check=False)
    if cp.returncode not in (0, 2):
        raise PublicationError((cp.stderr or cp.stdout or "git ls-remote failed").strip())
    line = cp.stdout.strip().splitlines()
    return line[0].split()[0] if line else ""


def ensure_branch_name(branch: str) -> None:
    if branch == "main" or not branch.startswith("release/"):
        raise PublicationError("Publication branch must begin with 'release/' and can never be 'main'.")
    cp = run(["git", "check-ref-format", "--branch", branch], check=False)
    if cp.returncode != 0:
        raise PublicationError(f"Invalid publication branch name: {branch}")


def remove_worktree_contents(worktree: Path) -> None:
    for child in worktree.iterdir():
        if child.name == ".git":
            continue
        if child.is_symlink() or child.is_file():
            child.unlink()
        else:
            shutil.rmtree(child)


def run_release_verification(skip_full: bool) -> None:
    if skip_full:
        if os.environ.get(TEST_MODE_ENV) != "1":
            raise PublicationError("--skip-full-verification is restricted to the publication helper test suite.")
        return
    run([sys.executable, "scripts/verify-complete-release-v2.15.0.py"], cwd=ROOT, capture=False)


def publication_check(*, run_full: bool = False, skip_full: bool = False) -> str:
    require_git()
    verify_release_manifest(ROOT)
    run([sys.executable, "scripts/verify-public-github-readiness-v2.15.0.py"], cwd=ROOT, capture=False)
    if run_full:
        run_release_verification(skip_full)
    tree_sha = compute_source_git_tree(ROOT)
    print(f"Publication source Git tree SHA: {tree_sha}")
    return tree_sha


def publish(*, target: Path, expected_repository: str, branch: str,
            replace_release_branch: bool, dry_run: bool, full_release_verification: bool,
            skip_full_verification: bool, allow_non_github_origin: bool) -> dict:
    ensure_branch_name(branch)
    # Publication of an already frozen release requires only the self-contained
    # manifest/public-readiness/Git-tree checks. The full browser/release QA suite
    # is intentionally optional because it depends on release-engineering tooling
    # (Node/npm, Python packages, Chromium/Playwright) that owners do not need in
    # order to publish byte-exact release contents.
    source_tree = publication_check(run_full=full_release_verification, skip_full=skip_full_verification)
    origin = validate_target_repo(target, expected_repository, allow_non_github_origin)
    print(f"Verified clean target clone: {target}")
    print(f"Origin: {origin}")

    # Capture remote main before any candidate work or push.
    main_before = ls_remote(target, "refs/heads/main")
    if not main_before:
        raise PublicationError("origin/main does not exist; publication is refused.")
    existing_branch = ls_remote(target, f"refs/heads/{branch}")
    if existing_branch and not replace_release_branch:
        raise PublicationError(
            f"Remote branch {branch!r} already exists at {existing_branch}. "
            "Nothing was changed. Use --replace-release-branch only after deliberately reviewing that branch."
        )

    git(["fetch", "--no-tags", "origin", "refs/heads/main:refs/remotes/origin/main"], cwd=target, capture=False)
    fetched_main = git(["rev-parse", "refs/remotes/origin/main"], cwd=target).stdout.strip()
    if fetched_main != main_before:
        raise PublicationError("origin/main moved during preparation. Re-run from the new main state.")

    # Do all candidate work in a separate linked worktree, leaving the user's current
    # branch and files unchanged.
    with tempfile.TemporaryDirectory(prefix="rms-v215-publish-") as td:
        worktree = Path(td) / "candidate"
        git(["worktree", "add", "--detach", str(worktree), "refs/remotes/origin/main"], cwd=target, capture=False)
        try:
            remove_worktree_contents(worktree)
            copy_release_tree(ROOT, worktree)
            git(["add", "-A", "-f", "--", "."], cwd=worktree)
            candidate_tree = git(["write-tree"], cwd=worktree).stdout.strip()
            if candidate_tree != source_tree:
                raise PublicationError(
                    "Candidate Git tree differs from the frozen source release. "
                    f"source={source_tree}, candidate={candidate_tree}. Nothing was pushed."
                )
            print(f"PASS candidate Git tree matches frozen release: {candidate_tree}")

            if dry_run:
                main_after = ls_remote(target, "refs/heads/main")
                if main_after != main_before:
                    raise PublicationError("origin/main moved during dry-run verification.")
                print("DRY RUN PASS: no branch was pushed; main and Pages were not changed.")
                return {
                    "dry_run": True,
                    "source_tree": source_tree,
                    "main_sha": main_before,
                    "branch": branch,
                    "branch_sha": "",
                }

            # Do not silently fabricate a Git identity. The resulting commit belongs to
            # the repository owner and should use their locally configured Git identity.
            name = git(["config", "user.name"], cwd=target, check=False).stdout.strip()
            email = git(["config", "user.email"], cwd=target, check=False).stdout.strip()
            if not name or not email:
                raise PublicationError(
                    "Git user.name and user.email are not configured in the target clone. "
                    "Configure them locally, then re-run. Nothing was pushed."
                )

            git(["-c", "commit.gpgsign=false", "commit", "--no-verify", "-m",
                 "Release v2.15.0 free public candidate"], cwd=worktree, capture=False)
            commit_sha = git(["rev-parse", "HEAD"], cwd=worktree).stdout.strip()
            committed_tree = git(["rev-parse", "HEAD^{tree}"], cwd=worktree).stdout.strip()
            if committed_tree != source_tree:
                raise PublicationError("Committed tree changed unexpectedly before push.")

            push_args = ["push", "origin"]
            if existing_branch:
                push_args.append(f"--force-with-lease=refs/heads/{branch}:{existing_branch}")
            push_args.append(f"HEAD:refs/heads/{branch}")
            git(push_args, cwd=worktree, capture=False)

            main_after = ls_remote(target, "refs/heads/main")
            if main_after != main_before:
                raise PublicationError(
                    "CRITICAL: origin/main changed during release-branch publication. "
                    "The helper did not push main; inspect the remote before continuing."
                )
            remote_branch = ls_remote(target, f"refs/heads/{branch}")
            if remote_branch != commit_sha:
                raise PublicationError("Remote release branch SHA does not match the pushed candidate commit.")

            check_ref = f"refs/rms-publication-check/{uuid.uuid4().hex}"
            try:
                git(["fetch", "--no-tags", "origin", f"refs/heads/{branch}:{check_ref}"], cwd=target, capture=False)
                remote_tree = git(["rev-parse", f"{check_ref}^{{tree}}"], cwd=target).stdout.strip()
            finally:
                git(["update-ref", "-d", check_ref], cwd=target, check=False)
            if remote_tree != source_tree:
                raise PublicationError(
                    f"Remote release tree mismatch: expected {source_tree}, got {remote_tree}. "
                    "Do not merge the branch."
                )

            print(f"PUBLISH PASS: origin/{branch} -> {commit_sha}")
            print(f"PASS remote Git tree: {remote_tree}")
            print(f"PASS origin/main unchanged: {main_before}")
            print("GitHub Pages was not enabled or modified. No merge was performed.")
            return {
                "dry_run": False,
                "source_tree": source_tree,
                "main_sha": main_before,
                "branch": branch,
                "branch_sha": commit_sha,
            }
        finally:
            # Remove the linked worktree even when publication is refused midway.
            git(["worktree", "remove", "--force", str(worktree)], cwd=target, check=False, capture=False)
            git(["worktree", "prune"], cwd=target, check=False)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    ap = argparse.ArgumentParser(
        description="Prepare/publish the exact Research Methods Studio v2.15.0 public release to a release-only Git branch."
    )
    ap.add_argument("--target", type=Path, help="Path to a clean local clone of gmoon-code/research-methods.")
    ap.add_argument("--branch", default=DEFAULT_BRANCH, help=f"Release branch (default: {DEFAULT_BRANCH}).")
    ap.add_argument("--repository", default=DEFAULT_REPOSITORY, help="Expected GitHub owner/repository.")
    ap.add_argument("--check", action="store_true", help="Verify the frozen release and print its Git tree SHA; do not use a target or push.")
    ap.add_argument("--dry-run", action="store_true", help="Build and compare the exact candidate tree but do not commit or push.")
    ap.add_argument("--replace-release-branch", action="store_true", help="Explicitly replace an existing remote release branch using force-with-lease. Never affects main.")
    ap.add_argument("--full-release-verification", action="store_true", help="Optional release-engineering QA suite. Not required for normal publication of this frozen release.")
    # These two options exist only so the offline test suite can exercise a temporary
    # bare Git remote without network access. They are rejected unless TEST_MODE_ENV=1.
    ap.add_argument("--allow-non-github-origin", action="store_true", help=argparse.SUPPRESS)
    ap.add_argument("--skip-full-verification", action="store_true", help=argparse.SUPPRESS)
    return ap.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    if (args.allow_non_github_origin or args.skip_full_verification) and os.environ.get(TEST_MODE_ENV) != "1":
        raise PublicationError("Test-only publication options are disabled outside the package test suite.")
    if args.check:
        if args.target:
            raise PublicationError("--check does not use --target.")
        publication_check(run_full=False, skip_full=args.skip_full_verification)
        print("GITHUB PUBLICATION HELPER CHECK: PASS")
        return 0
    if not args.target:
        raise PublicationError("--target is required unless --check is used.")
    publish(
        target=args.target.resolve(),
        expected_repository=args.repository,
        branch=args.branch,
        replace_release_branch=args.replace_release_branch,
        dry_run=args.dry_run,
        full_release_verification=args.full_release_verification,
        skip_full_verification=args.skip_full_verification,
        allow_non_github_origin=args.allow_non_github_origin,
    )
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except subprocess.CalledProcessError as exc:
        detail = (exc.stderr or exc.stdout or "").strip()
        print(f"GITHUB PUBLICATION HELPER: FAIL: {detail or exc}", file=sys.stderr)
        raise SystemExit(exc.returncode or 1)
    except Exception as exc:
        print(f"GITHUB PUBLICATION HELPER: FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
