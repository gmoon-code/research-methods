# Ask Research AI Pilot Policy v2.13.3

## Decide before the pilot wave

Choose one of two conditions.

### AI disabled

Set the pilot AI policy to `disabled`.

The launcher may be visible, but the secure AI helper remains unavailable.

### Approved AI enabled

Use `secure-approved-backend`.

Before the first participant:

- freeze the chatbot endpoint URL
- freeze the backend model choice
- freeze the developer/system instructions
- freeze retrieval/web-search permissions if any
- document provider retention/data controls
- document school/privacy approval
- test rate limits and failure behavior
- confirm no API secret appears in browser source

Do not switch models, prompts, retrieval settings, or providers in the middle of a pilot wave without creating a new condition/version record.

## Observation

Record AI interactions separately from observer support.

The application already stores:

- stage
- timestamp
- scaffold level returned by the backend
- whether the response counts as stage support
- response type

During usability observation, also record whether:

- the student found the chatbot independently
- the chatbot resolved the question
- the student misunderstood the chatbot as an answer generator
- the student relied on it when local guidance would have been enough
- the response created new confusion
- the student copied a model without adapting it
- the backend was unavailable or slow

## Independence

If Ask Research AI materially scaffolds the current stage before an independent checkpoint, the interaction should affect independence evidence just like other recorded support.

General questions that do not materially assist the current stage can remain non-stage support when the backend returns `counts_as_stage_support=false`.
