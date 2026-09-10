# Pilot Change-Control Policy v2.11

## Frozen instructional baseline

`RMS-INSTRUCTIONAL-BASELINE-v2.11`

The v2.11 package adds pilot-operation documents. It does not change student-facing application files.

## During a pilot wave

Do not change student-facing files because one participant encounters a problem. Log the issue first.

A wave is the planned participant group intended to experience the same software condition.

## Emergency exception

A mid-wave hotfix is permitted only for a Blocker or severe Major issue such as data loss, broken core navigation, unusable backup/restore, privacy exposure, inaccessible task path, or a methodological defect that can materially mislead participants with no effective warning.

When a hotfix occurs:

1. stop new sessions
2. preserve the old release ZIP and manifest
3. record the defect and affected sessions
4. change the version/baseline
5. rerun automated regression and browser QA
6. resume only under the new baseline
7. do not pool pre-fix and post-fix observations as one identical software condition

## After a wave

Classify each issue as software defect, unclear instruction, missing definition, inappropriate scaffold, pathway mismatch, statistical/methodological misconception not caught, exemplar-transfer problem, teacher workflow burden, accessibility issue, participant-specific misunderstanding, or unresolved.

Do not treat every participant error as a software bug.

## Required change record

Every implemented change after the pilot should include issue ID, evidence, severity, affected path/stage, exact old behavior, exact new behavior, whether the change is student-facing, whether the instructional baseline changes, tests rerun, and the decision about comparability with earlier pilot data.
