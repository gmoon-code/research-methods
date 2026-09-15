# Research Methods Studio v2.16.0 FREE — offline release verification

**Status**  Pending final v2.16 verification. This document is a release-candidate working record until the complete validation suite and final manifest both pass.


Verification date: 2026-09-09

## Status

**Offline application/package gate: PASS.**

**Hosted Research Chat: NOT YET GO.** A future Cloudflare Workers Free deployment must still pass the real authenticated production smoke test before classroom Chat is enabled.

## Current release gates

The authoritative release command is:

```bash
python scripts/verify-complete-release-v2.16.0.py
```

The clean v2.16.0 release tree passed:

- Research Chat core, browser adapter, Cloudflare Workers AI, endpoint, and deployment-helper contracts: **51/51**
- retained functional-engine regressions: **28/28**
- static HTTP asset checks: **7/7**
- rendered Research Chat checks: **9/9**
- Word `.doc` export checks: **7/7**
- full combined application/browser checks: **58/58**
- accessibility and responsive-layout checks: **22/22**
- browser privacy/network serialization smoke: **PASS**
- JavaScript syntax checks: **PASS**
- public-package artifact/credential scan: **PASS**
- Cloudflare FREE deployment-helper offline preflight: **PASS**

Historical QA scripts keep their original versioned filenames so the repository preserves release history. They are invoked by the v2.16.0 verifier only where the behavior they test remains part of the current contract. Obsolete provider fixtures were updated to the current `workers.dev` endpoint boundary; historical release-lock tests that compare old temporary release directories are not treated as current gates.

## Zero-cost architecture verified offline

The executable Research Chat path has no OpenAI API call, model API key, Vercel fallback, or browser-editable production backend address. The production Worker uses the Cloudflare Workers AI `AI` binding and the release is locked to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

The public runtime configuration ships with a blank Chat endpoint. Therefore publishing the static website later does not activate Research Chat until the owner deliberately deploys and tests the free Worker and writes its public `workers.dev` URL into `assets/runtime-config.js`.

## What this verification cannot prove

Offline tests cannot inspect a future Cloudflare account's billing plan or prove future service availability. The $0 deployment boundary depends on keeping the Worker on Cloudflare Workers Free and avoiding paid/prepaid AI billing. If the daily free Workers AI allowance is unavailable or exhausted, v2.16.0 makes Chat temporarily unavailable while leaving the rest of Research Methods Studio usable.


## Public repository readiness gate

The public-repository gate is `python scripts/verify-public-github-readiness-v2.16.0.py`. It validates the checked-in production `workers.dev` endpoint, confirms that authentication secrets are absent from public runtime configuration, checks repository-path GitHub Pages compatibility, rejects automatic deployment workflows and local build or credential artifacts, permits only the audited Research Chat adapter and teacher session client to perform browser network requests, validates the authenticated teacher-entry boundary, and confirms that superseded provider/deployment records remain quarantined under `docs/archive/`. Final offline release verification remains pending until the complete v2.16 functional/browser suite and final manifest pass.

## GitHub publication handoff gate

The public release now includes `scripts/prepare-github-publication-v2.16.0.py`. The helper uses an isolated Git worktree and publishes only `release/v2.16.0-free-public`. It never merges `main` or configures GitHub Pages.

Offline publication simulation passed **5/5** branch-safety checks:

- dry run created no remote release branch and left remote `main` unchanged;
- test publication created only the release branch and its remote Git tree matched the frozen source release tree;
- the target clone's checked-out branch and working files remained unchanged;
- an existing release branch was refused by default and explicit replacement used force-with-lease while preserving `main`;
- dirty targets, noncanonical origins, `main` as a publication branch, and test-only bypass flags outside test mode were refused.

The release also includes `.gitattributes` with `* -text` and normalizes publication file modes so Windows line-ending or executable-bit behavior cannot silently change the candidate Git tree. The helper computes the source Git tree from the frozen package and compares it with the staged candidate before any push, then compares the pushed remote branch tree again after publication.

No real GitHub branch or Pages setting was changed during this offline handoff verification.

## Publication versus release-engineering verification

The complete release verifier remains available for maintainers with the full QA toolchain. Normal GitHub publication does not invoke it automatically. Publication revalidates the frozen file manifest, public-repository checks, exact Git tree, clean target clone, canonical origin, remote `main`, and release-branch protections. This separation prevents platform-specific development dependencies from blocking byte-exact publication of an already verified release.

The optional complete suite still assumes the documented release-engineering QA environment, including its browser and Python test dependencies. These dependencies are deliberately outside the normal owner publication path.
