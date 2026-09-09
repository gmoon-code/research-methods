# Research Methods Studio v2.14

Research Methods Studio is a scaffolded secondary-school research workspace that keeps the complete research journey visible while helping students work through one research decision at a time.

## Current release state

**v2.14 is a production release candidate. Student production status is NOT YET GO.**

The release adds secure **Chat** support through a server-side Vercel endpoint. The browser contains no OpenAI API key. Production deployment is gated by GitHub CI, authenticated backend checks, a real non-sensitive OpenAI smoke test, GitHub Pages deployment, browser/mobile verification, and teacher approval of the privacy/use condition.

See `docs/RELEASE_v2.14.md`.

## Student experience

The interface keeps the five-phase route, current Stage, progress, prior project decisions, save state, and Research Snapshot available for orientation. Stage work uses the existing guided sequence of **Learn → Do the work → Check & revise**, while advanced tools stay available through a smaller **More** surface.

Students can use Literature, Methods, Data & Statistics, Writing, Journey, Learning Analytics, Transfer, exemplar, glossary, recovery, and teacher-review tools without crowding the main workspace.

## Chat

Chat can answer research-method questions and can use a privacy-minimized view of the student's current project when **Use my current project context** is enabled.

The client and server both exclude raw datasets from Chat context. Only literature records explicitly marked `verified=true` can be supplied as citable project sources. An answer that cites an unknown or unverified project source is discarded and replaced with a source-verification response.

The class access code is stored only for the browser session and is not added to project JSON or backups.

## Export and recovery

- **Download Word** creates a Word-compatible `.doc` research notebook.
- **Backup JSON** preserves the complete project recovery record.
- Browser storage remains local to the student's browser unless the student deliberately uses Chat or exports/shares a file.

## Development

Node.js 20 or newer is required for release verification.

```bash
npm test
```

The v2.14 suite checks the Research Chat security contract and student release contract.

## Deployment

The release branch is `release/v2.14-live-research-chat`.

CI runs on the release branch and pull requests to `main`. Production deployment runs only from `main` or manual workflow dispatch and requires these GitHub Actions secrets.

- `OPENAI_API_KEY`
- `RMS_CHAT_ACCESS_CODE`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Secrets must never be committed to repository files.

See `START_HERE.md` for the operational sequence.
