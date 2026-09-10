# GitHub publication handoff — v2.15.0 FREE

## Purpose

This document covers the **first GitHub publication step only**. It publishes the exact frozen v2.15.0 FREE repository to a review branch. It does not merge `main`, enable GitHub Pages, deploy Cloudflare, or activate Research Chat.

The intended repository is:

`gmoon-code/research-methods`

The default publication branch is:

`release/v2.15.0-free-public`

## Why publication is branch-first

The application has already passed its offline, browser, accessibility, privacy, free-architecture, and public-repository gates. Publishing first to a dedicated release branch creates a remote copy that can be compared with the frozen local release before `main` or GitHub Pages changes.

The publication helper refuses to push unless the Git tree staged for GitHub is byte-equivalent to the frozen extracted release. Normal publication intentionally uses only self-contained Python/Git integrity checks. It does not rerun the release-engineering browser/test suite, so owners do not need npm, Playwright, NumPy, or Chromium merely to publish an already verified release. The repository includes `.gitattributes` with `* -text` so Git does not silently rewrite line endings on Windows.

## Prerequisites

- Extract the final v2.15.0 publication-handoff ZIP to its own folder.
- Install Git 2.x.
- Have a normal local clone of `https://github.com/gmoon-code/research-methods.git`.
- Be authenticated to GitHub through your normal Git credential manager or SSH configuration.
- Keep the local clone clean. The helper refuses a clone with tracked or untracked changes.
- Have `git config user.name` and `git config user.email` configured before the real push.

No GitHub token, Cloudflare credential, class code, or model credential belongs in this repository.

## Step 1 — local publication check

From the extracted release folder:

```bash
python scripts/prepare-github-publication-v2.15.0.py --check
```

This verifies the frozen release manifest, reruns the public-GitHub gate, and computes the exact Git tree SHA without modifying the release.

## Step 2 — dry run against your clone

```bash
python scripts/prepare-github-publication-v2.15.0.py \
  --target "PATH_TO_YOUR_CLONED_RESEARCH_METHODS_REPO" \
  --dry-run
```

The helper will:

1. refuse a dirty target clone;
2. verify the target's `origin` is `gmoon-code/research-methods`;
3. read and remember the current remote `main` commit;
4. fetch `origin/main`;
5. create an isolated temporary Git worktree;
6. replace the temporary worktree contents with the frozen v2.15.0 release;
7. stage every release file with line-ending conversion disabled;
8. compare the staged Git tree SHA with the source release Git tree SHA; and
9. stop without committing or pushing.

A successful dry run ends with:

`DRY RUN PASS: no branch was pushed; main and Pages were not changed.`

## Step 3 — publish the release candidate branch

After the dry run passes:

```bash
python scripts/prepare-github-publication-v2.15.0.py \
  --target "PATH_TO_YOUR_CLONED_RESEARCH_METHODS_REPO"
```

Before the push, the helper reruns the frozen manifest check, public-GitHub readiness gate, repository/origin checks, and exact Git-tree comparison. The complete browser/release-engineering suite was run before the ZIP was frozen and is not a publication prerequisite. Owners who intentionally have the full QA toolchain can opt in with `--full-release-verification`. The helper then creates one candidate commit in the isolated temporary worktree and pushes only:

`HEAD:refs/heads/release/v2.15.0-free-public`

After the push it verifies all three conditions:

- the remote release branch points to the candidate commit;
- the remote release branch Git tree equals the frozen release Git tree; and
- remote `main` is still exactly the commit recorded before publication.

The helper does not call the GitHub Pages API and does not merge anything.

## Existing release branch protection

If `release/v2.15.0-free-public` already exists, the helper refuses to overwrite it.

Only after deliberately reviewing that branch can an owner choose:

```bash
python scripts/prepare-github-publication-v2.15.0.py \
  --target "PATH_TO_YOUR_CLONED_RESEARCH_METHODS_REPO" \
  --replace-release-branch
```

Replacement uses `--force-with-lease` against the exact remote branch SHA observed before the push. It still cannot update `main`.

## What this step does not do

This publication step does **not**:

- merge the release branch to `main`;
- change the repository's default branch;
- enable or configure GitHub Pages;
- create GitHub Actions workflows;
- deploy the Cloudflare Worker;
- set `RMS_CHAT_ACCESS_CODE`;
- populate `assets/runtime-config.js`; or
- perform a live model request.

After the branch is published and verified, the next gate is review of the GitHub branch itself. Only after that review should `main` or GitHub Pages be considered.
