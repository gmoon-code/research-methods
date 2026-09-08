# Student Research Journey & Teacher Dashboard v1.7

## Purpose

The earlier releases built powerful individual laboratories. v1.7 adds the orchestration layer that helps students know what to do next and gives teachers a practical review workflow without requiring a paid backend.

## Student Journey

Five milestones organize the 18-stage curriculum.

### M1 — Question Ready
Stages 1–4.
Requires a final research question and local readiness checks.
Teacher checkpoint.

### M2 — Evidence Base Ready
Stages 5–8.
Requires literature-search, source-evaluation, synthesis, and literature-review work.
Student-completion milestone by default.

### M3 — Method Approved
Stages 9–12.
Requires Methods Lab with no critical blockers and at least one locked protocol version.
Teacher checkpoint.
Ethics/safety status is surfaced explicitly.

### M4 — Analysis Ready
Stages 13–15.
Requires an imported dataset and at least one stored analysis record.
Teacher checkpoint.

### M5 — Paper Ready for Final Review
Stages 16–18.
Requires core closing drafts and whole-paper review.
Teacher checkpoint.

## Iterative research

Milestones are not irreversible locks. A literature finding can force a research-question revision. Pilot data can expose a measurement problem. Teacher feedback can reopen earlier stages.

The pathway therefore guides sequence while preserving iteration.

## Teacher workflow on static GitHub Pages

A shared cloud dashboard is impossible without adding a backend. v1.7 therefore uses portable review packets.

Student:
1. completes work locally
2. exports a teacher review packet
3. sends the JSON file to the teacher

Teacher:
1. imports one or many packets into the Teacher Dashboard
2. reviews milestone status, blockers, ethics, protocol, analysis, and writing status
3. approves or requests revision
4. exports a teacher feedback packet

Student:
1. imports the teacher feedback packet
2. checkpoint status and comments appear in the Student Journey

## Privacy design

The student review packet intentionally excludes:
- imported raw dataset values
- full manuscript text
- full source notes

It includes status and selected project summaries.

Students can use an alias/project code rather than a real name.

## Teacher Dashboard

The dashboard shows:
- number of imported projects
- ethics review counts
- do-not-facilitate counts
- protocols locked
- projects with analysis records
- milestone completion/approval matrix
- individual research question and design
- first methodological blocker
- pending teacher checkpoints

## Methodological role

Teacher approval is especially appropriate before:
- collecting human-participant or otherwise sensitive data
- beginning a student-designed experimental intervention
- proceeding after critical Methods Lab warnings
- finalizing a statistical analysis when unit structure or assumptions require judgment

The dashboard does not replace institutional ethics review or school policy.
