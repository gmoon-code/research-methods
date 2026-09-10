# Release Audit — v2.13.1 Persistent Ask Research AI

## Purpose

v2.13.1 corrects an over-simplification introduced during the v2.13 student-shell redesign.

Ask Research AI remains a separate conversational support tool and is now unmistakably persistent.

## Student-visible behavior

The launcher is available:

- on the welcome screen before Stage 1
- throughout all 18 research stages
- while major Labs/dialogs are open
- on desktop
- on mobile

The launcher uses the full label:

`Ask Research AI`

The unified Help menu still includes Ask Research AI as one support route, but the chatbot is also directly accessible without opening Help first.

## What did not change

The v2.13 research route, current-work panel, Research Snapshot, focused Stage subsections, dependency review system, Methods/Writing synchronization, data-schema logic, and research-method engines are unchanged.

## Rendered browser QA

Result:

**10 / 10 PASS**

The QA verifies welcome visibility, Stage visibility, Help integration, Lab-overlay visibility, mobile visibility, the full label, and absence of unexpected page errors.

## Baseline

`RMS-INSTRUCTIONAL-BASELINE-v2.13.1`

Baseline digest:

`8c9ae051927b378f8583cce8c8beecd7085d8e37c8bd82541757caf1a91c5cee`

Pilot freeze digest:

`5f395e07b6aae6b4692332ab09ebff561d86868fe6ea7dd368024a3ed9e63e16`

## Pilot implication

AI visibility can affect support discovery and scaffold timing.

Do not pool v2.13 and v2.13.1 support-use evidence as identical interface conditions if a pilot wave has already begun.

No real novice pilot had begun in the current workflow, so v2.13.1 should replace v2.13 as the next pilot candidate.
