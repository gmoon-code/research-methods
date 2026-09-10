# Public GitHub publication audit — v2.15.0 FREE

## Scope

This audit was performed on the exact v2.15.0 FREE package intended to become the future public GitHub Pages repository. It covers public-repository hygiene, current documentation, credential/privacy boundaries, GitHub Pages path compatibility, and preservation of the already-verified application behavior.

No GitHub repository was modified and no website/backend was deployed during this audit.

## Findings corrected before freeze

1. The top-level README and START_HERE still contained extensive v2.13-era instructions. Those instructions included an obsolete optional AI-backend workflow and statements that no longer described v2.15.0 Chat behavior. They were replaced with current-only v2.15.0 FREE documentation.
2. The old top-level `server/` provider-reference backend was no longer part of the current release but remained easy to mistake for a deployable backend. It was moved under `docs/archive/v1.2-provider-reference/` with an explicit superseded notice.
3. v2.14 OpenAI/Vercel-capable deployment/security documents were still prominent under `docs/`. They were moved under `docs/archive/v2.14-paid-provider/` and clearly marked historical.
4. Teacher Chat settings still used generic model-provider-key wording. The current UI now states that the FREE release uses the Cloudflare Workers AI binding and does not require a model-provider API key.
5. A dedicated `SECURITY.md` and current publication-readiness document were added.
6. The complete release verifier now invokes the public GitHub readiness verifier, so public-repository regressions become release failures.

## Public-safety checks

The public gate confirms:

- no active `.github/workflows` deployment directory
- no checked-in Chat endpoint
- no real class Chat code
- no `.env`, `.dev.vars`, Wrangler local state, `node_modules`, caches, or private-key files
- no root-absolute production asset links that would break a repository-path GitHub Pages site
- no unexpected browser network-capable module outside the audited Research Chat adapter
- no prominent current paid-provider/Vercel deployment instructions
- old provider/deployment material quarantined under `docs/archive/`
- no obvious non-fixture email address detected in runtime/example/pilot areas
- no user/school-specific name strings identified by the publication audit's targeted content scan

The pilot/rehearsal and exemplar files included in the repository are generic templates or synthetic instructional fixtures. This automated review cannot prove the absence of every possible contextual identifier, so a final human inspection of staged Git changes remains required before publication.

## GitHub Pages compatibility

The intended site is a GitHub **project page**, so the application must work beneath a repository path. `index.html` and `404.html` contain no root-absolute local `src`/`href` paths, and the production static-asset smoke test passes.

The current publishing plan is branch-first. The exact frozen tree is published to `release/v2.15.0-free-public` and verified remotely before any later merge to `main`. GitHub Pages, when separately approved, will publish from `main` and `/ (root)`. The repository contains `.nojekyll` and does not require a build step.

A cross-platform publication helper now performs an isolated-worktree dry run, compares source and candidate Git tree SHAs, refuses dirty or unexpected origins, refuses an existing release branch by default, pushes only the release branch, and verifies that remote `main` remains unchanged.

## Current hosted boundary

`assets/runtime-config.js` remains blank. Publishing this repository later therefore does not activate Research Chat automatically.

The hosted Research Chat status remains **NOT YET GO** until the future Cloudflare Workers Free deployment, class-code secret configuration, production smoke test, and acceptance checklist are completed.

## External provider state

GitHub Pages and Cloudflare Workers/Workers AI are external services whose plans, limits, and model availability can change. Their current documentation must be rechecked immediately before deployment.
