# Final GitHub Release — v2.13.3 Word Document Export

## Release status

Software QA: **PASS**

Pilot readiness: **NOT YET GO**

## Student document downloads

Student-readable text exports now download as Microsoft Word-compatible `.doc` files instead of Markdown `.md` files.

Converted exports include:

- research notebook
- current Research Snapshot
- literature-review outline
- method-planning record
- method evidence outline
- Results evidence outline
- Results analysis notes
- research-paper draft
- research-competency learning-evidence report

JSON exports remain JSON for project backup, recovery, transfer, and machine-readable records.

## Word export verification

Rendered browser QA:

**7 / 7 PASS**

The browser test confirmed that the downloaded research notebook:

- is named `research-notebook.doc`
- uses Word-compatible Microsoft Office markup
- contains accumulated student work
- is not Markdown text

The Research Snapshot also downloads as `.doc`.

## Regression testing

**38 / 38 PASS**

## Static serving

**14 / 14 PASS**

## Instructional baseline

`RMS-INSTRUCTIONAL-BASELINE-v2.13.3`

Baseline digest:

`4bea4533fe9e2c586abe5f57bdc4596cfe6e01262e2086e760c376f7f7f38b10`

Frozen student-facing files:

`90`

Freeze digest:

`5dd98a8b5a4d99f493ed1b65cb60e2fe58a51ac6275894aadcb3ca4e11e9bf19`

## Unchanged systems

The guided research route, current-work view, Research Snapshot, Help, Research Chat, pathway logic, scaffold logging, research-method engines, statistical engines, and teacher/pilot systems remain in place.

## Important use distinction

Use `.doc` downloads for reading, editing, teacher review, printing, or submission.

Use JSON backup files when the goal is to restore or transfer the live Research Methods Studio project.
