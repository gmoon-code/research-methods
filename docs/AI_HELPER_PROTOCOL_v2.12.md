# Persistent Ask Research AI Protocol v2.12

## Purpose

Ask Research AI is a conversational research-methods helper that remains available throughout Research Methods Studio.

A student can ask questions at any stage about:

- unfamiliar research terminology
- what a stage or field is asking
- why a pathway or design fits
- the difference between two methods
- a warning or local diagnostic
- the student's current accumulated project
- literature-search and synthesis reasoning
- variables, units, sampling, measurement, ethics, and validity
- data structure and analysis-selection reasoning
- interpretation of validated statistical output
- Results, Discussion, citation, and writing decisions
- any other research-method question that can be answered without inventing evidence

## Student-authorship rule

The helper distinguishes clarification from completion.

### Clarification

The AI can answer directly when the student asks:

- what a term means
- why a method works a certain way
- how two research concepts differ
- what an instruction means
- what the student's already-recorded project says
- why a warning appeared
- how to interpret a validated output

### Current unfinished research decision

If the student asks the AI to choose or write a current unfinished research decision, the default sequence is:

student attempt → diagnostic explanation → targeted question → structured reasoning → parallel example → revision

A complete answer is not supplied before the student has had a meaningful opportunity to make the decision.

### Existing attempt

When a substantive attempt exists, the AI can:

- identify the methodological problem
- explain why it is a problem
- compare alternatives
- suggest a revision strategy
- help revise the student's own wording

### Direct rescue

Direct rescue is Level 5 support.

It must be explicit in the response metadata and should require the student to adapt, justify, or explain the supplied structure.

## Context sent to the backend

The browser sends a minimized context packet.

It may contain:

- current stage and path
- most recently focused notebook field
- current stage field values
- accumulated Research Snapshot chain
- relevant extracted source records during literature stages
- data schema and stored analysis summaries during data/analysis stages
- limited Writing Lab draft context during writing stages
- deterministic local diagnostic flags
- recent AI-helper conversation turns

It does not send raw datasets by default.

The student can turn **Use my current project context** off.

## Privacy

Do not ask students to enter names or unnecessary personal information.

The site never stores a model-provider key.

The browser sends requests only to a teacher/school-configured secure backend.

The backend must implement its own:

- authentication/authorization if required
- rate limiting
- origin controls
- data-retention policy
- provider data-control settings
- school/privacy approval

## Statistics rule

The helper may explain:

- data structure
- estimands
- assumptions
- test-family selection
- effect sizes
- uncertainty
- validated statistical output already produced by deterministic code

It should not perform new inferential calculations from raw classroom data.

## Literature rule

The helper must not invent sources, quotations, findings, or DOIs.

Source-specific claims require either:

1. verified source records included in the request, or
2. an approved backend retrieval system that returns verifiable citations

If neither is available, the response should mark the claim as needing verification.

## Stage-support logging

The backend returns:

- scaffold level 0–5
- whether the answer counts as support for the current stage
- the affected stage

General research conversation that does not materially assist the student's current stage can return `counts_as_stage_support = false`.

When the answer materially scaffolds a current stage decision, the browser records the event in Learning Analytics.

## Response contract

The helper backend returns JSON conforming to:

`AI_HELPER_RESPONSE_SCHEMA_v2.12.json`

The browser displays the answer, scaffold level, authorship-guard explanation when relevant, follow-up questions, and verified citations.
