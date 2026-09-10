# Student Guided Flow Redesign Specification v2.13

## Governing rule

v2.13 uses one design rule throughout the student interface:

> One task should demand attention at a time, within a continuously visible map of the whole research journey.

Progressive disclosure applies to task complexity. It does not remove learner orientation.

A student should be able to determine, without searching:

1. where they are
2. what they are working on
3. what they already completed
4. what important decisions they already made
5. what comes next
6. how to return to earlier work
7. whether earlier changes require later work to be reviewed

## Persistent learner orientation

### Research route

The complete five-phase, 18-stage research route remains visible on desktop.

The current phase is expanded by default. Future phases remain visible and can be expanded so students understand the road ahead.

Route states are:

- Done for now
- Working now
- Available
- Coming later
- Needs review after an earlier change

Future stages use soft gating. Students may preview what a later stage will do without opening the full advanced form before prerequisites are established.

On mobile, the route is available through a persistent Route control.

### Current accumulated work

The right-side Current Project panel remains visible on desktop.

Each stage also carries forward up to four decisions that are most useful for the current task. Examples include the research question, design, independent unit, outcome, primary result, and claim boundary.

The complete My Research Snapshot remains one click away throughout the project.

### Past → present → future continuity

Every stage explicitly communicates:

- FROM EARLIER
- NOW
- NEXT

This explains why the current task exists and how it will be used later.

## Student shell

The ordinary student toolbar is reduced to:

- save state
- Route on mobile
- My Research Snapshot
- Help
- More

Teacher Dashboard, Pilot & Recovery, Learning Analytics, Transfer Lab, AI configuration, and other operational controls remain available through teacher/setup mode but do not compete with the student's main task.

The introductory hero appears only before the project begins.

## Stage workflow

Each stage uses:

1. Learn
2. Do the work
3. Check & revise

### Learn

The default Learn view shows:

- the stage purpose
- a short list of tasks
- one compact example
- a disclosure for detailed explanation, research terms, and common mistakes
- one primary Start this stage action

### Do the work

Long stages retain a visible subsection outline.

Only one subsection is expanded as the active working area.

The sticky footer provides one primary next action:

- Next part
- or Check this stage

### Check & revise

The student sees:

- a student-facing check
- missing or inconsistent decisions
- optional self-check questions
- Ready to continue
- the next stage

The interface does not present local diagnostic scores as student grades.

## Field design

Each field defaults to:

- a plain-language-first label
- the technical research term where useful
- an expected response shape and approximate length
- a current word count for text responses
- whether the field is needed, optional, or usually not needed for the current path
- Example
- Help

Detailed examples, progressive rescue, terminology, and AI assistance remain available after the student asks for them.

## Unified Help

Help consolidates the previously separate student-facing support entry points.

A student can ask for:

- explanation of the current stage
- clarification of the current field
- expected response length/detail
- weak and strong examples
- progressive help
- Research Terms
- Ask Research AI

The underlying scaffold systems remain separate for logging and instructional integrity, but the student does not need to know the internal architecture.

## Research-path decision

Path selection occurs after the student has developed a working research question and question type.

The interface shows:

1. the recommended path from the selected question type
2. why it fits
3. Use this research path
4. an optional comparison of other paths
5. I am still deciding

Changing paths preserves all work and marks downstream worked stages for review.

## Dependency-aware review

v2.13 adds explicit downstream review states.

Examples:

- research question change → later literature/design/write stages with work may need review
- design/claim change → later method/data/write stages may need review
- variable/unit change → later sampling/method/analysis/write stages may need review
- method/data-plan change → later data/analysis/write stages may need review
- analysis change → Results and interpretation stages may need review
- Results change → Discussion/closing stages may need review

The student's later work is never deleted by this mechanism.

## Single source of truth

v2.13 synchronizes overlapping Stage and Lab records.

### Methods

Key Stage and Methods Lab values share one canonical decision, including:

- primary outcome
- experimental/observational unit
- claim boundary
- row unit
- population
- sample
- sampling method
- generalization boundary

### Writing

Stage and Writing Lab share the same drafts for:

- Literature Review
- Results
- Discussion
- Conclusion
- Abstract

### Data schema

Stage 12's data-column plan is derived from the structured Data Table & Dictionary schema.

Older projects that contain conflicting Stage and Lab versions preserve the earlier alternate version in the Research Snapshot migration archive.

## Major Lab flow

Literature, Methods, Data & Statistics, and Writing Labs now present one current step with the full Lab route available on demand.

### Literature source evaluation

Source work is divided into:

1. identify the source
2. decide whether the source belongs
3. extract evidence for later synthesis

TRAPP and theme coding remain available when relevant.

### Methods

Dense method steps use progressive internal substeps for design, unit/replication, sampling, and ethics.

### Data & Statistics

Analysis setup carries forward the research question, design, unit, and outcome so students do not need to reconstruct the study from memory.

### Writing

The Writing Lab opens and edits the same section draft used by the Stage notebook.

## Error prevention and recovery

v2.13 adds or strengthens:

- explicit browser-local save language
- persistent save-failure banner
- backup-first new-project flow
- Undo for key record deletions
- future-stage soft gating
- dependency review states
- preservation of older duplicate versions
- CSV size guard
- post-import save verification and import rollback when persistence fails

## Mobile

At 360 px:

- desktop route/sidebar collapses
- Route remains directly accessible
- Snapshot, Help, and More remain directly accessible
- the global horizontal tool strip is removed
- Ask AI retains a readable label
- the page does not require horizontal scrolling in the tested state

## Important boundary

v2.13 is a software and instructional-interface redesign.

The automated checks and rendered-browser QA do not establish:

- educational effectiveness
- construct validity
- psychometric validity
- accessibility conformance across all assistive technologies
- usability with real students

Those require the planned real-novice usability work and, where appropriate, formal research/ethics procedures.
