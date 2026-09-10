# Final Production Sequence Audit v2.14.2

## Status

This package is an **offline production overlay** for the completed Research Methods Studio v2.13.3 application. It does not connect to GitHub, create a Vercel account, deploy a server, or contain a live credential.

The hosted classroom application remains **NOT YET GO** until a future deployment passes every required item in `PRODUCTION_ACCEPTANCE_CHECKLIST_v2.14.md`.

## Scope of this audit

The v2.14.2 pass treated the overlay as release engineering, not as a collection of isolated code files. The review covered the shared Research Chat route, the optional Vercel entry point, the current Cloudflare Workers adapter, OpenAI Responses API request shape, strict Structured Outputs schema, browser/backend compatibility with the existing v2.13 Research AI calls, authentication, exact-origin CORS, request limits, project-context minimization before network transmission, independent server-side minimization, PII redaction, prompt-injection boundaries, source allowlisting, model-output enforcement, provider error handling, endpoint configuration, updater safety, preservation of existing repository configuration, GitHub workflow activation risk, secret scanning, JavaScript and Python validation, synthetic full-repository upgrade tests, deterministic ZIP creation, and a real Chromium adapter/privacy smoke test.

## Material corrections made

1. **The production function is `api/research-chat.js` with an ESM Web Standard fetch handler.** The `api/` directory alone is scoped to ESM by `api/package.json`, so the updater does not change the module mode of the whole existing repository.
2. **The Vercel function duration is configured in `vercel.json`.** The production route remains `/api/research-chat` with a 30-second maximum duration while the upstream OpenAI timeout is 24 seconds.
3. **The backend supports the existing v2.13 Research AI contract and the normalized v2.14 contract at the same time.** The browser adapter translates the older `conversation_history` and `project_context` shape into the minimized secure request. Responses retain the legacy renderer/logging fields while also returning normalized `answer`, `next_steps`, and `scaffold` fields.
4. **The class code must contain at least 16 characters.** Missing or short server configuration fails closed. The class code is stored only for the browser session and is sent in an authentication header, not in the JSON request body or project backup.
5. **The owner controls the backend address.** Browser settings cannot substitute an arbitrary model-service URL. The public server address comes from `assets/runtime-config.js` and the server always calls the fixed official OpenAI Responses endpoint.
6. **Project context is minimized before it crosses the browser network boundary.** Only a small allowlist of research-summary fields is eligible. Identifier-like or raw-data focused fields are replaced with `[omitted for privacy]`. Raw dataset fields are excluded from automatic project context.
7. **The server repeats the minimization independently.** Client controls are treated as defense in depth, never as a trusted security boundary.
8. **PII redaction is explicitly best effort.** Email-like and phone-like strings are redacted in the browser from typed questions/history and again on the server. The package does not claim that regex can identify every name, indirect identifier, or sensitive free-text detail. Students must still be instructed not to paste identifiable participant information into Chat.
9. **Context OFF is enforced before serialization.** When the context toggle is off, the browser sends a neutral Stage, empty focused field, empty project summary, and no verified project sources.
10. **Project-source citations are restricted to records already marked `verified=true` in the project.** Unknown source IDs cause the generated answer to be discarded. Inline author-year references, URLs, DOI strings, and bracketed source references in generated prose also trigger source-verification fallback. The `verified=true` value is a project-workflow flag, not external or cryptographic bibliographic verification.
11. **Source notes and student data are explicitly delimited as untrusted input.** They cannot become higher-priority instructions merely by containing prompt-like text.
12. **Stage and support accounting are server controlled.** A model cannot replace the sanitized Stage ID, focused-field identity, or neutral context-off support state.
13. **Student-authorship and statistics constraints are retained in the system instructions.** Chat must not invent data, participants, sources, findings, inferential results, approvals, or completed analyses and must not replace the student's finished graded work.
14. **The OpenAI request uses `store: false`, strict JSON Schema Structured Outputs, low reasoning effort, low verbosity, a bounded output-token budget, and a pseudonymous 64-character `safety_identifier`.** The session identifier is random and contains no student name or email.
15. **The strict JSON Schema uses the supported structural subset.** String length, numeric range, and array-count limits are enforced in server code rather than depending on schema keywords that can be unsupported in strict Structured Outputs.
16. **The tested model setting now fails closed.** `OPENAI_MODEL` is limited to the explicitly tested GPT-5.6 identifiers `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.6-sol`, and the `gpt-5.6` Sol alias. An unsupported model value cannot make authenticated health look ready and then fail only on the first student question.
17. **Provider failures are sanitized.** Provider response bodies, API diagnostics, API keys, and raw student content are not returned to students.
18. **Request parsing is bounded while streaming.** Oversized bodies are stopped before unbounded JSON parsing. The endpoint also rejects malformed JSON and non-`application/json` POST requests.
19. **The browser adapter was exercised in Chromium.** The test checks the old v2.13 helper call, class-code header separation, session header, context-on minimization, raw-field omission, unverified-source removal, and context-off network payload. This pass also caught and fixed absolute endpoint parsing on opaque-origin/local-preview pages.
20. **The updater is fail closed.** It rejects ambiguous script patching, unsafe ZIP traversal, symlinks, secret/build artifacts, invalid repository configuration, missing core application files, missing Word export support, and source packages that do not identify as the expected v2.13.x application line.
21. **Existing repository configuration is preserved conservatively.** Existing `package.json` scripts/module mode and unrelated `vercel.json` settings remain intact. Research Chat settings are merged without replacing unrelated configuration.
22. **Active GitHub Actions are never silently activated by the offline upgrade.** Existing source workflows are moved into an inert preservation folder, and v2.14 templates remain under `optional-github-actions/` until an owner deliberately activates them.
23. **The generated complete repository is tested before ZIP creation.** Node.js 20 or newer is mandatory. Production JavaScript receives syntax checks and the backend, browser adapter, endpoint configuration, and Cloudflare adapter contract tests must pass before the updater writes the output ZIP.
24. **Release packaging is deterministic and auditable.** The generated complete repository contains a manifest with file hashes, a tree digest, source-ZIP SHA-256, and a record of any workflows moved inert.

