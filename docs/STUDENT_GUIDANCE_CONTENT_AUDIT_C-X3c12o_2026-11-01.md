# Stage C-X3c12o | Release-parity limits and cross-module evidence-language audit

Date 1 November 2026. Continued from [C-X3c12n](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12n_2026-11-01.md).

## Scope and release-parity findings

Checked GitHub Actions for recent `gmoon-code/research-methods` commits and attempted access to the published GitHub Pages root and two snapshot JavaScript URLs. GitHub Actions reported successful Pages deployment for earlier snapshot commits `99c4f71` and `aa31374`. Newer commit jobs were running or cancelled because superseded by later commits when checked; the current release was not established as deployed. The public website and asset URLs were inaccessible to the available webpage-reading tool. A successful Pages build is not evidence of functional parity, so **published-site source parity and live browser behaviour remain unverified**.

Native `git ls-remote` previously failed due to DNS resolution of github.com in the container. No native complete Node suite execution or end-to-end browser verification occurred. Isolated production-function tests from C-X3c12l, C-X3c12m and C-X3c12n must continue to be reported separately.

## Cross-module content audit

Inspected the live Student Guide (`assets/student-guidance.js`) plus source-verification mentions in `assets/app.js`, `assets/ai-adapter.js`, `assets/research-snapshot.js`, `assets/research-snapshot-ui.js`, `assets/writing-lab-ui.js` and `assets/rescue.js`. Some `verified` terminology in the Student Guide referred to checking literature in a general sense, although the software's dedicated `verified` Boolean establishes only student-attested bibliographic checking. The risk was especially acute when students were told to rely on `verified studies`, `verified source records` or `verified source notes` without distinguishing source content review from bibliographic metadata.

Four narrowly supported language revisions were made in the Student Guide:

1. Literature introduction models now preview comparisons supported by sources students actually examined rather than `verified literature` as an undefined status.
2. An illustration comparing different reported estimates now describes studies the student checked, without implying independent validation.
3. Literature-draft instructions ask students to compare claims with cited original studies and develop paragraphs from checked notes.
4. Synthesis instructions require source records checked against original studies and comparison of measures and contexts before convergence claims.

These changes preserve the lesson sequence and intended methodological distinctions while avoiding inflated evidence status and unnecessary stylistic repetition. Commit [9c1976a](https://github.com/gmoon-code/research-methods/commit/9c1976aee93e3cbdb0cb22bfff73f633688f8dbb).

## Verification

Re-fetched committed Student Guide blob `48bf447ff5ae00a85ba9f804f49a0b2031dfbd7e`. All four revised passage strings were present and the former `verified studies` and `verified source records` example strings were absent. The whole production JavaScript source parsed successfully in an isolated JS evaluator. These are source and syntax checks, **not** rendered student-flow/browser tests or external appraisal of actual published research.

## Remaining limitations

The complete website audit continues. Research claims, quotations, academic references and autobiographical assertions on other pages still require their own original-record verification. The connected GitHub repository contains additional student guidance and administrative content not covered by the narrow source-status audit. Future edits must preserve Canadian English, gentle scholarly voice, meaningful nonformulaic connections, and original research status boundaries.

## Exact next checkpoint

**Stage C-X3c12p | Consolidated regression and site-wide content coverage reconciliation.** Recheck GitHub Pages for the latest release, attempt public served-asset comparison when accessible, run the native Node tests `tests/research-chat-backend.test.mjs` and `tests/snapshot-v211.test.js` plus related tests in a suitable environment, and record exact pass/fail or blockers. Verify the broader audit ledger against the actual discoverable academic website pages and identify the next unaudited substantive page or section. Return to sentence-by-sentence scholarly writing, status, citation and factual checks there rather than endlessly revisiting already corrected research-workflow phrases.

**Stage status:** Four source wording corrections committed and source/syntax checks passed. Latest public release parity and full native test suite remain unverified. Entire academic website audit in progress.
