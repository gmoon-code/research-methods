# RC1 Defect Triage and Release Gate

## Severity

**Blocker**  
Prevents completion of a core student/teacher pathway, risks data loss/privacy breach, bypasses frozen pilot policy, exposes private validation material, or materially invalidates captured research evidence.

**Major**  
A core pathway remains possible only through an unreasonable workaround, a required device class cannot use a core function, or accessibility prevents a required student from completing the workflow.

**Moderate**  
Meaningful usability or reporting problem with a reliable workaround and no expected distortion of the research evidence.

**Minor**  
Cosmetic, wording, or low-impact inconvenience.

## Release decision

The classroom pilot baseline may be frozen only when:

- all rows marked `Required` in the field rehearsal matrix are `PASS`
- no open Blocker or Major defect remains
- any Moderate/Minor defects accepted for pilot are documented
- baseline-sensitive files still match the frozen manifest

## Measurement-sensitive change rule

If fixing a defect requires changing a frozen measurement-sensitive file, do not silently patch RC1.

Create a new baseline identifier, regenerate the manifest, document the change, and restart any affected pilot-measurement interpretation from the new baseline.

## Accepted result values

`PASS`  
Criterion observed as expected.

`FAIL`  
Criterion did not work as expected.

`BLOCKED`  
Test could not be executed because of an external/device condition. A required row cannot release as BLOCKED.

`N/A`  
Allowed only for rows explicitly marked optional. No required row may release as N/A.

`PENDING`  
Not yet tested.
