# START HERE — Research Methods Studio v2.14

## Production status

**NOT YET GO.**

v2.14 is ready for release-branch CI and pull-request review. It must not be treated as student-production-ready until the deployment and manual acceptance gates in `docs/RELEASE_v2.14.md` are complete.

## What students see

The main workspace preserves orientation while reducing visual overload.

- the complete research route remains visible
- the current Stage and progress remain visible
- the current research snapshot remains available
- Stage work follows **Learn → Do the work → Check & revise**
- **Help** collects recovery and explanation tools
- **Chat** opens the research-support drawer
- **More** keeps advanced labs and administrative tools available without placing every button in the top bar
- **Download Word** exports the notebook as `.doc`
- **Backup JSON** remains the recovery format

## Secure Chat architecture

GitHub Pages serves only browser-safe student files. It never contains the OpenAI API key.

`assets/research-chat.js` sends authorized requests to the Vercel server function at `/api/research-chat`. The production Pages artifact receives the deployed Vercel URL at release time through `assets/runtime-config.js`.

The class code is kept in `sessionStorage`. It is not stored in the project object, local project backup, or Word export.

When **Use my current project context** is disabled, project-specific context is not sent. When enabled, the browser and server both minimize context and raw datasets are excluded.

Only project literature records explicitly marked `verified=true` are allowed into the citable source set. Unsupported source IDs cause the server to discard the model answer.

## Release-branch sequence

1. Push the exact v2.14 source to `release/v2.14-live-research-chat`.
2. Let `.github/workflows/ci-v214.yml` run.
3. Review the exact diff against `main`.
4. Open a pull request to `main`.
5. Merge only after CI passes and the release diff is approved.

## Required private GitHub Actions secrets

Configure these in the repository's Actions secrets before production deployment.

- `OPENAI_API_KEY`
- `RMS_CHAT_ACCESS_CODE`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

Do not paste any of these values into repository files, issues, pull requests, or Chat messages.

## Production sequence after merge

`.github/workflows/deploy-v214.yml` performs the automated part of the release gate.

1. Run the exact merged test suite.
2. Verify all required private values exist.
3. Deploy the Vercel production backend.
4. Confirm authenticated health returns `ok: true`.
5. Confirm a wrong class code returns 401.
6. Send one real, non-sensitive OpenAI request with project context disabled.
7. Build a privacy-minimized GitHub Pages artifact.
8. Inject the public Vercel backend URL into that artifact.
9. Deploy GitHub Pages.

The remaining browser/mobile and teacher-approval checks must still be completed before classroom GO.

## Local verification

```bash
npm test
```

The suite must pass with zero failures before release review.

## Historical v2.14 freeze values

The earlier v2.14 development session recorded these verification targets.

- baseline ID `RMS-INSTRUCTIONAL-BASELINE-v2.14`
- baseline digest `e79f2f84cdfc342f6705678c17fca66c4cb279d42fa019ccd043d1d4f2c34f19`
- freeze digest `3744264ab57676a13c9967cd5570f98b96b858af6cd8b8c906e46ccd73020a58`

They are historical targets until they are reproduced byte-for-byte against the committed release. Do not report them as newly verified merely because they appeared in the earlier development handoff.
