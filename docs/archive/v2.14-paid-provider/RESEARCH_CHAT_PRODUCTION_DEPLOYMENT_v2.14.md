# Research Chat Production Deployment v2.14.2

The complete offline application is already verified. Live Research Chat still requires a server-side endpoint because the OpenAI API key must never be shipped to GitHub Pages or browser JavaScript.

**Vercel is not required.** The current package includes a Cloudflare Workers deployment path and retains the Vercel function as an optional alternative.

## 1. Verify the complete repository before any deployment

From the repository root:

```bash
python scripts/verify-complete-release-v2.14.2.py
```

Do not deploy a repository that fails this gate.

The complete package can also be regenerated deterministically from the frozen v2.13.3 source ZIP using `scripts/apply-v2.14-production-overlay.py`. Canonical rebuilding requires source SHA-256 `6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78`.

## 2. Keep the static site separate from the API credential

GitHub Pages may continue to host the student application. `assets/runtime-config.js` may contain only the public Research Chat endpoint.

Never place either of these values in the public site or repository:

```text
OPENAI_API_KEY
RMS_CHAT_ACCESS_CODE
```

## 3. Preferred no-Vercel path: Cloudflare Workers

Preferred guarded first-deployment command from the repository root:

```bash
npm run deploy:cloudflare
```

Full instructions:

`docs/CLOUDFLARE_RESEARCH_CHAT_DEPLOYMENT_v2.14.2.md`

The current Worker is under `backend/openai-cloudflare-worker/`. It imports the same audited `api/research-chat.js` route and adds Cloudflare-native abuse controls.

The checked-in Worker configuration requires:

```text
OPENAI_API_KEY            secret
RMS_CHAT_ACCESS_CODE      secret, 16–256 random characters
RMS_ALLOWED_ORIGINS       https://gmoon-code.github.io
OPENAI_MODEL              gpt-5.6-terra by default
```

It also declares wrong-code, per-session, and class-wide Cloudflare rate-limit bindings. The deployment helper uploads both required secrets with the first deployment rather than attempting two sequential first-deploy secret updates.

## 4. Optional alternative: Vercel

If a Vercel account is used later, the existing route remains:

```text
/api/research-chat
```

Set the same four server settings:

```text
OPENAI_API_KEY=<server-side OpenAI project key>
RMS_CHAT_ACCESS_CODE=<random value 16–256 characters>
RMS_ALLOWED_ORIGINS=https://gmoon-code.github.io
OPENAI_MODEL=gpt-5.6-terra
```

The tested model identifiers are:

```text
gpt-5.6-terra
gpt-5.6-luna
gpt-5.6-sol
gpt-5.6
```

An unsupported model value fails closed. Vercel deployment still requires a durable platform/shared rate limit because the shared Node route does not pretend that an in-memory serverless counter is reliable.

## 5. Configure the public endpoint

After either backend exists, run from the repository root:

```bash
node scripts/configure-chat-endpoint.mjs https://YOUR-CLEAN-HTTPS-CHAT-ENDPOINT
```

Examples:

```text
https://rms-research-chat.YOUR-SUBDOMAIN.workers.dev/
https://your-project.vercel.app/api/research-chat
```

The command rejects insecure production URLs, credentials, query strings, and fragments. It writes only the public endpoint to `assets/runtime-config.js`.

## 6. Run the real production smoke test

```bash
RMS_CHAT_ENDPOINT='https://YOUR-CLEAN-HTTPS-CHAT-ENDPOINT' \
RMS_CHAT_ACCESS_CODE='YOUR_LONG_CLASS_CODE' \
RMS_CHAT_ORIGIN='https://gmoon-code.github.io' \
node scripts/test-production-chat.mjs
```

The connection is proven only when the script ends with:

```text
PRODUCTION RESEARCH CHAT SMOKE TEST: PASS
```

## 7. Finish production acceptance

Run every item in `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.14.md` against the actually hosted student site and backend. Teacher/school privacy approval and cost controls remain required before classroom GO.
