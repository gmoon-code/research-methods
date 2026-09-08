# Progressive Help & Worked-Reasoning Rescue v2.5

## Purpose

v2.5 operationalizes a no-dead-end rule:

> A student who does not know what to do next should always have a visible route to more support without the system silently making the research decision for them.

## Five-level rescue ladder

### Level 1 — Clarify the task
Restates what the field or laboratory decision is asking and prompts the student to compare that task with the attempt they already made.

### Level 2 — Explain the concept
Provides conceptual explanation and targeted questions.

### Level 3 — Compare examples and alternatives
Shows expected specificity, common mistakes, and structured option comparisons when a genuine decision set exists.

### Level 4 — Worked parallel example
Walks through the reasoning in a different or generic research context. The example is explicitly labeled as parallel evidence, not an answer to copy.

### Level 5 — Build my own answer
Provides a field-specific answer frame. Students supply the actual content and a required explanation of why the answer fits their project.

For text fields, the tool only combines the student's own typed components.
For select fields, the student chooses the option and must justify it before applying.

## Attempt preservation

The first time optional progressive help is requested for a field, the system preserves the current field value.

If the field is blank, the snapshot is recorded as:

`blank_when_help_requested`

This makes it possible to distinguish:
- an independent field attempt
- inability to start before help
- later supported revision

The rescue system never overwrites the original attempt record.

## Scaffold logging

Every distinct level used is logged through the existing Competency engine.

The mapping remains:
- L1 diagnostic/reflection
- L2 conceptual explanation
- L3 structured choice/alternative support
- L4 worked parallel example
- L5 direct structured rescue requiring student adaptation/rationale

Learning Analytics can therefore see the highest optional support level used.

## Coverage

The model contains rescue support for all 113 curriculum notebook fields.

The Literature, Methods, Data & Statistics, and Writing laboratories also receive progressive-help entry points in every major tab.

## Global no-dead-end route

A top-level **I’m stuck** control opens a current-stage navigator showing:
- visible pathway-relevant fields
- whether each has a response
- highest progressive-help level already used

Students can enter the help ladder from that navigator or directly from an individual field.

## Authorship protection

Level 5 does not infer a missing research decision from the student's topic.

The student must provide:
1. the answer/choice
2. project-specific detail where appropriate
3. a rationale for why it fits

The application then stores both the previous value and supported revision.

## Browser dependency-order correction

v2.4 loaded `path-coach.js` before the base `coach.js` and `methods.js` modules it captures at initialization. Unit tests did not reveal the problem because they supplied mock dependencies before loading the pathway coach.

v2.5 changes the real browser script order so:
- `coach.js` loads before `path-coach.js`
- `methods.js` loads before `path-coach.js`
- `competencies.js` loads before the rescue modules

A regression test now checks this order directly.
