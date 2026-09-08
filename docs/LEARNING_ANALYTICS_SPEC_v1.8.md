# Research Competency & Learning Analytics v1.8

## Purpose

v1.8 changes the product from a workflow tracker into a learning-evidence system.

Completion and competence are not treated as equivalent. The model separates:

- **Independent Reasoning (IR)** — evidence captured before recorded support
- **Supported Performance (SP)** — current/latest performance after instruction or feedback
- **Scaffold Load (SL)** — the highest recorded support level used, on a 0–5 scale
- **Teacher-coded evidence** — optional teacher rubric ratings that remain distinct from automated indicators

## Critical limitation

The 0–3 competency framework is a **provisional, unvalidated instructional rubric**.

It must not be described as:
- a validated measure of research ability
- a psychometric scale
- a grade
- an admissions metric
- proof of transfer to unfamiliar research problems

External validation would require a separate research program with human-coded evidence, reliability analysis, construct validation, and transfer tasks.

## Ten competencies

1. Research question formulation
2. Literature search and source evaluation
3. Literature synthesis and study justification
4. Operationalization and measurement
5. Study design and validity reasoning
6. Sampling, ethics, and research responsibility
7. Data integrity and descriptive reasoning
8. Statistical reasoning and uncertainty
9. Evidence coordination and claim calibration
10. Scholarly communication and citation integrity

The machine-readable definitions and stage mappings are in `COMPETENCY_MODEL_v1.8.json`.

## Independent checkpoint

Every stage now has **Save independent checkpoint**.

The system:
1. evaluates the current work silently using the local diagnostic rules
2. stores the diagnostic level and a one-way fingerprint of the stage work
3. does not reveal the feedback yet
4. marks the checkpoint as independent only if no support event has already been recorded in that stage

This reduces a major measurement problem: calling post-help work “independent.”

## Supported performance

Each local review is stored as a competency review event.

For a competency spanning multiple stages, the supported/current indicator uses the latest local review from each mapped stage.

## Scaffold levels

0. No recorded support  
1. Diagnostic feedback or reflection prompt  
2. Conceptual cue/explanation  
3. Structured decision tool/checklist  
4. Worked parallel example  
5. Direct rescue/modelled option requiring adaptation

The current application automatically logs several existing scaffolds:
- local diagnostic review → Level 1
- AI diagnostic review → Level 1
- Interest Compass → Level 2
- Boolean Search Builder → Level 3
- Research Design Matcher → Level 3
- Statistics decision wizard → Level 3

Future direct-rescue features must log Levels 4–5 explicitly.

## Teacher ratings

The Teacher Dashboard now includes optional 0–3 competency ratings inside each student review.

Teacher ratings are exported in the feedback packet and imported back into the student project.

They are not averaged into the automated indicator. The dashboard shows them separately.

## Revision evidence

v1.8 records review-to-review score changes as revision-cycle events.

A positive revision cycle does not prove conceptual learning. It is process evidence that the student's work changed in a direction recognized by the current diagnostic rules.

## Learning Analytics dashboard

The new **Learning Analytics** workspace shows:
- independent evidence coverage
- mean IR where evidence exists
- mean SP where evidence exists
- highest recorded scaffold level
- revision cycles
- competency-by-competency evidence
- teacher ratings
- event timeline
- rubric definitions and interpretation warnings

## Export

Students/teachers can export:
- a Markdown learning-evidence report
- a JSON analytics record

The student review packet sent to the Teacher Dashboard now includes a competency snapshot but still omits raw data and full manuscript text.
