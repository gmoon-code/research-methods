# v2.13 Test Matrix

## Current release suite

The current v2.13 command-level regression suite contains **40 commands**.

Result:

**40 / 40 PASS**

The suite covers:

- deterministic Research Coach
- Statistics engine
- Methods engine
- Literature engine
- Writing engine
- Transfer engine
- Competency engine
- Journey/teacher packet behavior
- pilot recovery/readiness behavior
- storage-unavailable resilience
- guided pathways
- path-specific coaching
- novice-friction rules
- progressive rescue
- response-example coverage
- Research Snapshot engine
- exemplar v2.8 engine/source integrity
- AI helper context/authorship metadata
- Stage/Lab single-source synchronization
- v2.13 route/dependency behavior
- v2.13 student shell
- v2.13 accessibility integration
- inherited-core byte integrity

## Rendered browser suite

Result:

**52 / 52 PASS**

See `UX_BROWSER_QA_v2.13.md`.

## Historical static tests not used as v2.13 release gates

Several old static tests remain in the repository for release-history traceability. They assert exact strings or UI structures from older versions and are intentionally superseded by current v2.13 tests.

Examples include old assertions that require:

- the v2.2 version label in the current HTML
- the v2.3 “show extra fields” wording
- v2.11 always-visible response-cue cards
- v2.8 global exemplar wording
- a v2.9 integrity reference folder that is not present in this runtime

These are historical compatibility artifacts, not current v2.13 product requirements.

The v2.13 replacements are:

- `student-flow-v213.test.js`
- `single-source-v213.test.js`
- `student-flow-static-v213.py`
- `current-ui-regression-v213.py`
- `accessibility-v213-static.py`
- `core-integrity-v213.py`
- `baseline-ui-v213.py`
- rendered Chromium QA v2.13
