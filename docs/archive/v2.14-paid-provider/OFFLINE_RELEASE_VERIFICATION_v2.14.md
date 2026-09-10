# Offline Release Verification v2.14.2

## Verification result

**PASS for the offline production overlay.**

This record covers the corrected v2.14.2 overlay, its canonical complete-repository upgrade mechanism, and the current no-Vercel Cloudflare deployment adapter. It does not claim that a hosted Cloudflare/Vercel/OpenAI deployment has been tested.

## Exact audited input

The uploaded package used as the starting point for this correction was

`Research_Methods_Studio_v2.14_PRODUCTION_SEQUENCE_OVERLAY(1).zip`

SHA-256

`ae1899f09bfc7b5885e15be3aa6473dac42810a6dab84dfd00529e4eeda3e980`

That uploaded archive was the earlier v2.14 production overlay, not the separate complete v2.13.3 application ZIP. The corrected updater therefore remains responsible for applying this overlay to the complete v2.13.3 repository later. The updater integration suite exercises that full-combination path with a representative compatible repository and fail-closed incompatible cases.

## Release environment

- Node.js `v22.16.0`
- Python `3.13.5`
- Chromium `144.0.7559.96`

## Automated results

### JavaScript contract suite

**45/45 passed**

Coverage includes

- guarded Cloudflare first-deployment helper preflight and simultaneous required-secret upload contract
- current and legacy v2.13 browser adapter surfaces
- retirement of arbitrary browser-stored endpoints
- class-code session storage and length bounds
- authenticated health behavior
- pseudonymous session header
- client-side project allowlisting
- raw-field omission before network transmission
- email/phone redaction before browser transmission
- legacy `conversation_history` and `project_context` translation
- explicit context-off enforcement before serialization
- legacy review-call compatibility
- Stage clamping to the actual 18-stage application
- absolute owner endpoint validation and trusted same-origin fallback
- opaque-origin/local-preview absolute endpoint parsing
- endpoint configuration script behavior
- Vercel Web Standard fetch-handler contract for the optional Vercel route
- Cloudflare Worker adapter reuse of the same audited server route
- Cloudflare wrong-code, session, and class-wide rate-limit behavior
- Cloudflare fail-closed behavior when rate-limit bindings are missing
- clean Cloudflare Worker root endpoint configuration
- fail-closed server configuration
- exact-origin parsing and CORS
- timing-safe class-code comparison
- request-size and malformed-JSON handling
- server-side context allowlisting and PII redaction
- strict Structured Outputs request shape
- supported JSON Schema subset
- inline citation-bypass detection
- project-source allowlisting
- server-controlled Stage and support metadata
- neutral context-off support accounting
- dual legacy/normalized response aliases
- POST `Content-Type` enforcement
- fixed official OpenAI Responses endpoint construction
- sanitized provider failures
- tested GPT-5.6 model allowlist and fail-closed unsupported model configuration

### Offline updater integration suite

**7/7 passed**

Coverage includes

- conservative complete-repository upgrade
- preservation of unrelated `package.json` and `vercel.json` settings
- inert preservation of existing GitHub Actions workflows
- blanking accidental credential examples
- runtime-config script ordering
- production security/browser test/document inclusion
- manifest generation
- ambiguous source rejection
- ZIP traversal rejection
- real environment/secret-artifact rejection
- stale-output overwrite refusal
- deterministic output for identical source bytes

### Chromium adapter/privacy smoke

**PASS**

The real Chromium test confirmed

- v2.13 helper-chat payload compatibility
- class code appears in the authentication header and not the JSON body
- session identifier is sent separately
- `credentials: omit` and `cache: no-store`
- sensitive focused fields are omitted before network transmission
- raw dataset content does not cross the browser network boundary as automatic context
- obvious email/phone strings in typed question/history are redacted before transmission
- only project sources already marked `verified=true` are included
- context OFF sends neutral project context and no project source information

## Release boundary

The exact canonical v2.13.3 application has now been upgraded and its complete student application has passed the current regression gate. The classroom system must still remain **NOT YET GO** until a real backend is deployed, production abuse/cost controls are active, one real authenticated OpenAI smoke test passes, and the deployed browser/privacy acceptance checklist is completed.


## Canonical v2.13.3 source requirement

The complete classroom repository must be generated from `Research_Methods_Studio_v2.13.3_COMPLETE_UPDATED_GitHub_Package.zip` with SHA-256 `6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78`. The updater rejects other source bytes by default. `--allow-compatible-source` is development/test-only and is not acceptable for the canonical release. See `CANONICAL_BASE_INTEGRATION_GATE_v2.14.md`.
