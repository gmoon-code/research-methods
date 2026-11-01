# Stage C-X3c12e | Literature claim flags and search-history provenance

Date 1 November 2026. Continued from C-X3c12d.

## Source inspection

Read the live claim and search panels in `assets/app.js` and corresponding `claimAudit`, search status, revision and CSV generation functions in `assets/literature.js`. The Literature Workspace is rendered from `assets/app.js`, not a separate `assets/literature-ui.js` file (that path does not exist).

The `claimAudit` flags `traceable` and `synthesis` are structural counts of student-linked Included records, not adjudications of support. The live claim panel does not display those flags as scholarly verdicts; its count correctly instructs checking support. No change to those internal fields was justified. Search-log confirmation is student-attested; revisions to execution-sensitive fields reset the confirmation status, while reason and prior values are retained.

## Four live-content corrections

1. Changed `Supporting source IDs` in the claim editor to `Source IDs to check for claim support`, avoiding premature endorsement of student-provided IDs.
2. Clarified that dots in the older synthesis matrix represent student-entered theme tags and must be checked against measures and original findings. The older wording invited readers to treat tags as evidence that a theme is actually supported.
3. Changed `eligible studies` to `student-included studies` in the newer synthesis workspace overview, preserving the distinction between student screening and externally verified eligibility.
4. Changed the search-log submit button from `Add completed search` to `Record student-confirmed search`, consistent with the execution checkbox and `Execution confirmed by student` status.

Committed to `assets/app.js` in [7997452](https://github.com/gmoon-code/research-methods/commit/7997452680c4b8f06d748f7ad2afb818dc111627).

## Verification and limits

Re-fetched `assets/app.js` at blob `12d04ac770161d48efa0e6c2640bf1494cc3958e`. Seven targeted assertions passed against the committed source: all four edited phrases, preservation of the warning that IDs do not prove support, requirement to tick the execution-confirmation checkbox, and presence of the linked-ID verification warning. **These are source assertions, not a runtime or browser regression test.** No full-file syntax check, export round trip, historical-data migration or published-site comparison was executed here.

The complete website's paragraph-by-paragraph scholarly and editorial review remains unfinished. Other unreviewed text in `assets/app.js` is outside this scoped stage.

## Exact next checkpoint

**C-X3c12f | Behavioural regression of literature claims and search revisions.** Execute real `assets/literature.js` functions on representative records for included/pending/excluded/missing IDs, confirm-only versus edited searches, exported CSV status and revision history. Verify student-screening labels in the other source and pathway panels and reconcile any remaining inconsistent source-provenance terms. Perform native Node, browser and deployment parity checks when available. Then continue page-level website content audit.

**Stage status:** Source-content corrected and re-fetched; seven source assertions passed. Behavioural, browser and public deployment verification pending.
