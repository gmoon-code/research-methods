# Full Novice Student Simulation & Friction Audit v2.6

## Result

**10/10 misconception scenarios detected as expected.**

Progressive rescue simulation: **PASS**.

This is software/interaction testing with synthetic novice behavior. It is not evidence that these diagnostics are validated measures of student understanding.

## What the simulation exposed

v2.5 had strong explanations and progressive help, but the readiness layer still relied heavily on whether a required field was nonblank. A student could type `idk`, `not sure`, or leave a scaffold token such as `[population]` and still satisfy the simple presence check.

v2.6 adds a novice-friction guard on top of the pathway coach. Required fields containing obvious unfinished placeholders now produce a blocker and point directly to Progressive Help.

## Misconceptions explicitly exercised

| Scenario | Path | What the novice did | v2.6 behavior |
| --- | --- | --- | --- |
| N01 | Qualitative | Entered `idk` / `not sure` in core analysis fields | Blocks readiness and directs student to progressive help |
| N02 | Literature review | Claimed “no research exists” after only a small search | Flags unsupported global gap wording |
| N03 | Experimental | Called whoever was available a “random convenience sample” | Blocks the contradictory sampling description |
| N04 | Observational | Described the exposure as manipulated | Blocks path/design contradiction |
| N05 | Observational | Used an independent t-test for the same students before/after | Blocks loss of pairing |
| N06 | Observational | Assumed 0/1 coding makes a binary outcome continuous | Blocks binary-data misconception |
| N07 | Observational | Interpreted p = .03 as a 97% chance the hypothesis is true | Blocks p-value probability misconception |
| N08 | Experimental | Treated a non-significant result as proof of no effect | Blocks no-effect overclaim |
| N09 | Meta-analysis | Proposed averaging p-values | Blocks inappropriate meta-analytic plan |
| N10 | Descriptive | Labeled a binary column as continuous | Blocks data-type contradiction |

## Rescue simulation

The qualitative novice began Stage 14 with:

`analysisChoice = "idk"`

The simulation verified that:
1. Level 2 cannot be opened before Level 1.
2. The original `idk` attempt is preserved.
3. The student must move through L1–L4 before direct structured rescue.
4. L5 refuses to apply a supported answer without a student rationale.
5. The later qualitative analysis answer is stored separately from the first attempt.
6. L5 support is written to scaffold-load evidence.

## Additional v2.6 diagnostic protections

The friction guard also checks for:
- unexplained use of the word random in sampling
- measurement/readout confused with independent unit
- binary and continuous treated as the same data type
- independent analysis used for explicitly paired/repeated observations
- statistical significance treated as magnitude or practical importance
- confidence intervals described as direct 95% posterior probabilities
- observational action claims made without addressing alternatives

These are rule-based warnings. They can produce false positives in unusual advanced designs, so the interface continues to treat the local coach as a diagnostic aid, not an authoritative grading system.
