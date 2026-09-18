# Security and privacy notes

## Current production boundary

Research Methods Studio v2.17.1 FREE is the current static GitHub Pages application.

The optional Cloudflare Workers AI Research Chat backend was not changed for v2.17.1 and remains on its validated v2.16.0 backend service contract.

The repository is designed to be public. It must never contain real credentials or student/participant data.

## Secrets

The current FREE Worker requires three application-authentication secrets:

- `RMS_CHAT_ACCESS_CODE` authenticates student Research Chat access.
- `RMS_TEACHER_ACCESS_CODE` authenticates teacher entry.
- `RMS_TEACHER_SESSION_SECRET` signs short-lived teacher session tokens.

Do not commit real values. Do not place them in `assets/runtime-config.js`, `.env.example`, GitHub issues, screenshots, browser JavaScript, or student project files.

The current executable backend uses the Cloudflare Workers AI binding and does not require an OpenAI or other third-party model API key.

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

The checked-in `.gitignore` blocks common local secret/build paths, but staged changes still require review before commit.

## Browser data

The research project is stored locally in the browser. JSON backups may contain the student's full research notebook and should be handled as student work.

The class Chat code is stored in session storage and excluded from project backups.

Teacher Workspace imports of student review packets remain transient to the current page session and are not a new persistence layer.

## Research Chat data minimization

When Chat context is enabled, the browser minimizes project context before transmission. Raw-dataset and obvious identifying fields are excluded. The backend repeats the minimization.

The browser accepts only the owner-configured clean HTTPS `workers.dev` endpoint in the current FREE production mode.

## Teacher-session security

Teacher authentication is separate from the student Research Chat class code.

The browser sends the teacher access code only to the Worker login route. The credential is not stored in browser persistence.

Successful login returns a signed teacher-session token. The token has an eight-hour maximum lifetime and is kept in `sessionStorage`. Teacher tools are shown only after `/teacher/session/verify` accepts the token. Tampered, expired, or incorrectly signed tokens fail closed.

The legacy query-string teacher mode and former client-only `rms_teacher_mode_v1` flag are not accepted in v2.17.1.

The public Worker URL is configuration, not a credential. None of the three secret values belongs in `assets/runtime-config.js`.

## Teacher Workspace data boundary

The Teacher Workspace:

- processes imported review packets locally in the current page session
- does not upload imported review packets merely to support teacher review
- does not expose Research Chat transcripts
- does not mutate student project storage
- does not restore a selected student backup from the teacher page
- does not convert software diagnostics into automatic grades

Recovery inspection displays safe backup metadata only. Actual project restoration remains on the student site.

## Reporting a problem

Before classroom use, treat any accidental credential or student-data exposure as a release blocker. Rotate exposed credentials, remove the material from the repository and relevant Git history, and rerun the current application and security checks before using the site again.
