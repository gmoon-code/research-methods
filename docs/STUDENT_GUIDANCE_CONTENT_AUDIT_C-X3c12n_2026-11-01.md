# Stage C-X3c12n | Statistical-output provenance in the Research Snapshot

Date 1 November 2026. Continued from C-X3c12m.

## Scope and evidence

Inspected the stored-run projection and Markdown export in `assets/research-snapshot.js`, the on-page stored analysis panel in `assets/research-snapshot-ui.js`, and the actual `analysisRecord` and `resultsMarkdown` provenance fields in `assets/analytics.js`. Compared with prior C-X3c12d Data Lab caution language. Source analysis records contain `calculation_guard_version`, `traceability.file`, `traceability.rows_used`, and a limited automated `validation_scope`. The snapshot had omitted these provenance facts, showing summaries without their scope.

## Corrections

- Snapshot workspace projection now carries the guard version, source file recorded when the analysis ran, and count of rows used. No calculation, source file or project record is changed.
- On-page snapshot warns that calculations may have been run with earlier coding and safeguard versions. Each run identifies the current recorded safeguard version versus earlier/unversioned historical status, warns against interpreting that as independent validation, and displays the associated file and rows with a reminder that rows need not be independent study units.
- Matching Markdown export reports the same source provenance and safeguard caveat for each run.
- Existing evidence restrictions for search history, student-entered bibliography and saved protocol versions remain intact.

Commits:
- [0fe1567](https://github.com/gmoon-code/research-methods/commit/0fe15677edc777113fb1f003ba29cfc25a78c553) `assets/research-snapshot.js`
- [dc55d68](https://github.com/gmoon-code/research-methods/commit/dc55d680a0667290b620c4c04e1decd7ce092942) `assets/research-snapshot-ui.js`
- [9570a40](https://github.com/gmoon-code/research-methods/commit/9570a4097c426b6a85b2280ff736b46af404ed86) `tests/snapshot-v211.test.js` new regression case.

## Verification

Re-fetched both production modules after commit. Evaluated actual `RMSResearchSnapshot.workspaceData` and `markdown` methods and the extracted intact UI `workspaceHTML` renderer in an isolated JavaScript evaluator with representative versioned and historical run records. **10/10 executable checks passed** for guard version, source file, row count, interpretation caveats and output agreement. The new regression source has not been executed as a native Node test in a cloned checkout, so this remains a different validation tier from running the repository suite.

Queried GitHub Actions. The latest commit `9570a40` had a Pages deployment in progress when checked. Earlier snapshot commits had Pages successes, but latest deployment and actual rendered public site parity are still unconfirmed. A Pages build is not itself a behavioural test.

## Remaining issues

The snapshot can display only the provenance saved with a run. It cannot independently verify imported data, missingness coding, analytic independence, measurement quality, p-values, causal identification or whether a run was originally prespecified. Historical entries without guard metadata correctly retain explicit cautions. The rest of the academic website and its content controls still require the complete user-specified sentence-level and cross-page review.

## Exact next checkpoint

**Stage C-X3c12o | Public release parity and cross-module regression of student source provenance.** Check latest Pages deployment state and, if successful and access permits, compare publicly served script content against committed source for coach, snapshot, and literature panels. Test the newly committed Node test cases in a suitable runtime, or record the blocker accurately. Review cross-module mentions of verified studies and completed analyses for research claims exceeding recorded evidence and style-rule issues; make narrowly justified corrections only. Afterwards resume other unfinished academic website pages and research claims.

**Status:** Targeted snapshot corrections committed, 10/10 isolated executable checks passed; native tests and current public-site parity unverified.
