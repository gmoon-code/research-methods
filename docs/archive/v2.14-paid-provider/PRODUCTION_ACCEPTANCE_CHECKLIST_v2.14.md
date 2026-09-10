# Production Acceptance Checklist v2.14.2

Do not mark the hosted classroom application GO until every required item below is verified on the deployed system.

## Offline package and generated repository

- [ ] Overlay verification reports PASS.
- [ ] The real complete v2.13.3 source ZIP is accepted by the updater.
- [ ] The updater creates the complete v2.14.2 ZIP without an ignored error.
- [ ] The generated repository manifest exists and has a recorded tree digest.
- [ ] `assets/runtime-config.js` loads before `assets/ai-adapter.js`, which loads before the existing helper code.
- [ ] No active `.github/workflows/` remains unless the owner intentionally activates one after review.
- [ ] Node contract tests pass in the generated repository.
- [ ] Chromium/browser smoke passes when run in a browser-capable release environment.
- [ ] The 18-stage route, current progress, Help, Snapshot, Labs, Chat UI, Word `.doc` export, and JSON backup/recovery still work in a browser.

## Server configuration

- [ ] `OPENAI_API_KEY` exists only server-side.
- [ ] `RMS_CHAT_ACCESS_CODE` is random and at least 16 characters.
- [ ] `RMS_ALLOWED_ORIGINS` contains only the intended exact browser origin or origins.
- [ ] `OPENAI_MODEL` is one of the tested GPT-5.6 identifiers and has been deliberately reviewed.
- [ ] Authenticated health fails closed when the model setting is unsupported.
- [ ] The selected backend is deliberate: Cloudflare Workers using the included adapter, or another reviewed server-side provider.
- [ ] A durable platform/shared rate limit is configured for the Chat API. For the included Cloudflare path, all three declared rate-limit bindings are present and active.
- [ ] For Cloudflare, `OPENAI_API_KEY` and `RMS_CHAT_ACCESS_CODE` are stored as Worker secrets, not ordinary `vars`.
- [ ] For Cloudflare, the deployed Worker uses the current v2.14.2 adapter rather than the archived v2.12 Worker example.
- [ ] The Cloudflare deployment helper preflight passes with `node scripts/deploy-cloudflare-research-chat.mjs --check`.
- [ ] The first Cloudflare deployment provided both required secrets together and no real secret file remains in the repository or working directory.
- [ ] OpenAI project budget or usage alerts are configured.

## Authentication and browser network boundary

- [ ] Wrong class code returns 401.
- [ ] Correct class code returns authenticated health.
- [ ] Missing or incorrect Origin is rejected.
- [ ] Browser source contains no OpenAI API key.
- [ ] Browser network requests contain no OpenAI API key.
- [ ] The class code is transmitted only as the class-code header and is absent from the Chat JSON body.
- [ ] The class code is absent from project JSON and backup exports.
- [ ] The class code disappears with the browser session as expected.
- [ ] Browser settings cannot substitute an arbitrary Chat backend URL.

## Chat data minimization

- [ ] Context OFF sends a neutral Stage, empty focused field, empty project summary, and no project sources.
- [ ] Context ON sends only approved research-summary fields.
- [ ] Raw datasets are excluded from automatically supplied project context before network serialization.
- [ ] Identifier-like focused fields are replaced with `[omitted for privacy]` before network serialization.
- [ ] The server independently repeats its allowlist and redaction.
- [ ] Obvious email-like and phone-like strings are redacted from typed questions/history before browser network transmission.
- [ ] Email-like and phone-like strings are redacted again from the minimized server copy.
- [ ] Students are instructed not to paste raw participant data or identifying information into Chat.
- [ ] The privacy wording states that automated redaction is best effort and cannot reliably identify every name or indirect identifier.

## Model and response integrity

- [ ] One real non-sensitive OpenAI request succeeds.
- [ ] The response conforms to strict Structured Outputs.
- [ ] `store: false` is present in the outgoing OpenAI request.
- [ ] The pseudonymous `safety_identifier` is present and contains no student name or email.
- [ ] Model-returned Stage information cannot replace server-controlled Stage metadata.
- [ ] Neutral context forces support accounting to zero.
- [ ] Unknown or unverified project-source IDs trigger source-verification fallback.
- [ ] Teacher understands that `verified=true` is a project-workflow flag, not independent external bibliographic authentication.
- [ ] Inline URL, DOI, author-year, and bracketed-source attempts cannot bypass source allowlisting.
- [ ] Provider diagnostics are not shown to students.
- [ ] Statistical guidance does not invent p-values, effects, confidence intervals, or causal conclusions.
- [ ] Chat does not invent sources, data, participants, quotations, approvals, findings, or completed analyses.
- [ ] Legacy v2.13 response fields and normalized v2.14 fields remain consistent in the same response.

## Student-facing regression

- [ ] Existing local research guidance remains usable when Chat is unavailable.
- [ ] Research Chat asks for/reconnects with the class code after a new browser session.
- [ ] Context toggle wording is understandable and matches actual network behavior.
- [ ] Desktop Chat is usable.
- [ ] Mobile Chat is usable at the intended student viewport.
- [ ] Keyboard access and close/Escape behavior work.
- [ ] Word `.doc` export opens correctly in Word or a compatible editor.
- [ ] JSON recovery backup restores correctly.
- [ ] No new browser console errors occur.

## Human and institutional approval

- [ ] Teacher has read and approved the student privacy/use wording.
- [ ] Teacher has defined what students may and may not send to Chat.
- [ ] School or institutional requirements for student AI use and data handling have been checked.
- [ ] Current provider data-retention and school privacy requirements have been reviewed.
- [ ] Classroom status is changed from NOT YET GO to GO only after every required deployment and browser check passes.


## Canonical v2.13.3 source requirement

The complete classroom repository must be generated from `Research_Methods_Studio_v2.13.3_COMPLETE_UPDATED_GitHub_Package.zip` with SHA-256 `6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78`. The updater rejects other source bytes by default. `--allow-compatible-source` is development/test-only and is not acceptable for the canonical release. See `CANONICAL_BASE_INTEGRATION_GATE_v2.14.md`.
