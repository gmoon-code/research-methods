# Research Methods Studio v2.15.0 FREE

Research Methods Studio is a static, student-facing research-methods workspace that guides students through an 18-stage research process while preserving their route, current Stage, current work, progress, and upcoming steps.

## Current release status

- **Complete static application:** offline-verified and ready for a future GitHub Pages publication gate.
- **Research Chat hosting:** intentionally not active. `assets/runtime-config.js` ships with a blank endpoint.
- **Cost architecture:** GitHub Pages for the static site plus Cloudflare Workers Free / Workers AI free allocation for Research Chat.
- **Paid model APIs:** none in the v2.15.0 executable path.
- **Automatic deployment:** none. This repository contains no active `.github/workflows` deployment directory.

Uploading the repository later will not activate Research Chat by itself. Chat becomes live only after the site owner deliberately deploys the Cloudflare Worker, sets the class code as a Worker secret, and writes the resulting `workers.dev` URL into `assets/runtime-config.js`.

## Student experience

Students retain continuous access to the research route and their progress while working through the project. Major tools include:

- 18 guided research Stages
- Current Stage and route/progress orientation
- My Research Snapshot
- Help, Research Terms, Progressive Help, and local deterministic guidance
- Literature Workspace
- Methods Lab
- Data & Statistics Lab
- Scientific Writing Lab
- Research Chat
- My Journey and teacher-review packet workflow
- Word `.doc` notebook export
- JSON backup and recovery

Research Chat is optional. If the free AI allowance is unavailable or exhausted, the rest of the application continues to work.

## Privacy boundary

The research notebook is stored in the student's browser unless the student deliberately uses Research Chat.

When Chat project context is enabled, the browser minimizes the project data before transmission. Raw dataset fields and obvious identifying fields are excluded, and the server repeats the minimization. When project context is disabled, project context is removed before the request is serialized.

The class Chat code is session-only in the browser and is not included in the project backup. The repository contains no real class code or model API key.

See `SECURITY.md` and `docs/FREE_ZERO_COST_ARCHITECTURE_v2.15.0.md`.

## Zero-cost boundary

To keep hosted Research Chat at $0, use Cloudflare Workers Free and do not upgrade to Workers Paid or configure prepaid AI Gateway billing. The release model is locked to:

`@cf/meta/llama-3.3-70b-instruct-fp8-fast`

Cloudflare currently provides a daily Workers AI free allocation. When the free allocation is exhausted on Workers Free, further AI operations fail until the allocation resets instead of producing Workers AI overage charges. Recheck Cloudflare pricing and model availability immediately before deployment because provider terms can change.

## Future GitHub Pages publication

This repository is prepared for GitHub Pages publication from a branch root. `.nojekyll` is included, page assets use relative paths, and `assets/runtime-config.js` remains intentionally blank until the backend is deliberately configured.

Current GitHub publication guidance is in `START_HERE.md`, `docs/PUBLIC_GITHUB_READINESS_v2.15.0.md`, and `docs/GITHUB_PUBLICATION_HANDOFF_v2.15.0.md`. The first remote step is a release-candidate branch, not `main` or Pages.

## Verification

Node.js 20+ and Python 3 are required for the complete offline verifier.

```bash
python scripts/verify-complete-release-v2.15.0.py
python scripts/verify-public-github-readiness-v2.15.0.py
```

The current release verification record is `docs/OFFLINE_RELEASE_VERIFICATION_v2.15.0.md`.

## Current deployment documents

Use only these for v2.15.0 FREE:

- `docs/FREE_ZERO_COST_ARCHITECTURE_v2.15.0.md`
- `docs/CLOUDFLARE_FREE_DEPLOYMENT_v2.15.0.md`
- `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.15.0.md`
- `docs/PUBLIC_GITHUB_READINESS_v2.15.0.md`

Historical release engineering records are retained under `docs/archive/`. Archived deployment instructions are superseded and must not be used for the current release.
