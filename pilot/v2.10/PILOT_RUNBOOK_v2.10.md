# Classroom Pilot Runbook v2.10

## Purpose

This package prepares Research Methods Studio for a **real-novice usability and classroom-workflow pilot** while keeping the student-facing v2.9 application frozen.

The pilot has two distinct goals.

1. Determine where a person with little or no formal research-methods experience can or cannot proceed without outside rescue.
2. Determine whether the teacher can manage review, backup, recovery, and feedback without unreasonable workflow burden.

This pilot is not a validation study of the competency model. It is not a grading exercise. It does not establish psychometric reliability, educational effectiveness, or transfer.

## Frozen software condition

Student-facing baseline

`RMS-INSTRUCTIONAL-BASELINE-v2.9`

Operational package

`v2.10 Classroom Pilot Freeze & Real-Novice Usability Protocol`

Do not edit `index.html`, `404.html`, `.nojekyll`, `assets/`, `prompts/`, or `examples/` during a pilot wave.

Run

`python pilot/v2.10/scripts/verify_pilot_freeze.py`

before and after each pilot session.

A failed hash check means the participant did not necessarily use the frozen condition.

## Recommended pilot sequence

### Phase A — teacher rehearsal

Complete `TEACHER_ROUNDTRIP_REHEARSAL_v2.10.md` before involving students.

The teacher should be able to create a backup, restore it, exchange student/teacher review packets, confirm that earlier student work survives revision, and recover from one simulated storage/import problem.

Do not begin the novice pilot while a Blocker or Major workflow defect remains open.

### Phase B — first-contact novice session

Use `FIRST_CONTACT_NOVICE_PROTOCOL_v2.10.md`.

Recommended duration is 35–45 minutes.

The participant should encounter the software before receiving a research-method lecture about the task being tested. The observer may explain the usability session and privacy rules. The observer should not teach the research concept unless the scripted rescue threshold is reached.

### Phase C — later-stage pathway session

Assign one pathway scenario card from `scenario-cards/`.

The participant completes a bounded decision task in the matching pathway. The purpose is to see whether pathway explanations, Research Terms, Progressive Help, local review, and the worked exemplar are sufficient.

A participant does not need to finish a complete 18-stage paper for this usability pilot.

### Phase D — teacher review round trip

Have the teacher review the participant's packet through the static teacher workflow.

Record minutes required, file exchanges, instruction lookups, identity/filename confusion, missing evidence, privacy concerns, and whether the workflow seems realistic for the intended class size.

## Observer support levels

Keep observer support separate from the application's internal scaffold levels.

### External support 0 — no observer help

Allow the participant to use the interface and all built-in help independently.

### External support 1 — neutral navigation prompt

Use only after the participant has been unable to identify a next action for approximately two minutes.

Allowed wording

> Tell me what you are trying to do right now. Where would you look in the interface for help with that?

Do not name the correct field, design, statistic, or answer.

### External support 2 — task clarification

Use when the participant is misunderstanding the usability instruction itself.

Allowed wording

> The task is asking you to decide [repeat the task wording]. Use the site however you normally would.

Do not explain the research concept.

### External support 3 — concept rescue

Use only when needed to prevent the session from ending prematurely. Record the exact help given. Once external concept rescue is provided, that task is no longer evidence of interface-guided completion without outside teaching.

## What counts as a friction event

Record an event when a participant cannot identify a next action, says a term is unclear, enters placeholder language, repeatedly opens the same help without progress, selects a path/design inconsistent with the stated evidence plan, confuses a measurement with an independent unit, chooses an analysis from surface keywords, cannot explain what one row represents, tries to copy exemplar content, misses a blocker, cannot recover/save work, requires observer rescue after built-in help, or abandons the task.

## Keep measures separate

Do not create one usability score.

Keep task completion, time to first meaningful action, time on task, built-in scaffold use, observer support, navigation reversals, terminology clarification, methodological misconception events, backup/recovery success, teacher review time, confidence rating, and open-ended feedback as separate records.

## Go / no-go rule

Proceed to a broader pilot wave only when no Blocker or Major defect remains open, all frozen hashes pass, backup/restore rehearsal passes, the student/teacher review round trip passes, privacy/consent/approval questions are resolved, the teacher knows the emergency recovery procedure, and the go/no-go decision is signed.

Moderate and Minor issues may remain only when documented and judged unlikely to prevent completion, corrupt data, expose private information, or materially change a research-method decision.

## After a pilot wave

Do not edit the software after each individual observation.

After the planned wave is complete, freeze the raw records, classify recurring friction, separate user misunderstanding from software defect, decide which changes require a new instructional baseline, then implement and rerun browser/regression QA under a new version.
