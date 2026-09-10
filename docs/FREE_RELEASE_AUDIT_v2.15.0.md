# Research Methods Studio v2.15.0 FREE release audit

v2.15.0 changes the Research Chat inference provider while preserving the student application and the v2.14 privacy/scaffolding/citation boundaries.

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

Before publication, the release received an additional public-repository gate. The top-level README and START_HERE now contain only current v2.15.0 FREE instructions. Superseded paid-provider deployment documents and the early provider-reference backend were moved under `docs/archive/` with explicit warnings. `SECURITY.md` and `docs/PUBLIC_GITHUB_READINESS_v2.15.0.md` define the public/private boundary. The new `scripts/verify-public-github-readiness-v2.15.0.py` rejects active deployment workflows, nonblank checked-in Chat endpoints, root-absolute GitHub Pages asset paths, local credential artifacts, prominent legacy deployment files, and unexpected contact-like data in runtime/example/pilot areas.

## GitHub branch-first publication hardening

The first future GitHub write is now a review branch rather than a direct `main` update. `scripts/prepare-github-publication-v2.15.0.py` verifies the frozen release, requires a clean canonical clone, stages the release in an isolated worktree, compares Git tree SHAs before push, pushes only `release/v2.15.0-free-public`, and verifies both the remote branch tree and an unchanged remote `main`. An existing release branch is not overwritten unless the owner explicitly requests force-with-lease replacement.

This path does not contain a GitHub API token, does not enable Pages, and does not merge. Its offline bare-repository simulation passed 5/5 safety checks.
