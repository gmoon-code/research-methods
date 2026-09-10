# Production acceptance checklist — v2.15.0 FREE

Research Chat is **NOT YET GO** until every applicable item is checked.

## Zero-cost account boundary

- [ ] Cloudflare account is using Workers Free.
- [ ] Workers has not been upgraded to a paid plan for this deployment.
- [ ] Prepaid AI Gateway billing is not enabled for this deployment.
- [ ] No paid external AI API credential is configured or required.

## Worker configuration

- [ ] Worker deploys from `backend/cloudflare-workers-ai/`.
- [ ] `AI` Workers AI binding is present.
- [ ] model is exactly `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.
- [ ] `RMS_CHAT_ACCESS_CODE` is stored as a Worker secret and is 16–256 characters.
- [ ] allowed origin is exactly the intended GitHub Pages origin.
- [ ] all three rate-limit bindings are active.

## Browser/security

- [ ] `assets/runtime-config.js` contains only the public `workers.dev` endpoint after deployment.
- [ ] no model API key exists in page source, browser storage, network requests, or repository files.
- [ ] class code is absent from project JSON/backups and request bodies.
- [ ] wrong class code returns 401.
- [ ] missing/disallowed Origin returns 403.
- [ ] project-context OFF sends no project summary, source, Stage, or focused-field content.
- [ ] raw dataset fields are excluded from automatic Chat context.
- [ ] unverified project sources cannot be rendered as citations.

## Real hosted smoke test

- [ ] authenticated GET health reports `version=2.15.0`.
- [ ] health reports `provider=cloudflare-workers-ai` and `free_edition=true`.
- [ ] health reports the locked free model.
- [ ] one non-sensitive real Workers AI request passes the response contract.
- [ ] a daily-free-limit error, if encountered, is presented as temporary Chat unavailability without affecting the rest of the application.

## Website publication

- [ ] GitHub Pages deploys from `main` and repository root only when ready.
- [ ] website loads with no console-breaking errors.
- [ ] 18-stage route/progress/current work remain visible.
- [ ] Help, Snapshot, Labs, Chat, Word `.doc` export, backup/recovery, and mobile layouts pass current QA.
- [ ] teacher approves the final privacy/use notice for classroom use.
