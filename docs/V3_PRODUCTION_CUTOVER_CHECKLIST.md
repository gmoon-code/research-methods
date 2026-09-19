# Research Methods Studio v3.0.0 Production Cutover Checklist

## Purpose

This checklist controls the first production cutover from the frozen v2.17.1 public application to Research Methods Studio v3.0.0.

The cutover changes the static application served from `main`.

It does not require redeploying either Cloudflare Worker.

The existing Research Chat Worker remains

`rms-research-chat-free`

The isolated v3 Admin and public content Worker remains

`rms-research-methods-v3`

## Frozen recovery references

The v2.17.1 application baseline is

`bf02a3e513ebdf5eedaa5955d07f75619b0e38b4`

The immutable release tag is

`v2.17.1`

The pre-cutover recovery branch is

`backup/v2.17.1-pre-v3.0.0-cutover-2026-09-19`

That branch must continue to point to the frozen v2.17.1 commit.

Do not move the v2.17.1 tag.

Do not force-update `main` as a rollback mechanism.

## Already completed acceptance gates

Before the v3.0.0 release-preparation pass, the following gates were completed.

- isolated v3 Worker deployment completed
- SQLite `ContentReleaseCoordinator` deployment verified
- authenticated production content canary passed
- publish, second publish, parent linkage, rollback, semantic restoration, and revision history passed
- real Workers AI smoke passed
- Admin Content Studio publication automated gate passed
- interactive Admin publication workflow passed
- public content loader focused regression passed
- complete application regression passed
- browser adapter smoke passed
- real student-page published-content path passed
- forced bounded bundled-fallback path passed
- late remote response did not replace content after startup

These gates must remain represented by a green final release-candidate regression after the v3.0.0 metadata changes.

## Release-candidate invariants

Before merge, verify all of the following.

- `package.json` reports `3.0.0`
- `assets/runtime-config.js` reports `3.0.0`
- student Research Chat remains on `rms-research-chat-free`
- public content remains on `rms-research-methods-v3`
- Admin content remains on `rms-research-methods-v3`
- public content reads use only `GET /content/public`
- the public loader sends no Admin credential
- research-data collection remains disabled
- the bundled curriculum remains a complete fallback
- PR #9 is still based on the frozen v2.17.1 `main`
- the pre-cutover backup branch still points to the frozen v2.17.1 commit
- no v2 release tag has moved

## Final release-candidate QA

Run the exact final candidate from a detached temporary worktree.

Required results

- v3 release-readiness regression passes
- public content loader focused regression passes
- full regression passes with zero failures
- browser adapter smoke passes
- candidate HEAD and tree remain unchanged through QA

A warning that a temporary Windows Chromium QA profile cannot be removed immediately is non-blocking when the browser smoke itself reports PASS.

Any functional test failure blocks cutover.

## Pre-merge remote verification

Immediately before merge, confirm

- PR #9 head equals the exact tested release candidate
- `main` still equals `bf02a3e513ebdf5eedaa5955d07f75619b0e38b4`
- PR #9 has no merge conflict
- the recovery branch still equals the frozen v2.17.1 commit
- `rms-research-methods-v3` still returns a current public release
- the public response contains one complete validated 18-stage release
- the existing `rms-research-chat-free` service remains the configured student Chat endpoint

Do not redeploy the v3 Worker merely to perform the frontend cutover.

## Merge method

Use a squash merge for PR #9 after the final release gate passes.

Suggested squash title

`Release v3.0.0 Admin Workspace and published content loader`

The squash merge creates one application-release commit on `main`.

Do not delete the recovery branch during the cutover window.

Do not create the final `v3.0.0` tag before post-merge production verification passes.

## Immediate post-merge checks

After the static site has updated, verify the production student site in a fresh browser session.

Required checks

- the application loads without remaining inert
- Stage 1 opens normally
- route and progress navigation render
- current project storage remains usable
- safe runtime content state reports either the current published release or a bundled fallback
- the page does not perform a late content swap after interaction begins
- Research Chat configuration still points to `rms-research-chat-free`
- Admin Workspace remains inaccessible without a verified private session

Then verify the private Admin path.

Required checks

- private login succeeds with the existing private access boundary
- Admin Workspace displays the seven v3 primary areas
- Content Studio connects to the isolated v3 publication service
- current publication state loads
- revision history loads
- no publication action is required merely to verify the cutover

Do not create a temporary content revision solely for the post-merge application check unless a content-publication regression specifically requires it.

## Production acceptance

The v3.0.0 application release is accepted only after the immediate post-merge student and Admin checks pass.

After acceptance

- record the accepted `main` commit SHA
- create the annotated `v3.0.0` tag at that exact accepted commit
- never move the tag after creation
- update PR or release notes with the accepted SHA and verification evidence
- keep the v2.17.1 tag intact

## Recovery decision

Choose the recovery path based on the failure domain.

### Content-only problem

Use Content Studio rollback when

- the application shell works
- student navigation works
- the public loader works
- the problem is limited to currently published instructional guidance

Content rollback creates a new chronological content release from a prior immutable revision.

It does not change application source.

### Application-release problem

Use source-control rollback when the v3.0.0 application itself is unsafe or unusable.

Examples include

- the student application does not start
- startup remains inert
- project loading is broken
- Stage navigation is broken
- authentication routing is broken
- Admin Workspace cannot enforce its private boundary
- runtime configuration unexpectedly points student Chat at the wrong Worker
- the public loader causes a failure that bundled fallback does not contain

Revert the single v3.0.0 squash commit on `main`.

Use a normal revert commit.

Do not force-reset `main`.

Do not move the v2.17.1 tag.

The preserved v2.17.1 commit and backup branch provide the comparison target for verifying the rollback.

## Post-revert verification

After an application revert, verify

- the public source again matches the expected v2.17.1 application behavior
- the student application starts
- the student Research Chat endpoint remains `rms-research-chat-free`
- local project loading still works
- no v3 Admin content credential is exposed
- the isolated v3 Worker remains separate and can stay deployed while the frontend is rolled back

The isolated content Worker does not need to be deleted to restore the v2.17.1 frontend.

## Cutover boundary

This checklist authorizes no merge by itself.

The merge occurs only after an exact release candidate passes the final gate and the production cutover is deliberately initiated.

PR #9 remains draft until that final gate is accepted.
