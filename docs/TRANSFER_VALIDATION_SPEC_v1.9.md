# Transfer Assessment & Validation Infrastructure v1.9

## Purpose

v1.9 adds a distinct source of evidence for research competence: performance on unfamiliar research scenarios.

Project performance and transfer performance remain separate.

## Student transfer workflow

1. Start a three-task transfer set.
2. The selector favors tasks with low keyword overlap with the student's main research topic and broad competency coverage.
3. The student responds without coaching.
4. The independent response is locked.
5. Only after submission may the student open an optional Level-2 conceptual cue.
6. A supported revision can be stored separately.
7. The completed set can be exported as a blinded response packet.
8. Human ratings can later be imported and displayed as transfer evidence.

The software does not automatically assign a transfer competency score from free-response prose.

## Candidate public bank

The release contains 20 internally authored candidate tasks across:
- learning science
- ecology
- biochemistry
- plant biology
- environmental science
- microbiology
- chemistry
- qualitative research
- scientific writing
- literature review

The tasks span all ten v1.8 competencies.

They are public and unvalidated. They are appropriate for classroom transfer practice and software development. They are not a secret held-out validation set.

## Rater mode

A rater imports a blinded student response packet.

For every task–competency pair the rater sees:
- scenario
- independent response
- task-specific evidence criterion
- provisional 0–3 rubric

The supported revision is available in a collapsed section but should not be scored as independent evidence.

The rater exports a standalone rating packet.

## Agreement mode

Two independently created rater packets can be compared using:
- exact agreement
- unweighted Cohen's kappa
- quadratic weighted Cohen's kappa
- 4×4 confusion matrix
- competency-level agreement
- disagreement export

Agreement is evidence about scoring consistency. It is not by itself construct validity.

## Formal validation infrastructure

The `validation/` folder includes:
- validation protocol
- rater manual
- private held-out item guide
- CSV rating template
- adjudication template
- standalone Python agreement script

Formal held-out items must live outside the public GitHub repository.
