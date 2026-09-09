# Research Methods Studio v2.14 release candidate

## Status

**NOT YET GO for student production use.**

This release candidate adds a secure server-side Research Chat path while preserving the student-facing orientation and scaffolding established before v2.14.

The GitHub release branch must pass CI, be reviewed as an exact diff, and be merged before the production workflow can run. Production use also requires the five GitHub Actions secrets documented below and teacher approval of the privacy/use condition.

## Student experience retained

- the five-phase research route remains visible
- current Stage and progress remain visible
- stage work continues through Learn, Do the work, and Check & revise
- future stages remain available for orientation
- Research Snapshot remains visible
- Help remains available without restoring the crowded toolbar
- the student-facing assistant is named **Chat**
- advanced tools remain reachable through **More**
- project backup remains separate from Chat authentication
- notebook export is Word-compatible `.doc`

## Research Chat security boundary

The browser never receives the OpenAI API key. The browser sends the student's question, recent Chat history, and only the allowed project context to `/api/research-chat`.

When **Use my current project context** is off, the request contains no project-specific summary, verified source list, Stage, or focused-field content.

When context is on, the client and server both minimize project context. Raw datasets and fields that appear to contain participant identifiers are excluded. Obvious email addresses and phone numbers are redacted server-side as an additional safeguard.

Only literature records explicitly marked `verified=true` may be supplied to the model as citable project sources. If the model returns a source ID that is not in that verified set, the server discards the answer and returns `source_verification_needed`.

The class access code is held in `sessionStorage`, not in the project object, local project JSON, or exported backup.

## Required GitHub Actions secrets

- `OPENAI_API_KEY`
- `RMS_CHAT_ACCESS_CODE`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

These values must never be committed to the repository.

## Deployment gate

The production workflow will refuse to continue when a required secret is missing. After Vercel deployment it verifies authenticated health, 401 for a wrong class code, and one real non-sensitive OpenAI response with project context disabled. Only after those checks pass does the workflow build the GitHub Pages artifact and inject the public Vercel deployment URL into `assets/runtime-config.js` inside the artifact.

The Pages artifact contains only the student HTML and `assets/` tree. Backend source, tests, scripts, GitHub workflow files, and environment templates are not published with the student site.

## Production acceptance checklist

A release is production-ready only after all of the following are true.

1. GitHub CI passes on the exact merged commit.
2. Vercel health returns `ok: true` with the correct class code.
3. A wrong class code returns HTTP 401.
4. A real non-sensitive student question produces a valid OpenAI response.
5. Stage and focused-field context are transmitted correctly when context is enabled.
6. Context-off mode removes project-specific information.
7. Unsupported or unverified citations are rejected.
8. Browser source and browser network traffic contain no OpenAI API key.
9. The class access code remains outside project backups.
10. The deployed Pages site loads without JavaScript errors.
11. Research Chat works on the target mobile viewport.
12. Word `.doc` export still works.
13. The Chat privacy notice is visible.
14. The teacher manually approves the privacy/use condition.

Until every item is verified against the deployed production system, the status remains **NOT YET GO**.

## Historical freeze identifiers

The prior v2.14 development session recorded the intended instructional baseline ID `RMS-INSTRUCTIONAL-BASELINE-v2.14`, baseline digest `e79f2f84cdfc342f6705678c17fca66c4cb279d42fa019ccd043d1d4f2c34f19`, and freeze digest `3744264ab57676a13c9967cd5570f98b96b858af6cd8b8c906e46ccd73020a58`.

Those digests are retained here as historical verification targets. They must not be represented as verified against this GitHub branch until a byte-for-byte freeze verifier reproduces them on the committed release contents.
