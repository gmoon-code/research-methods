# Stage C-X3c12f | Behavioural check of claim links and search-record revisions

Date 1 November 2026. Continued from [C-X3c12e](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12e_2026-11-01.md).

## Files and exact scope
Inspected `assets/literature.js`, `tests/literature.test.js`, `tests/literature-search-provenance-ui.test.js`, and the previously reviewed claims/search panel in `assets/app.js`. The existing `tests/literature.test.js` already covers many inclusion, revision and export scenarios, so it was not duplicated or rewritten merely to create a new commit.

## Executed verification

Fetched the current committed `assets/literature.js` (SHA `37ed448d49345aaf3c935117d9c9236aa916cb63`) through the GitHub connector. Loaded the original production source into an isolated JavaScript evaluator, supplied a local `window` object, and called the exported functions on representative data. **11/11 behavioural checks passed**, covering:

- Duplicate source IDs count once in claim audit.
- Pending, excluded and unknown IDs are reported separately.
- A two-included-link flag appears for two student-included sources, but not for one.
- A complete student-confirmed search is marked confirmed.
- Correcting the actual query resets execution confirmation.
- The former query is retained in the revision's `before` object.
- Search CSV reflects the revoked confirmation.
- Revision CSV preserves the earlier yes/no execution confirmation.
- Notes-only correction preserves confirmation.
- Two revisions remain in the exported history.

These are real executions of the fetched production functions, not source-pattern checks; they are not the repository's entire Node test suite or a browser flow. The container's `git ls-remote` could not resolve github.com, so a native repository checkout and CLI suite were not available through that route.

## Scholarly assessment and source-content decision

The `traceable` and `synthesis` fields are structural indicators derived from source links to student-included entries. The live claim panel does **not** advertise these as independently verified source support and explicitly tells students to check claims against cited works. Likewise, the search log correctly distinguishes student confirmation, incompleteness and unconfirmed execution. Existing `tests/literature.test.js` already contains strong scenarios for these distinctions, including records omitted from synthesis and legacy execution history.

**No production-content change was warranted by the tested behaviours.** This is a deliberate no-rewrite finding, respecting the instruction to maximise justified improvement rather than edit for activity. The prior C-X3c12e improvements remain preserved.

## Verification limits and remaining issues

- The 11 checks did not exercise actual browser events, storage, rendered CSV download, document export, or deployment parity.
- Source-linked `synthesis` can be misread by future consumers as a quality judgement. Any new rendering must explicitly distinguish linked-source count from scholarly evidence.
- The structural indicator counts Included records rather than source-verified support, so independent document/source appraisal is still required.
- Complete native Node test suite and site-wide academic content audit remain outstanding.

## Exact next checkpoint

**Stage C-X3c12g | Cross-panel source eligibility, synthesis wording and export boundaries.** Inspect other source-management and curriculum panels for assertions that tagged or included literature records establish verified findings. Check student-facing search export titles against the revision record meanings, and run targeted actual-function tests for legacy theme tags and claim evidence where possible. Implement only justified improvements and preserve a precise ledger. Then continue the wider academic website page-by-page audit and the unexecuted native Node/browser/deployment verification.

**Status:** Scoped literature-engine behaviour verified by 11 targeted executable checks; no source revision necessary. Entire site remains in progress.
