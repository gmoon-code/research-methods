# Start Here — Research Methods Studio v2.17.1 FREE

This is the current application and release-verification entry point.

## 1. Current state

The v2.17.1 static application is merged to `main`.

The release adds the authenticated Teacher Workspace with seven integrated areas:

- Overview
- Review Queue
- Students
- Assignment Setup
- Analytics
- Chat Controls
- Recovery

The Cloudflare Research Chat backend was not changed or redeployed for v2.17.1. It remains on the validated v2.16.0 backend service contract.

## 2. Verify the current static application

From the repository root with Node.js 20+ installed:

```bash
npm run test:research-chat
npm run test:research-chat:browser
```

The v2.17.1 merge was accepted only after the complete Teacher Workspace regression and integrated browser QA passed on the exact application tree later merged to `main`.

## 3. Release metadata and tagging

A v2.17.1 tag must point only to a verified `main` commit whose static application metadata reports v2.17.1.

Do not tag an earlier commit whose `package.json`, `assets/runtime-config.js`, README, or current guidance still identifies the static application as v2.16.0.

Historical v2.16.0 release manifests, verifier filenames, and deployment documents are retained because the backend and deployment architecture did not change.

## 4. Research Chat backend

The Research Chat backend remains optional and separate from the static application release.

The current backend:

- uses Cloudflare Workers AI
- requires no paid model API key
- uses the public `workers.dev` endpoint stored in `assets/runtime-config.js`
- keeps student class-code authentication separate from teacher authentication
- keeps teacher credentials and session-signing secrets out of the public repository

Use the existing v2.16.0 backend deployment documents for any backend redeployment.

## 5. Student data

The research notebook is stored in browser `localStorage`. Students should download JSON backups regularly. Word `.doc` export provides a readable copy but is not a full recovery backup.

The Teacher Workspace does not silently persist imported review packets and does not restore student projects itself.

## 6. Privacy when Chat is enabled

The browser sends the student's question and recent Chat history. Project context is included only when **Use my current project context** is enabled.

Before network transmission, the browser excludes raw dataset fields and obvious identifying fields. The Worker repeats server-side minimization. The class Chat code stays outside the project JSON and is stored only for the browser session.

Research Chat is a support tool. It does not replace the student's paper, invent data, or treat unverified project sources as verified citations.

## 7. Zero-cost boundary

The unchanged backend service uses Cloudflare Workers AI under the v2.16.0 backend contract. To keep the hosted configuration at $0, remain on Workers Free and do not enable Workers Paid or prepaid AI Gateway billing.

Provider pricing and model availability can change. Recheck Cloudflare's current documentation immediately before any backend redeployment.

## 8. Public repository boundary

Safe to publish:

- static application files
- current Cloudflare Worker source
- tests and QA records
- generic instructional fixtures
- `.env.example` with blank secret values
- deployment documentation

Never publish:

- a real `RMS_CHAT_ACCESS_CODE`
- a real `RMS_TEACHER_ACCESS_CODE`
- a real `RMS_TEACHER_SESSION_SECRET`
- `.env` or `.dev.vars`
- Wrangler local state
- `node_modules`
- student project backups or exported student work
- real participant/student datasets
- screenshots containing student information
- Cloudflare credentials or tokens

See `SECURITY.md`.

## 9. Teacher entry

Teachers enter through `teacher.html`. The teacher credential is sent directly to the Cloudflare Worker and is never saved in local storage or committed to the repository.

The Worker issues a signed session token after successful authentication. Teacher tools become available only after that token verifies.

The production teacher routes remain `/teacher/session` and `/teacher/session/verify`. Teacher sessions have an eight-hour maximum lifetime. Leaving teacher mode clears the browser-session token.
