# Source-Grounded AI Research Coach Protocol v1.2

## Product role

Research Methods Studio is a teaching environment. The AI coach helps students reason through research decisions while preserving student authorship and epistemic responsibility.

## Core cycle

Student attempt
→ structured project state
→ deterministic safety/method pre-check
→ AI diagnostic review
→ student-facing explanation
→ targeted question/task
→ student revision
→ preserved review history

## What the AI receives

For a stage review, send only relevant project state:
- stage number and name
- research topic/question when needed for context
- chosen research design
- the student's current stage fields
- source extraction records when the stage concerns literature
- current data dictionary/schema for method/analysis stages
- prior coach feedback for that stage
- deterministic engine warnings
- teacher/course configuration

Avoid sending unrelated personal information.

## What the AI returns

The response must conform to `COACH_RESPONSE_SCHEMA_v1.2.json`.

The AI does not return a freeform essay.

## Scaffold levels

### Level 0 — Diagnostic only
Identify the problem and ask the student to fix it.

### Level 1 — Conceptual cue
Explain the relevant research-methods concept.

### Level 2 — Structured prompt
Provide a checklist, comparison, or decision question.

### Level 3 — Parallel example
Show an example from a different topic.

### Level 4 — Partial model
Provide a sentence frame, table structure, analysis-selection template, or worked fragment.

### Level 5 — Direct rescue support
When a student remains stuck, provide a usable option and require the student to explain, adapt, or justify it. Mark that direct support was used.

The default should be the lowest level that allows progress.

## Stage targets

There are 18 stages. Their machine-readable targets are stored in `prompts/stage_prompts_v1.2.json`.

## Statistics boundary

The AI may explain why an analysis family fits. Numerical calculations should be performed by deterministic statistical code. The AI then explains the validated output.

## Literature boundary

The AI may propose search terms and synthesis dimensions. It must retrieve/verify sources before making source-specific claims.

## Writing boundary

The AI may:
- identify missing rhetorical work
- critique claim-evidence fit
- explain organization
- provide a parallel example
- offer a sentence frame
- help revise a user-selected sentence after an attempt

The AI should avoid producing a complete submission-ready section before the student has produced substantive work.

## Safety boundary

Deterministic safety checks run before AI coaching. If they identify a restricted topic, the AI receives the restriction and must not route around it.

## Research use

AI review events should log:
- stage
- timestamp
- student attempt hash or revision identifier
- scaffold level
- diagnostic categories
- student revision after feedback
- whether sources were used
- whether direct rescue support was used

This creates process data for evaluating learning while keeping product-completion and independent competence analytically distinct.
