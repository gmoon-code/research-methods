# Full Novice Student Simulation Protocol v2.6

## Purpose

The simulation deliberately uses plausible first-time-researcher mistakes to test whether Research Methods Studio detects confusion before a student can mark a methodological stage ready.

This is implementation testing. It is not a validation study and does not estimate how often real students make these errors.

## Simulated novice behaviors

The scenarios include:
- entering `idk` or `not sure` in required fields
- copying an unfinished scaffold placeholder
- claiming that no research exists after a very small search
- calling an available convenience sample random
- describing an observational exposure as manipulated
- discarding pairing in before/after data
- treating binary 0/1 coding as continuous measurement
- interpreting a p-value as the probability that a hypothesis is true
- treating a non-significant result as proof of no effect
- averaging p-values in a proposed meta-analysis
- labeling a binary column as continuous

## Passing rule

A scenario passes when the expected diagnostic code is emitted.

For blocker-level misconceptions, `stageGate()` must also return `canMarkReady = false`.

## Rescue test

A separate rescue scenario verifies that:
1. a blank/low-information first attempt is preserved
2. Level 1 must be opened before Level 2
3. the student can escalate sequentially
4. Level 5 requires a rationale
5. the supported answer is stored separately from the first attempt
6. scaffold exposure is logged
