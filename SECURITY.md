# Security and privacy notes

## Current production boundary

Research Methods Studio v2.16.0 FREE is a static GitHub Pages application with an optional Cloudflare Workers AI backend for Research Chat.

The repository is designed to be public. It must never contain real credentials or student/participant data.

## Secrets

The v2.16.0 FREE Worker requires three application-authentication secrets:

- `RMS_CHAT_ACCESS_CODE` authenticates student Research Chat access.
- `RMS_TEACHER_ACCESS_CODE` authenticates teacher entry.
- `RMS_TEACHER_SESSION_SECRET` signs short-lived teacher session tokens.

Do not commit the real values. Do not place it in `assets/runtime-config.js`, `.env.example`, GitHub issues, screenshots, browser JavaScript, or student project files.

The current executable path uses the Cloudflare Workers AI binding and does not require an OpenAI or other third-party model API key.

## Files that must remain local

Do not commit:

- `.env`
- `.dev.vars`
- `.wrangler/`
- `node_modules/`
- local logs/caches
- Cloudflare tokens/credentials
- student JSON backups
- Word exports containing student work
- real datasets or participant information

The checked-in `.gitignore` blocks the common local secret/build paths, but the user is still responsible for reviewing staged changes before committing.

## Browser data

The research project is stored locally in the browser. JSON backups may contain the student's full research notebook and should be handled as student work.

The class Chat code is stored in session storage and excluded from project backups.

## Research Chat data minimization

When Chat context is enabled, the browser minimizes project context before transmission. Raw-dataset and obvious identifying fields are excluded. The backend repeats the minimization.

The browser accepts only the owner-configured clean HTTPS `workers.dev` endpoint in the v2.16.0 FREE production mode.

## Reporting a problem

Before a classroom deployment, treat any accidental credential or student-data exposure as a release blocker. Rotate the exposed class code, remove the material from the repository and relevant Git history, and re-run both release verifiers before using the site again.


## Teacher-session security

Teacher authentication is separate from the student Research Chat class code.
The browser sends the teacher access code only to the Worker login route. The
credential is not stored in browser persistence.

Successful login returns a signed teacher-session token. The token has an
eight-hour maximum lifetime and is kept in `sessionStorage`. Teacher tools are
shown only after `/teacher/session/verify` accepts the token. Tampered,
expired, or incorrectly signed tokens fail closed.

The legacy query-string teacher mode and the former client-only
`rms_teacher_mode_v1` flag are not accepted in v2.16.0.

The public Worker URL is configuration, not a credential. None of the three
secret values belongs in `assets/runtime-config.js`.
