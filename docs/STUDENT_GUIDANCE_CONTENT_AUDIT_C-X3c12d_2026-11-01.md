# Stage C-X3c12d | Historical analysis and source-provenance claims in rendered guidance

Date 1 November 2026. Continued from [C-X3c12c](STUDENT_GUIDANCE_CONTENT_AUDIT_C-X3c12c_2026-11-01.md).

## Scope and source evidence

Inspected the student-facing HTML-generating functions in `assets/data-lab-ui.js` (especially analysis history and results audit), `assets/writing-lab-ui.js` (Results evidence map, manuscript status selector and method evidence summary), and `assets/literature.js` (source normalization, student-coded inclusion, gap readiness, claim/source linkage and search execution/revision exports). Read the related C-X3c12c corrections and preserved earlier verified changes.

## Corrections committed

1. **Data Lab historical run descriptions.** A record made with the current safeguard version was described as calculated with current checks, followed by an assumptions warning. This remained susceptible to being read as broader verification. The new wording specifies that the calculation used its *recorded safeguard version* and that source evidence, independence and assumptions require separate review. The Results audit introduction now expressly distinguishes a stored calculation from independent source verification. Commit [f43fd4e](https://github.com/gmoon-code/research-methods/commit/f43fd4e3b654e1830767fdc3aff018a3fc28ea3b).
2. **Writing Lab unconfirmed manuscript.** The Results panel displayed a generic `Results draft` label for the default unconfirmed mode, making it too easy to mistake the status for completed findings. The label now identifies `Results draft, reporting status unconfirmed`; the introductory guidance explicitly warns that unconfirmed status does not establish observed findings. This complements the completed-only diagnostics corrected in C-X3c12c. Commit [893a3ae](https://github.com/gmoon-code/research-methods/commit/893a3ae589787784530618440b43ef2c6cd9097c).
3. **Literature Workspace gap guidance.** A gap-readiness warning described student-marked Included sources as `eligible sources`, which could imply independent screening verification. The adjusted warning calls these student-included records and reminds users that linked evidence stances are not independent verification of a shared finding. Commit [da7b1d7](https://github.com/gmoon-code/research-methods/commit/da7b1d7ad1655e688752d6e269665914ae948d45).

## Verification

Re-fetched the final committed source of all three modified files from GitHub and checked seven explicit source assertions. **Seven of seven passed.** Final blobs: `assets/data-lab-ui.js` `a31940c7d566bdb0e0752c23e0e1d276e86bad80`; `assets/writing-lab-ui.js` `61317734051e15596ae72d1b3067d0b454de1e31`; `assets/literature.js` `37ed448d49345aaf3c935117d9c9236aa916cb63`.

Source assertions confirm precise edited phrases, the default unconfirmed label branch and preservation of the existing `Execution confirmed by student` search-log status. They do not constitute execution tests, JavaScript syntax validation, browser interaction, persistence or deployed-site parity. No such runtime checks were performed in this stage. This stage is **source-verified only**, not fully verified.

## Outstanding scholarly issues and continuation

- `searchLogStatus` labels executed searches `Execution confirmed by student`. This is correctly attributed but remains student-entered, not externally corroborated. Existing revision history turns the flag off when execution-relevant fields change; behaviour should be tested.
- `claimAudit` returns `traceable` when an Included source ID is linked and `synthesis` when two are linked. These are structural flags, not verification of claim support or an adequate synthesis. Identify all downstream displays of these flags before revising code or labels.
- `gapReadiness` has heuristic thresholds for theme links and study limitations; thresholds cannot verify the existence of a field-wide research gap. Full test coverage and an editorial review of these heuristics remain necessary.
- The live browser and exports still require direct execution-based examination for historical record representation and manuscript status changes.
- The overall academic website audit remains unfinished.

## Exact next checkpoint

**Stage C-X3c12e | Trace literature claimAudit flags through the live Literature Workspace, plus search execution/revision history.** Find each downstream use of `traceable` and `synthesis`; verify that source IDs and student-coded Included decisions cannot be mistaken for source-level support. Review rendered search-log records, corrections, download labels and status changes. Correct only demonstrable claim-boundary problems, create behavioural regression tests, then perform native Node and browser checks as tools permit. Preserve previous work and subsequently resume the remaining academic website pages.

**Status:** Scoped C-X3c12d source corrections committed and source assertions passed. Runtime checks pending.
