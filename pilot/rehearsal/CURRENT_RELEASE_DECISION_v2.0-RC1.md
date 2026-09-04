# RC1 Field Rehearsal Status

## Current release decision

**HOLD — required real-device/browser rehearsal remains incomplete.**

All automated RC1 regression, static QA, recovery simulations, and frozen-baseline checks have already passed in the preceding dry run.

The remaining release evidence cannot be truthfully produced inside this execution container:

- rendered Chrome/Edge desktop behavior
- rendered iPhone-class browser behavior
- rendered Android-class browser behavior
- rendered tablet behavior
- actual keyboard interaction in a graphical browser
- NVDA/VoiceOver announcement behavior
- real browser download/restore handling

The container's installed Chromium again failed to complete headless navigation because of its DBus/container environment. This remains environment limitation `E-001`, not a product failure.

Run `FIELD_REHEARSAL_RUNBOOK_v2.0-RC1.md`, record results in the matrix, then execute:

```bash
python pilot/rehearsal/verify_release_gate.py
```

Only a `RELEASE GATE: PASS` result supports promotion to the classroom pilot baseline.
