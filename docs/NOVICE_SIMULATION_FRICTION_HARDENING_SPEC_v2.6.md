# v2.6 Novice Simulation & Friction Hardening

## Purpose

v2.6 tests the complete beginner-facing support architecture using synthetic novice mistakes and adds a diagnostic guard for errors that simple nonblank-field checks could miss.

## New guard

`assets/novice-friction.js` wraps the v2.5 pathway coach.

It preserves the existing pathway-specific review and adds targeted beginner checks. Blocker-level friction becomes part of `stageGate()`, so a student cannot mark a stage ready merely because a field contains `idk`, an unfinished scaffold token, or a high-risk methodological misconception detected by a rule.

## Scope

The guard currently addresses:
- unfinished placeholder responses
- global research-gap overclaims
- random/convenience sampling contradictions
- observational predictor described as manipulated
- measurement confused with independent unit
- binary/continuous confusion
- paired/repeated data analyzed as independent
- 0/1 coding used as justification for continuous analysis
- averaging p-values for meta-analysis
- p-value probability-of-hypothesis errors
- significance/magnitude conflation
- non-significance interpreted as proof of no effect
- selected confidence-interval probability misconceptions

## No silent answer generation

When a blocker is detected, the next action points to the existing Progressive Help system. The friction guard does not rewrite the student's field.

## Validation boundary

These are deterministic educational diagnostics developed for usability hardening. They are not validated assessment items and should not be interpreted as psychometric evidence.
