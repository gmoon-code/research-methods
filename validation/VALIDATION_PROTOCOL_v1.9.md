# Transfer Assessment and Validation Protocol v1.9

## Purpose

This package creates infrastructure for evaluating whether research-methods reasoning appears in unfamiliar scenarios. It does **not** establish that the current competency model is valid.

## Public candidate bank

The 20 tasks included in the GitHub Pages site are:
- public
- internally authored
- useful for classroom practice and software development
- unvalidated
- inappropriate as a secret held-out test after students have access to the repository

Do not report performance on this public bank as independent external validation.

## Formal validation design

For a defensible study:

1. Define the construct and competency blueprint before item writing.
2. Create a larger private candidate pool that is never committed to the public repository.
3. Pilot a development subset and revise instructions/rubrics there.
4. Freeze a separate evaluation subset before examining engine/rater performance on it.
5. Hash and archive the frozen item file so post-hoc modification is detectable.
6. Have at least two raters score responses independently without seeing other raters' scores or automated indicators.
7. Report exact agreement, confusion matrices, and an appropriate chance-corrected agreement coefficient.
8. Adjudicate disagreements after independent scoring is complete.
9. Analyze agreement separately by competency and task where sample size allows.
10. Keep transfer scores separate from project-based supported performance.
11. Examine evidence beyond inter-rater agreement, including content representation, response processes, relationships with external evidence, consequences/fairness, and performance across genuinely novel contexts.

## Two-rater statistics in v1.9

The website and `agreement.py` implement:
- exact percent agreement
- unweighted Cohen's kappa
- quadratic weighted Cohen's kappa
- 4×4 confusion matrix
- competency-specific agreement
- disagreement export

Kappa can be unstable with small samples and can be affected by marginal distributions. Report the confusion matrix and raw agreement alongside kappa.

## Blinding

The transfer response packet contains a blinded project/set identifier and omits the student's main project manuscript and raw dataset.

For formal research, use an external code key managed according to the approved ethics/data-management plan.

## Development versus evaluation

Never tune task wording, scoring rules, or automated support based on the locked evaluation set and then report performance on the same set as held-out accuracy.
