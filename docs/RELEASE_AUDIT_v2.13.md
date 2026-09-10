# Release Audit — v2.13 Guided Student Flow

## Release status

**Software QA: PASS**

**Pilot readiness: NOT YET GO**

The student-facing build has passed the current automated and rendered-browser gates. Real novice sessions still require the manual pilot-preflight items under `pilot/v2.13/`.

## Why v2.13 exists

The v2.12 usability audit identified a new dominant problem.

The site had accumulated strong instructional scaffolds, but too many of those supports, tools, navigation controls, status systems, and research concepts were visible at once.

v2.13 reduces interface competition while preserving the student's larger map of the research process.

The governing rule is:

> One task should demand attention at a time, within a continuously visible map of the whole research journey.

## Persistent orientation retained

Students still have access to:

- all five research phases
- all 18 stages
- current Stage and phase
- completed stages
- future stages
- future-stage previews
- Needs review states
- relevant earlier research decisions
- My Research Snapshot
- save state
- contextual Help
- Ask Research AI

The redesign therefore does not become a blind wizard.

## Student-shell simplification

The ordinary student toolbar now exposes:

- My Research Snapshot
- Help
- More
- Route on mobile
- save state

Teacher Dashboard, Pilot & Recovery, Learning Analytics, Transfer Lab, AI configuration, and other operational controls remain available in teacher/setup mode.

The large product-introduction hero is removed after project creation.

## Stage flow

Every Stage now communicates:

- FROM EARLIER
- NOW
- NEXT

Stages use:

1. Learn
2. Do the work
3. Check & revise

Long Work screens preserve the Stage outline but expand only one subsection.

The sticky footer supplies one primary next action.

## Current-work visibility

Stage-specific carry-forward context keeps up to four earlier decisions visible.

Examples include:

- research question
- design
- independent case/unit
- outcome
- primary result
- claim boundary

The complete Research Snapshot remains available at all times.

## Future-stage soft gating

Students can inspect where the route is going without opening a full advanced form prematurely.

A future-stage preview explains:

- what earlier work will lead into it
- what the future Stage will accomplish
- what comes afterward

## Help consolidation

Field help now defaults to two compact controls:

- Example
- Help

The unified Help surface preserves:

- task explanation
- response length
- too-vague and good examples
- detailed models
- progressive rescue
- Research Terms
- Ask Research AI

The underlying support/logging systems remain intact.

## Plain-language-first research terminology

High-jargon fields now lead with the student decision.

Examples include:

- “What factor are you changing or measuring first?” before predictor/exposure/independent variable
- “What result will you measure or observe?” before outcome/dependent variable
- “What counts as one independent case?” before experimental/observational unit
- “What exact difference, relationship, or quantity will answer your question?” before primary estimand

## Research-path choice

Path selection is recommendation-first.

The student sees:

1. recommended path from the current question type
2. explanation
3. Use this research path
4. optional comparison of alternatives
5. I am still deciding

Changing path preserves existing work and marks downstream worked stages for review.

## Dependency-aware revision

Changing an earlier research decision can mark dependent stages:

**Needs review after an earlier change**

The student's later answers remain saved.

This applies to major question, design, unit, sampling/method, data-plan, analysis, Results, and interpretation changes.

## Single-source synchronization

### Methods

Key Stage and Methods Lab values are synchronized bidirectionally.

### Writing

Literature Review, Results, Discussion, Conclusion, and Abstract drafts are shared between the Stage notebook and Writing Lab.

### Data plan

Stage 12's data-column summary is generated from the structured schema.

Older projects containing conflicting duplicate versions preserve the older alternate value in the Research Snapshot migration archive.

## Major Lab redesign

Literature, Methods, Data & Statistics, and Writing Labs now show one current Lab step and keep the full Lab route behind a disclosure.

Literature source evaluation is split into:

1. identify
2. screen/decide
3. extract evidence

Dense Methods decisions use additional progressive internal substeps.

Data-analysis setup carries earlier design/unit/outcome context forward.

## Recovery and error prevention

v2.13 adds or strengthens:

- Saved on this browser wording
- persistent save-failure banner
- backup-first new-project workflow
- Undo for key record deletions
- CSV-size guard
- post-import persistence check
- rollback when data import cannot be saved
- future-stage soft gate
- dependency review markers
- preservation of older duplicate Stage/Lab content

## Rendered browser QA

Result:

**52 / 52 PASS**

No unexpected JavaScript page errors were recorded.

At 1440 × 1000:

- Stage 1 Learn height: **889 px**
- first Stage 1 Work field top: **823 px**
- Stage 1 Work visible Stage buttons: **18**

The first normal Work field appears inside the first desktop viewport in the tested state.

See `docs/UX_BROWSER_QA_v2.13.md`.

## Command-level regression

Result:

**40 / 40 PASS**

The suite includes current v2.13 replacements for historical static tests whose exact old UI-string assertions are no longer product requirements.

## Static serving

Result:

**23 / 23 PASS**

## Inherited core logic

The current inherited-core integrity test verifies that 22 substantive research/instruction files remain byte-identical to v2.12, including the deterministic Coach, Methods, Statistics, Literature, Writing, Transfer, Competency, Curriculum, Pathway engine, path-specific coach, Rescue state engine, novice-friction guard, exemplar content/engine, accessibility engine, student-guidance model, response examples, AI adapter/helper logic, and Stage prompts.

The learner-facing flow/UI files intentionally changed.

## Instructional baseline

`RMS-INSTRUCTIONAL-BASELINE-v2.13`

Baseline digest:

`0f44cb41e45156d6dd999ec3b8b3e42bfe9efbaedef85eabf275f17448e5d93c`

Student-facing file count:

`89`

## Pilot freeze

Freeze digest:

`212079926af3e4fa8d9375b06159635622a924bbae3f13c3ec36f8dc8e63fdcf`

Frozen student-facing files:

`89`

Freeze verification passes.

## Pilot release gate

Current state:

**NOT YET GO**

There are 18 pre-flight requirements still marked PENDING, including teacher backup/restore rehearsal, review-packet round trip, privacy/research-use decisions, AI condition, target-device verification, issue review, and signed go/no-go decision.

This is intentional.

The software build is frozen as a pilot candidate. The classroom/pilot release gate remains separate.

## Validation boundary

The v2.13 automated/browser results establish tested software behavior.

They do not establish:

- real-student usability
- educational effectiveness
- psychometric validity
- construct validity
- accessibility conformance with every assistive technology
- institutional research approval

Those require separate evidence.