## Important boundary about rate limiting

The application code does not claim that a process-local memory counter is a durable production rate limit. The included Cloudflare Worker uses Cloudflare Rate Limiting bindings for wrong-code attempts, authenticated sessions, and class-wide traffic, and fails closed when those bindings are absent. Cloudflare describes those counters as permissive/eventually consistent, so they remain abuse controls rather than exact billing accounting. If Vercel or another provider is used, configure an equivalent durable platform/shared limit. In every deployment, also configure an OpenAI project budget or usage alert suitable for the class.

## Model choice

The default model is `gpt-5.6-terra`. OpenAI's current model documentation describes Terra as the GPT-5.6 option balancing intelligence and cost and lists Responses API and Structured Outputs support. Luna remains available for lower-cost testing, while Sol is available when higher capability is justified. Any model change should be rechecked with the included production smoke test before classroom use.

Official references used for this release review

- OpenAI model catalog: `https://developers.openai.com/api/docs/models`
- OpenAI Responses API reference: `https://developers.openai.com/api/reference/resources/responses/methods/create`
- Cloudflare Worker secrets: `https://developers.cloudflare.com/workers/configuration/secrets/`
- Cloudflare Rate Limiting binding: `https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/`
- Vercel Functions API reference (optional alternate provider): `https://vercel.com/docs/functions/functions-api-reference`
- Vercel Node.js Functions (optional alternate provider): `https://vercel.com/docs/functions/runtimes/node-js`

## Offline verification expected before packaging

The release package must pass all of the following before its final checksum is generated.

- JavaScript syntax checks
- Python compilation
- all backend, adapter, and endpoint Node contract tests
- all offline updater integration tests
- Chromium adapter/privacy smoke test when the release environment provides Chromium
- secret scan
- active-workflow scan
- package-file manifest and tree-digest generation

A future real server deployment (Cloudflare Workers is now the preferred no-Vercel path) and one authenticated real OpenAI request remain intentionally outside this offline release audit.


## Canonical v2.13.3 source requirement

The complete classroom repository must be generated from `Research_Methods_Studio_v2.13.3_COMPLETE_UPDATED_GitHub_Package.zip` with SHA-256 `6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78`. The updater rejects other source bytes by default. `--allow-compatible-source` is development/test-only and is not acceptable for the canonical release. See `CANONICAL_BASE_INTEGRATION_GATE_v2.14.md`.
