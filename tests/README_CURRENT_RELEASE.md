# Current release test gates — v2.15.0 FREE

Historical regression files from earlier releases remain as evidence, but the authoritative current gate is:

```bash
python scripts/verify-complete-release-v2.15.0.py
```

The v2.15.0 gate verifies the complete 18-stage application plus the zero-cost Cloudflare Workers AI architecture. It includes the Research Chat core/adapter/Worker/deployment-helper contracts, retained functional-engine regressions, current static integration tests, HTTP asset checks, Chromium privacy/network serialization, rendered Research Chat behavior, Word `.doc` export, full browser regression, responsive behavior, and accessibility.

The current Chat contract requires a Cloudflare Workers AI binding, exactly one verified free-edition model, no model API key, no same-origin paid-provider fallback, a `workers.dev` production endpoint, session-only class-code authentication, client/server context minimization, and fail-closed handling when the free AI allocation is unavailable.

Earlier OpenAI/Vercel release tests and documents are historical only and are not the v2.15.0 deployment instructions.
