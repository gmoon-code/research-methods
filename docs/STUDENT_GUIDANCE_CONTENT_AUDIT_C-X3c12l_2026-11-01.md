# Stage C-X3c12l | Coach API contract and provenance of student bibliography records

Date 1 November 2026. Continued from C-X3c12k.

## Evidence examined

Inspected browser `assets/ai-adapter.js`, backend `api/research-chat.js`, `backend/cloudflare-workers-ai/worker-core.mjs`, `backend/cloudflare-workers-ai/worker.mjs`, current coach render in `assets/app.js`, plus `tests/research-chat-backend.test.mjs` and `tests/adapter-contract.test.mjs`. Confirmed the cloud worker imports the same API logic. The browser selects project sources whose student-maintained `verified` flag is true and sends them through an established wire field called `verified_sources`. The server accepts only those flagged entries; no independent publication lookup or confirmation is performed by this flag.

## Substantive issue

The backend's system prompt called this data `VERIFIED_PROJECT_SOURCES` and said source presence was sufficient as a condition before claiming support. The fallback similarly described bibliographies as verified. Such labels risk turning a student's assertion that citation details were checked into a purported verification of the original research and any associated finding. The backend's source whitelist protects against fabricated IDs but cannot independently validate source content.

## Corrections committed

1. In `api/research-chat.js`, changed only the internal model prompt's data key to `STUDENT_CHECKED_BIBLIOGRAPHIC_RECORDS`. Revised system instructions to explain that the entries are untrusted student-entered bibliographic checking, that an ID alone does not substantiate a claim, and that students should examine the original study where notes are insufficient. Clarified fallback text and actions. **Preserved** the public `verified_sources` request field, true/false source flags, model citation IDs and source-whitelist restriction. Commit [7e40f42](https://github.com/gmoon-code/research-methods/commit/7e40f42552c1c75bc28c950ac4dad1d1e61380cd).
2. In `assets/app.js`, changed the citation annotation to `bibliography marked checked by student`, consistent with stored provenance. Commit [15f1fda](https://github.com/gmoon-code/research-methods/commit/15f1fda03a38b54dbc5baa4c8d85de55e796f5c0).
3. Added two Node regression tests to `tests/research-chat-backend.test.mjs` for prompt source status, retained client/server field, allowed citation ID and rejection of unknown citations. Commit [81bed7c](https://github.com/gmoon-code/research-methods/commit/81bed7ce376e9c50770af997b03ee0240587b03b).

## Verification

Re-fetched `api/research-chat.js` from GitHub; evaluated the actual backend source as JavaScript in an isolated evaluator, excluding Node-only import/export wrappers. Called the actual `minimizeContext`, `buildWorkersAIRequest` and `enforceOutput` functions with a student-marked source and an unknown citation. **Seven of seven executable checks passed.** They covered the revised system guidance, internal prompt data key, unchanged public field, permitted recorded ID, rejected unknown ID and clear fallback attribution.

Native `git ls-remote` was blocked by an unavailable DNS lookup for github.com in the container. **The committed Node test file has not been run under Node in a checkout,** and no deployed Cloudflare AI inference, browser session or published-site parity check has been completed. Do not equate these with the seven isolated production-function checks.

## Outstanding scholarly and editorial boundaries

The API's historical `verified_sources` name and `verified: true` response property persist for wire compatibility. Server processing checks source ID membership only. An LLM could still make a mistaken inference about what a cited work demonstrates; the updated prompt cannot guarantee factual citation support. Any independent validation would require original studies and an appropriate verification process. Teacher/classroom policy and data privacy must continue to be protected.

## Exact continuation

**Stage C-X3c12m | Snapshot source-entry and historical protocol-status consistency.** Inspect Research Snapshot display and exports for student-entered findings presented as verified extraction, counts of unconfirmed searches displayed as completed work, and saved protocol versions described as locked or approved. Correct only grounded inconsistencies, test actual snapshot functions and record source assertions and limitations. Then resume the remaining page-by-page content audit, including Canadian spelling, meaningful connections, repetition, and empirical claim validation.

**Status:** Targeted backend and coach guidance corrected, two regression cases committed but native Node execution pending, 7/7 isolated backend checks passed. Whole-site audit in progress.
