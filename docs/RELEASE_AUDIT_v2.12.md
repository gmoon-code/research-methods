# Release Audit — v2.12 Persistent Ask Research AI

## Added

### Persistent corner chatbot

A floating **Ask Research AI** launcher is available throughout Research Methods Studio.

It remains available across:

- all 18 research stages
- Literature Workspace
- Methods Lab
- Data & Statistics Lab
- Writing Lab
- exemplar use
- current-project navigation

The conversation persists while the student moves between stages.

### Questions the helper can answer

The helper is designed for:

- terminology clarification
- stage/field clarification
- differences among research designs
- variable, unit, sampling, measurement, validity, and ethics questions
- literature-search and synthesis reasoning
- data-structure and statistics-selection reasoning
- explanation of validated analysis output
- Results and Discussion boundaries
- citation and academic-writing questions
- explanations of the student's accumulated research decisions
- general research-method questions

### Project-aware context

When **Use my current project context** is enabled, the browser sends a minimized context packet containing relevant information such as:

- current stage and research path
- most recently focused field
- current stage responses
- accumulated Research Snapshot chain
- relevant extracted source records during literature stages
- schema and stored analysis summaries during analysis stages
- limited writing context during writing stages
- deterministic diagnostic flags

Raw datasets are not sent by default.

The student can turn project context off for a question.

### Student-authorship guard

The helper can answer clarification questions directly.

When a student asks it to complete a current unfinished research decision, the helper protocol requires scaffolding before completion.

The browser can display:

- scaffold level used
- whether the interaction counts as stage support
- targeted follow-up questions
- an explicit authorship-guard explanation when a direct answer was withheld
- verified citations returned by the approved backend

Level 5 direct rescue is supported only when explicitly reported by the backend.

### Learning Analytics integration

The backend returns whether an interaction materially scaffolded the current stage.

Only interactions marked as stage support are sent to the Competency engine.

This allows a general question such as “What is an experimental unit?” to remain distinct from AI help that materially advances an unfinished Stage 10 decision.

### Privacy

The interface warns students not to enter names or unnecessary private information.

No model-provider API key is stored in the static GitHub Pages application.

AI requests are sent only to a teacher/school-configured secure server-side endpoint.

### Backend contract

Added:

- `docs/AI_HELPER_PROTOCOL_v2.12.md`
- `docs/AI_HELPER_RESPONSE_SCHEMA_v2.12.json`

The existing AI Coach review endpoint remains supported.

A separate chatbot endpoint can be configured, or one server can implement both the existing review contract and the new `mode=helper_chat` contract.

### Optional reference backend

Added an optional Cloudflare Worker example using the OpenAI Responses API and Structured Outputs.

Files:

- `backend/openai-cloudflare-worker/worker.mjs`
- `backend/openai-cloudflare-worker/wrangler.toml.example`
- `backend/openai-cloudflare-worker/README.md`

The reference backend keeps the provider key server-side and sets `store: false`.

It is a reference implementation, not a claim that the user's classroom backend has already been deployed or approved.

## Browser QA

The v2.12 live Chromium test verifies:

- persistent launcher availability
- open/close behavior
- privacy warning
- general concept clarification
- no stage-support event for non-stage clarification
- current stage/path context transmission
- no raw-dataset field in the default context packet
- focused-field awareness
- authorship guard for an unfinished research question
- scaffold-level support logging
- context-off mode
- cross-stage conversation persistence
- Stage 10 context refresh
- 360 px mobile behavior
- no mobile horizontal overflow
- disconnected-backend explanation

Final result:

`26 / 26 PASS`

## Core methodological logic

The following major research-method engines are inherited unchanged from v2.11:

- Research Coach
- Methods
- Statistics
- Literature
- Writing
- Transfer
- Competency
- Curriculum
- Pathway engine
- Path-specific coach
- Progressive Rescue
- novice-friction guard
- multi-path exemplar bank
- Research Snapshot
- concrete response-example model

v2.12 changes AI connectivity, conversational support, and browser UI.

## Pilot consequence

The presence and use of a conversational AI helper materially changes the scaffold condition.

Use:

`RMS-INSTRUCTIONAL-BASELINE-v2.12`

If the chatbot is enabled in a pilot, its endpoint/model/prompt policy should remain frozen for that pilot wave.
