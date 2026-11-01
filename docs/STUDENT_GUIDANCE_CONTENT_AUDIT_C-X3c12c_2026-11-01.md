# Stage C-X3c12c | Cross-system manuscript status and protocol provenance

Date 1 November 2026. Continued from the [C-X3c12b checkpoint](https://github.com/gmoon-code/gmoon-code.github.io/blob/main/docs/STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12b_2026-11-01.md).

## Scope and coverage

Read the previous two audit ledgers. Inspected live substantive strings in `assets/path-coach.js`, `assets/writing.js`, `assets/writing-lab-ui.js`, `assets/data-lab-ui.js`, and `assets/literature.js`, concentrating on protocol version history, reporting status, historical analyses and source evidence. Focused inspection is not a complete sentence-by-sentence audit of those modules or all research pathways.

## Source-backed issues and implemented changes

1. **Protocol provenance, `assets/path-coach.js`.** The methods readiness panel still said `before protocol lock` and reported that a research path changed after a protocol was `locked`. It instructed the student to have a new version `reviewed and locked` before collection. Replaced these with dated protocol-version language, required students to document the change and its timing, and expressly distinguished a saved version from research approval and evidence of implementation. Commit [c71890b](https://github.com/gmoon-code/research-methods/commit/c71890b9992155b7b4bfad0dabd1b86ab2ca110e).
2. **Unconfirmed manuscript reporting, `assets/writing.js`.** The Writing Lab has three modes, `proposal`, `completed`, and `unconfirmed`. Several section and whole-paper checks used `!proposal` and thus treated **unconfirmed** manuscripts as completed research. The affected automatic warnings asserted missing observed results, a missing Discussion of completed findings, missing linked numerical analyses or a missing completed-study finding in the abstract. Changed eight conditions so those completed-work requirements apply only in `completed` mode. The existing explicit unconfirmed-status warning remains. The change does not automatically validate a student selecting completed status or the authenticity of any evidence. Commit [39a394d](https://github.com/gmoon-code/research-methods/commit/39a394ddf7ca62011bd9affa1ed5c077e558bc16).

The original status-neutral overclaim/citation checks, proposal checks, and cautionary references to evidence records remain. No student data, historical analyses, publications, corpus evidence or pre-existing manuscript text was changed.

## Verification performed

Re-fetched the two modified production files from GitHub after the commits, obtaining the exact new blob SHAs `ad24108339258e1fc7cf79bbd531a65d714a73d1` and `6af361d06f6572cd1bbebaa6f4461475566361d6`. Nine targeted source assertions passed against those fetched blobs. They established presence of the revised protocol wording, explicit approval boundary, absence of the two obsolete locking phrases, and presence of the completed-only conditions and existing unconfirmed warning.

**Verification ceiling:** These were source-text assertions, not executed Node test suites or a DOM/browser test. A separate attempt to access the repository from the container through Git failed because the container could not resolve `github.com`. No browser, deployment-parity, persistence, export or complete regression test has been run in this stage. The source-level revisions have been confirmed in the committed files; their runtime behaviour still requires a real execution test.

## Additional observations, unresolved

- `assets/writing.js` retains an internal `locked` property in a Method blueprint to denote presence of a saved version. Its student-facing method outline calls that version a saved planning record. Avoid changing internal identifiers without checking consumers and stored project compatibility.
- `assets/writing-lab-ui.js` already distinguishes proposals, completed work and unconfirmed status in the manuscript selector and warns that stored calculations are not independent verification. Further detailed paragraph-level review is outstanding.
- `assets/literature.js` uses a student-reported `executed` flag for search history and labels it `Execution confirmed by student`. The flag cannot establish independent external verification; future source-provenance checking must preserve this distinction.
- The pathway readiness scores are automated heuristics; the wider manuscript and cross-pathway audits still need checks for status boundaries and students’ actual research evidence.

## Exact continuation checkpoint

**Stage C-X3c12d | Historical analyses and source provenance in rendered workflows.** Continue with full, line-by-line review of `assets/data-lab-ui.js` history/audit panel, `assets/literature.js` source records and search execution exports, and `assets/writing-lab-ui.js` rendered status panels. Trace each substantive guidance statement to recorded vs student-confirmed vs independently verified evidence, and compare against the canonical curriculum and Methods model. Then add behavioural tests for the corrected Writing Lab `unconfirmed` status and Path Coach methods-readiness messages, run native Node and browser verification when available, and check deployment parity. Preserve prior audit history and continue the full academic website content audit thereafter.

**Status:** C-X3c12c scoped source corrections committed and source-text assertions passed. Runtime verification remains pending. Comprehensive website audit in progress.
