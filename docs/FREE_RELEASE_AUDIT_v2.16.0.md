# Research Methods Studio v2.16.0 FREE release audit

**Status**  Release-candidate audit in progress. Final conclusions require the complete v2.16 functional/browser gate and final release manifest.


v2.16.0 retains the zero-cost Cloudflare Workers AI provider while adding the redesigned student interface, full-stage future preview, authenticated teacher entry, and signed teacher-session backend. The established privacy, scaffolding, citation-verification, and student-authorship boundaries remain part of the release contract.

## Material changes

- removed the executable OpenAI Responses API call
- removed the OpenAI API-key requirement
- removed the Vercel production fallback/configuration from the current free architecture
- moved the current Worker to `backend/cloudflare-workers-ai/`
- added Cloudflare Workers AI binding `AI`
- locked the release to one current free-plan JSON-Mode-capable model
- reduced the model output budget to 1,100 tokens
- constrained production Chat endpoints to the Cloudflare `workers.dev` root
- preserved class-code authentication, exact-origin CORS, rate limits, client/server context minimization, PII best-effort redaction, verified-source allowlisting, output enforcement, Stage/scaffold server control, and v2.13 renderer compatibility
- added a clear free-allocation exhaustion response
- changed deployment so only the class code is a secret
- kept runtime Chat endpoint blank until owner deployment

## Important limitation

This release can enforce its provider/model code path, but an offline repository cannot inspect a future Cloudflare account's subscription state. The no-cost guarantee therefore depends on deploying through Cloudflare Workers Free and not enabling paid Workers or prepaid AI billing. Current Cloudflare documentation states that Workers Free does not bill Workers AI overage; operations fail after the daily free allocation is exhausted.

## Hosted status

Offline package readiness can pass before deployment. Hosted Research Chat remains NOT YET GO until the real Worker and real Workers AI smoke test pass.


## Public GitHub hardening

The v2.16.0 public-repository gate checks the current production configuration and public/private boundary. The top-level README and START_HERE contain current v2.16.0 FREE instructions, while superseded provider and deployment records remain under `docs/archive/` with explicit warnings. `SECURITY.md` and `docs/PUBLIC_GITHUB_READINESS_v2.16.0.md` define the credential boundary. The `scripts/verify-public-github-readiness-v2.16.0.py` gate requires the validated public `workers.dev` endpoint, rejects authentication secret material and local build artifacts, checks GitHub Pages relative paths, audits the permitted browser network modules, validates the authenticated teacher-entry boundary, and scans runtime/example/pilot areas for unexpected contact-like data.

## GitHub branch-first publication hardening

The first future GitHub write is now a review branch rather than a direct `main` update. `scripts/prepare-github-publication-v2.16.0.py` verifies the frozen release, requires a clean canonical clone, stages the release in an isolated worktree, compares Git tree SHAs before push, pushes only `release/v2.16.0-free-public`, and verifies both the remote branch tree and an unchanged remote `main`. An existing release branch is not overwritten unless the owner explicitly requests force-with-lease replacement.

This path does not contain a GitHub API token, does not enable Pages, and does not merge. Its offline bare-repository simulation passed 5/5 safety checks.
