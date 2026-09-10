# Cloudflare Workers deployment for Research Chat v2.14.2

This is the current deployment path when no Vercel account is being used. The static Research Methods Studio application can remain on GitHub Pages. Only the Research Chat API runs on Cloudflare Workers.

The Cloudflare adapter is in `backend/openai-cloudflare-worker/`. It imports the same audited v2.14.2 route from `api/research-chat.js`; it does not maintain a separate copy of the research-methods, privacy, citation, or OpenAI logic.

## Why a separate backend is still required

GitHub Pages is static hosting. An OpenAI API key cannot be placed safely in GitHub Pages or browser JavaScript. A server-side boundary is therefore required for live Research Chat even when the rest of the application is fully static.

## Recommended first deployment

From the repository root, run:

```bash
node scripts/deploy-cloudflare-research-chat.mjs
```

or:

```bash
npm run deploy:cloudflare
```

The helper is intentionally interactive. It does not accept the OpenAI API key or class code as command-line arguments.

It performs these steps in order:

1. verifies Node 20+, the Worker files, the exact GitHub Pages origin, the required secret declarations, the three Cloudflare rate-limit bindings, and a Wrangler version new enough for the current deployment flow
2. installs the Worker-local Wrangler dependency
3. checks Cloudflare authentication and launches Wrangler's browser login using OS-keyring mode when login is needed
4. asks for `OPENAI_API_KEY` and `RMS_CHAT_ACCESS_CODE` with hidden terminal input
5. writes both values only to a temporary permissions-restricted secrets file
6. uploads both required secrets with the first deployment using `wrangler deploy --secrets-file`
7. deletes the temporary secrets file even when deployment fails
8. detects the resulting `workers.dev` endpoint
9. writes only that public endpoint to `assets/runtime-config.js`
10. offers to run the included real authenticated OpenAI production smoke test

The helper never uploads the repository to GitHub. After it succeeds, you review the local `assets/runtime-config.js` change and upload the repository manually when you are ready.

For a no-network package check before you have an account, run:

```bash
node scripts/deploy-cloudflare-research-chat.mjs --check
```

## Why the helper uploads both secrets together

The checked-in Worker configuration declares both `OPENAI_API_KEY` and `RMS_CHAT_ACCESS_CODE` as required secrets. Current Wrangler validates required secrets during deployment. Wrangler's individual `secret put` command also creates and deploys a Worker version. For a first deployment with two required secrets, the package therefore uses `wrangler deploy --secrets-file` so both encrypted values arrive with the same deployment.

Do not store either value in `wrangler.jsonc`, `assets/runtime-config.js`, GitHub, browser storage, screenshots, issues, or committed `.env`/`.dev.vars` files.

## Cloudflare files

- `backend/openai-cloudflare-worker/worker.mjs` — Cloudflare adapter and rate-limit gate
- `backend/openai-cloudflare-worker/wrangler.jsonc` — public Worker configuration
- `backend/openai-cloudflare-worker/package.json` — package-scoped current Wrangler dependency
- `scripts/deploy-cloudflare-research-chat.mjs` — guarded first-deployment helper
- `api/research-chat.js` — shared audited Research Chat server logic

The historical v2.12 Worker implementation has been retired. The current verifier rejects its legacy markers if they reappear.

## Public Worker configuration

The checked-in `wrangler.jsonc` declares:

- exact allowed browser origin `https://gmoon-code.github.io`
- model `gpt-5.6-terra`
- required secret names `OPENAI_API_KEY` and `RMS_CHAT_ACCESS_CODE`
- wrong-code limiter: 30 attempts per 60 seconds per Cloudflare-reported IP
- authenticated session limiter: 20 requests per 60 seconds
- class-wide limiter: 120 requests per 60 seconds

If the GitHub Pages origin changes, update `RMS_ALLOWED_ORIGINS` before deploying. Keep the list to the exact intended origin or origins.

Cloudflare's Worker rate-limit counters are protective and eventually consistent. They are not exact billing accounting. Keep an OpenAI project budget/usage control as a second cost-control boundary.

## Class-code requirements

Use a random class code between 16 and 256 characters. A suitable value can be generated locally with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(24))"
```

Do not use a school name, class name, student-facing account password, or short numeric code.

## Manual deployment fallback

The guided helper is preferred. If you intentionally deploy manually, keep both secrets out of shell arguments and upload them together with the deployment through Wrangler's `--secrets-file` support. Delete the temporary secrets file immediately afterward. Do not revert to two sequential first-deploy `wrangler secret put` commands.

Use a permanent Cloudflare account for the production Worker. Cloudflare has a temporary preview-account feature, but the production Research Chat package depends on its audited rate-limit bindings and persistent secrets, so the classroom deployment path intentionally remains the permanent-account flow.

## Production smoke test

If you skipped the helper's smoke-test prompt, run from the repository root after deployment:

```bash
RMS_CHAT_ENDPOINT='https://rms-research-chat.YOUR-SUBDOMAIN.workers.dev/' \
RMS_CHAT_ACCESS_CODE='YOUR_LONG_CLASS_CODE' \
RMS_CHAT_ORIGIN='https://gmoon-code.github.io' \
node scripts/test-production-chat.mjs
```

The smoke test checks missing-Origin rejection, wrong-code rejection, authenticated health, the exact release/model contract, one real non-sensitive OpenAI request, context-off neutrality, dual legacy/current response fields, and server-controlled scaffold metadata.

A successful run ends with:

```text
PRODUCTION RESEARCH CHAT SMOKE TEST: PASS
```

## Browser acceptance

After `assets/runtime-config.js` is published to GitHub Pages, test the actual student site. Verify valid/invalid class code behavior, context on/off, current Stage context, privacy wording, source-verification fallback, mobile/desktop Chat, Word `.doc` export, JSON recovery, keyboard behavior, and browser console/network activity.

Confirm that:

- no OpenAI API key is present in page source, browser storage, or browser requests
- the class code is sent only in `X-RMS-Chat-Code`
- the class code is absent from project JSON and backups
- the class code disappears with the browser session
- raw dataset fields are absent from automatically generated Chat context before transmission

## Classroom GO boundary

Do not mark Research Chat GO until the real production smoke test, browser acceptance, cost controls, teacher privacy review, and school/institutional requirements all pass.

The rest of Research Methods Studio remains usable while Research Chat is disconnected.
