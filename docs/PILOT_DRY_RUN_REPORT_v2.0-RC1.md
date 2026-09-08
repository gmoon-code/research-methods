# Pilot Dry-Run Report — v2.0.1 RC1

## Purpose

This dry run tested the v2.0 classroom-pilot baseline as an operational system rather than adding new research-methods features. Measurement-sensitive files remained frozen.

## Test strategy

The dry run used four layers.

1. Existing unit/regression tests for literature, methods, statistics, writing, journey, competency, transfer, coach, AI adapter, and pilot recovery.
2. Synthetic end-to-end projects exercising milestone progression and design boundaries.
3. Recovery/privacy/policy simulations using mocked browser storage.
4. Static responsive/accessibility inspection of the generated HTML/CSS/JS shell.

A real headless Chromium run was attempted in the build container. The environment blocked Playwright navigation and direct Chromium stalled on container/DBus restrictions. This is recorded as environment limitation E-001 rather than reported as passed browser validation.

## Simulated student pathways

### S1 — Nonhuman experimental biology

Question: effect of salt concentration on seed germination.

The simulation checks manipulated-variable/outcome roles, dish-level experimental units, independent replication, random assignment, measurement definition, data dictionary, locked protocol readiness, analysis storage, writing traceability, and teacher milestone packet generation.

### S2 — Observational student sleep and grades

The simulation checks predictor/outcome terminology, noncausal claim ceiling, confounding language, correlation analysis, Results/Discussion separation, and final-paper causal-language audit.

### S3 — Unsafe human intervention

A student-run sleep-deprivation intervention must continue to return `do_not_facilitate`. RC1 does not change the Methods safety engine.

### S4 — Literature/qualitative reasoning path

The simulation checks source screening, synthesis/theme evidence, bounded rationale language, qualitative sampling/coding requirements, and paper-section traceability without forcing IV/DV or inferential statistics.

## Operational defects discovered

Ten product defects were logged. Four were blockers for a controlled pilot.

- old recovery snapshots could reappear after New Project
- privacy-minimized files could be used as destructive recovery backups
- frozen AI policy was advisory rather than enforced
- public transfer-task policy was advisory rather than enforced

All four are fixed in RC1 without changing the frozen measurement architecture.

Major fixes also cover direct mobile stage navigation, storage-unavailable error paths, immediate restore refresh, and duplicate Teacher Dashboard imports.

See `pilot/DRY_RUN_DEFECT_LOG_v2.0-RC1.csv` for reproduction and disposition.

## Browser/device status

Static responsive checks confirm that the 18-stage picker and research-tool bar remain available in the <=820 px CSS path. The container could not provide a trustworthy rendered Chromium pass. Before an actual student pilot, manually verify at minimum:

- Chrome desktop at 1366×768 or similar
- Chrome/Edge desktop at 1920×1080
- iPhone-class 390 px viewport
- Android-class 412 px viewport
- tablet portrait around 768 px
- keyboard-only navigation through onboarding, stages, and each modal
- one screen-reader smoke test for dialog titles, form labels, save status, and stage navigation

## Measurement-freeze verification

Every file listed in `pilot/FROZEN_BASELINE_MANIFEST_v2.0.json` is checked against its v2.0 hash during RC1 testing. RC1 changes only non-frozen deployment/UI files.

The baseline identifier remains `RMS-PILOT-BASELINE-v2.0`.

## Release decision

RC1 is suitable for a **teacher-operated dry pilot / usability rehearsal** after the real-device browser matrix above is completed. It is not yet evidence that the competency model is validated or that public transfer tasks function as a held-out assessment.
