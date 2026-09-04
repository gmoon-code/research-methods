# Release Audit — v2.0.1 RC1 Pilot Dry Run & Defect Hardening

## Scope

RC1 is a non-measurement hardening release. No file listed in the frozen v2.0 measurement manifest was modified.

## Fixed blocker defects

- New Project now clears primary, recovery, and metadata state so an old snapshot cannot resurrect the prior project.
- Privacy-minimized copies are explicitly non-restorable.
- AI access obeys the project-level frozen pilot policy after pilot start.
- The public Transfer Lab obeys the frozen transfer policy and is unavailable when disabled or when a separate private evaluation bank is designated.

## Fixed major/moderate defects

- direct mobile stage picker for all 18 stages
- storage-unavailable resilience in pilot readiness/onboarding paths
- restored projects reload immediately after successful persistence
- Teacher Dashboard review packets upsert by project ID instead of double-counting duplicates
- backup filenames include project name/mode/timestamp
- save status initializes from actual persistence metadata

## Frozen baseline

The measurement baseline remains `RMS-PILOT-BASELINE-v2.0` with baseline SHA-256:

`a94fcca22cfca34bd10dad2dccd34daafb439352549332d6e20a10839cb53b50`

The build verifies every manifest-listed file against its frozen hash.

## Remaining pre-pilot requirement

Rendered browser/device testing remains pending because Chromium execution was not reliable in the build container. Complete `pilot/REAL_DEVICE_BROWSER_MATRIX_v2.0-RC1.csv` before student deployment.
