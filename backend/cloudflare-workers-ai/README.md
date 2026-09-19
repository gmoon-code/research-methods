# Research Chat FREE backend

This Worker is the zero-cost Research Chat backend for Research Methods Studio v2.16.0.

It uses Cloudflare Workers AI through the `AI` binding. It does **not** use an OpenAI API key and does not call a paid third-party model API.

The Worker uses three application-authentication secrets:

- `RMS_CHAT_ACCESS_CODE` for student Research Chat access
- `RMS_TEACHER_ACCESS_CODE` for teacher login
- `RMS_TEACHER_SESSION_SECRET` for signing teacher-session tokens

Never commit any real secret value to GitHub, screenshots, issues, browser
JavaScript, or `assets/runtime-config.js`.

The model is deliberately fixed to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. The v2.16.0 release gate uses this model because Cloudflare currently documents it as available on Workers AI and supporting JSON Mode. A model change requires a new quality/security verification pass.

To keep the deployment genuinely zero-cost, use a **Cloudflare Workers Free** account and do not upgrade the Workers plan or configure prepaid AI Gateway billing. Cloudflare currently provides 10,000 Workers AI Neurons per day free. On Workers Free, requests beyond that allocation fail until the daily reset instead of creating overage charges.

From the repository root, run:

```bash
npm run check:cloudflare
npm run deploy:cloudflare
```

The deployment helper asks only for the class code. No AI API key is required.


## Teacher authentication

`POST /teacher/session` verifies the separate teacher access code and issues a
signed session token. `POST /teacher/session/verify` validates that token.
Teacher sessions have an eight-hour maximum lifetime. Authentication is
origin-restricted and rate-limited, and failures use generic responses that do
not expose credential details.


## v3 Admin content publication development path

The v3 development branch adds a strongly ordered content-publication service behind the same Worker.

Content publication uses the SQLite-backed `ContentReleaseCoordinator` Durable Object bound as `RMS_CONTENT_COORDINATOR`. The coordinator stores the authoritative current release and immutable revision history. Publication conflict checks and release writes are performed in one transaction.

The repository configuration contains the Durable Object binding and class declaration. It contains no account-specific storage identifier.

For the v3 development deployment path, run

```bash
npm run check:cloudflare:v3
npm run deploy:cloudflare:v3
```

The v3 deployment helper keeps the existing application secrets temporary, deploys the Worker, and can run the production content canary before the Research Chat smoke test.

The content canary publishes only content that is semantically identical to the current public release, or to the bundled 18-stage seed when no prior release exists. It creates a second identical revision and rolls back to the first revision, then verifies that public content is unchanged.

The student application does not consume the remote content release until the separate public-loader milestone is implemented and verified.
