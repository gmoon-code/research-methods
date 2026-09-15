# Cloudflare Workers AI FREE deployment — v2.16.0

The website can stay on GitHub Pages. Only Research Chat runs on Cloudflare.

## Before deployment

Use a Cloudflare Workers **Free** account. Do not upgrade Workers and do not enable prepaid AI Gateway billing if the requirement is zero cost.

No model API key is needed. The only secret is the class Chat code.

## Automated deployment helper

From the repository root:

```bash
npm run check:cloudflare
npm run deploy:cloudflare
```

The helper:

1. verifies Node.js 20+ and the package files
2. verifies the Workers AI binding and the locked free model
3. confirms that `RMS_CHAT_ACCESS_CODE`, `RMS_TEACHER_ACCESS_CODE`, and `RMS_TEACHER_SESSION_SECRET` are the only application-authentication secrets
4. asks you to confirm the intended Workers Free/no-paid-billing setup
5. installs the package-scoped Wrangler dependency
6. opens Cloudflare sign-in when required
7. asks for the class code using hidden terminal input
8. deploys the Worker with the class code secret
9. detects the resulting `workers.dev` URL
10. writes only that public URL to `assets/runtime-config.js`
11. optionally performs one real Workers AI smoke test

The helper does not upload the website to GitHub.

## Current Worker configuration

- Worker directory: `backend/cloudflare-workers-ai/`
- Workers AI binding: `AI`
- model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`
- allowed browser origin: `https://gmoon-code.github.io`
- student Chat secret: `RMS_CHAT_ACCESS_CODE`
- teacher login secret: `RMS_TEACHER_ACCESS_CODE`
- teacher session signing secret: `RMS_TEACHER_SESSION_SECRET`
- wrong-code rate limit: 30/minute/IP
- authenticated session rate limit: 12/minute/session
- class-wide rate limit: 60/minute

The rate limits reduce abuse. They are not a daily billing meter. The zero-overage boundary is the Cloudflare Workers Free plan itself.

## Daily free allocation

Cloudflare currently provides 10,000 Workers AI Neurons per day at no charge. On Workers Free, operations beyond the allocation fail until the daily reset. v2.16.0 handles that state as temporary Chat unavailability. Students can continue using every non-Chat part of Research Methods Studio.

## GitHub Pages later

For the owner production release, `assets/runtime-config.js` contains the already validated public `workers.dev` endpoint. That endpoint is not a credential. No class code, teacher access code, teacher-session signing secret, or model API key belongs in GitHub.


## Teacher-session deployment

Teacher authentication uses two Worker routes.

- `POST /teacher/session`
- `POST /teacher/session/verify`

The teacher access code should be different from the student Research Chat
class code. The signing secret should be generated from cryptographically
secure random bytes and should not be reused as a human-entered password.

Changing `RMS_TEACHER_SESSION_SECRET` invalidates previously issued teacher
sessions. This is expected and provides a simple session-revocation boundary.
