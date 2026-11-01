# Stage C-X3c12m | Snapshot provenance, saved protocol wording and export parity

Date 1 November 2026. Continued from [C-X3c12l](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12l_2026-11-01.md).

## Actual content examined

Inspected `assets/research-snapshot-ui.js` on-page search histories, source records, structured Methods Lab records and status labels alongside `assets/research-snapshot.js` exported text, and the existing `tests/snapshot-v211.test.js`. The earlier C-X3c12j/k search execution statuses were already corrected and retained.

## Findings and corrections

The source snapshot UI counted both unconfirmed and confirmed search records under the label `searches`, even though no actual execution could be inferred for some entries. Changed the count to `records` and the introduction to mention unconfirmed execution. The source panel called the entered extraction `Your extracted source evidence` and labelled summaries `Finding / contribution`, potentially implying unqualified scholarly verification. It now identifies student-entered information to check against original studies and displays `Student-recorded finding / contribution`. The matching Markdown export uses that finding label.

The snapshot UI described saved Methods protocol versions as `locked protocol versions`, which could be read as formal approval or a mandatory procedural lock. Changed this to `saved protocol versions`, preserving existing actual version counts. The Markdown report contained two em dashes in text authored by the application; these were replaced with middle-dot separators to honour established writing rules.

Production commits:
- [85f6bc8](https://github.com/gmoon-code/research-methods/commit/85f6bc8815c9df9b27d732830b6df740f296b045) `assets/research-snapshot-ui.js`.
- [99c4f71](https://github.com/gmoon-code/research-methods/commit/99c4f71218db8efb76c430d43880d38b163231e9) `assets/research-snapshot.js`.

Added a persistent regression scenario to the existing [snapshot test](https://github.com/gmoon-code/research-methods/commit/aa31374413b267d7883c6086516baaa20a15e9c7) `tests/snapshot-v211.test.js`, including multi-status search histories, source evidence labelling and protocol-version wording.

## Verified

Re-fetched the amended production files and evaluated the original `workspaceHTML` renderer (extracted intact with its dependencies) and `RMSResearchSnapshot.markdown` against a representative project. **8 of 8 executable checks passed**, covering record count, unconfirmed search label, source-entry description, student-recorded finding in both outputs, saved protocol versions, no exported em dash and student bibliography attribution.

Parsed (syntax checked) the committed backend, app, snapshot UI, snapshot engine, and both changed test files in a JS evaluator. All six parsed successfully. The native Node test suite has not executed in a checkout because container DNS could not resolve GitHub for cloning. These checks are production-function and syntax checks; they are not a real DOM/browser run or a published-site comparison.

## Pending boundaries

The snapshot displays current student-entered source records; it does not validate original publications. Other reporting sections and stored analysis runs still require evidence provenance review. Do not infer institutional approvals from `protocolVersions` or externally verified results from a stored analysis summary. The complete academic website content audit remains unfinished.

## Exact next checkpoint

**C-X3c12n | Snapshot statistical-output provenance and full report coherence.** Examine `assets/research-snapshot.js` and `assets/research-snapshot-ui.js` stored analysis summaries and their links to datasets, analytic-unit definitions and calculation safeguards. Compare with the Data Lab's existing C-X3c12d rules to prevent historical calculation status from being mistaken for validated results. Review surrounding snapshot text for redundancy, natural sentence connections and Canadian English. Implement only warranted changes, execute targeted functions, and keep native Node, browser and deployed-site checks separately recorded.

**Status:** Scoped content committed, 8/8 executable checks and six source syntax checks passed. Native Node test files added but not executed as a full suite.
