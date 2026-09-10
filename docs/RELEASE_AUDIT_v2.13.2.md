# Release Audit — v2.13.2 Research Chat Naming Patch

## Purpose

The persistent conversational helper is now named **Research Chat** throughout the student-facing interface.

The helper remains available before Stage 1, throughout all 18 stages, inside major Lab workflows, and on mobile.

## Naming change

Student-facing labels now use:

`Research Chat`

The interface no longer presents the helper itself as “AI” or “Research AI.”

The underlying model/backend implementation is unchanged.

## Rendered QA

Result:

**9 / 9 PASS**

The rendered checks verify:

- Research Chat on the welcome screen
- Research Chat panel branding
- no “Research AI” branding in the opened chat panel
- Research Chat in structured Help
- persistence over a Methods Lab
- full Research Chat label on mobile
- no tested mobile horizontal overflow
- no unexpected JavaScript page errors

## Baseline

`RMS-INSTRUCTIONAL-BASELINE-v2.13.2`

Baseline digest:

`31259560bff2d638f0a184fabc5ed098c5173a41bd0883d673cfce79264f5587`

Pilot freeze digest:

`7014d7d852e7d2783fef635a6991e546731d12bacfefb2060e6a6c19cf2b4bec`

## Scope

This patch changes naming and visible treatment only.

The v2.13 guided route, current-work visibility, Snapshot, dependency review, Help system, Stage/Lab synchronization, authorship guard, scaffold logging, and secure backend behavior remain unchanged.
