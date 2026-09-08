# START HERE — Research Methods Studio v2.10 Pilot Operations

## Free GitHub Pages deployment

1. Create a **public** GitHub repository, for example `research-methods-studio`.
2. Upload the contents of this folder to the repository root.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`.
6. Save.

Your site will appear at a URL similar to:

`https://YOUR-USERNAME.github.io/research-methods-studio/`

## Preview before publishing

Open `index.html` locally for a basic preview. Browsers may restrict some local-file behavior, so GitHub Pages is the recommended preview.

## Student data

The current static version stores the research notebook in the browser's `localStorage`. It does not send notebook content to a server.

Students should use **Backup JSON** or **Export notebook** regularly. Browser storage can be cleared.

## Important limitation

This version contains structured guidance and rule-based feedback. It does not yet use an AI backend to evaluate the scientific quality of arbitrary student prose or retrieve literature automatically. Those capabilities should be added only with safeguards against fabricated sources, invalid methods, and over-automation of student reasoning.


## Research Coach

Each stage now has **Review my work**. The score is a local diagnostic readiness indicator, not a grade. Review messages identify the next reasoning move without rewriting the student's work.


## Optional AI Coach

The website works without AI.

To enable deeper AI review, deploy a secure server endpoint implementing `server/BACKEND_CONTRACT_v1.2.json`, then use **AI Coach settings** in the website and enter the endpoint URL.

Never place a model-provider API key directly in the GitHub repository or browser JavaScript.


## Literature Workspace

Use **Literature Workspace** in the top navigation. Students can log searches, screen sources, complete TRAPP evaluation, build the study matrix, map themes and disagreements, audit gap claims, trace claims to source IDs, and export a literature-review outline.


## Methods Lab

Use **Methods Lab** in the top navigation after the research question and preliminary literature work. Complete all nine tabs before final data collection. The final tab produces a pre-collection audit and can lock a protocol version.


## Data & Statistics Lab

Use **Data & Statistics Lab** after the Methods protocol and data dictionary are ready. Import a CSV locally, inspect data quality, define the estimand, map variables to the design, run the analysis, and preserve a Results-ready analysis record.


## Writing Lab

Use **Writing Lab** after the literature, method, and analysis records are substantially complete. The lab constructs evidence maps for each paper section, audits section boundaries and citations, and performs a final whole-paper consistency check.

## Student Journey

Use **My Journey** to see the next best action, milestone blockers, teacher checkpoints, and feedback history.

## Teacher Dashboard

Students export a **teacher review packet** from My Journey. Teachers can import multiple packets into **Teacher Dashboard**, review checkpoint status, and export structured teacher-feedback JSON files for students to import.

This file-based workflow keeps v1.7 fully compatible with free static GitHub Pages.

## Learning Analytics

Use **Learning Analytics** to inspect independent evidence, supported/current performance, support exposure, revision cycles, and teacher-coded ratings.

For the cleanest independent evidence, students should click **Save independent checkpoint** before using the Research Coach, AI Coach, Interest Compass, Design Matcher, Statistics Wizard, or other recorded scaffolds in that stage.

These indicators are provisional instructional analytics. They are not validated grades or psychometric scores.


## Transfer Lab

Use **Transfer Lab** for novel-context research reasoning tasks.

The first response is locked before optional support. The software does not auto-score free-response transfer competence. Export the blinded response packet for human rating.

The included task bank is public and unvalidated. For formal validation research, follow `validation/VALIDATION_PROTOCOL_v1.9.md` and keep locked evaluation items outside the public GitHub repository.


## Before a classroom pilot

Open **Pilot & Recovery** and complete the classroom pilot readiness checklist. Test full backup and restore on a non-sensitive sample project before students begin.

For pilot documentation, start with `pilot/TEACHER_PILOT_GUIDE_v2.0.md`. The measurement baseline is recorded in `pilot/FROZEN_BASELINE_MANIFEST_v2.0.json`.

The v2.0 release is intended as a feasibility/usability baseline. Provisional competency indicators and public transfer tasks remain unvalidated.


## RC1 dry-run fixes

- New Project clears the rolling recovery snapshot so an old project cannot reappear.
- Privacy-minimized sharing copies cannot be restored as full recovery backups.
- AI and the public Transfer Lab obey the frozen classroom pilot policy after pilot start.
- Mobile users have a direct stage picker.
- Teacher Dashboard imports replace newer packets for the same project instead of double-counting them.
- Local-storage failure paths no longer crash the readiness/onboarding layer.

The frozen measurement baseline remains `RMS-PILOT-BASELINE-v2.0`.


## High-scaffolding student guidance

Every stage now starts with a detailed Student Guide. Every notebook field has expandable help. The top navigation includes a searchable **Research Terms** glossary.

Students are not expected to already know research vocabulary such as binary, paired, estimand, experimental unit, or confounder.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.1` for a future pilot of this version.


## v2.2 novice guidance

Every stage now includes a worked reasoning walkthrough. Every notebook field has field-specific help, and major decisions include an option-by-option “How do I choose?” explanation. Use `RMS-INSTRUCTIONAL-BASELINE-v2.2` for any future pilot of this build.


## Guided Research Pathways

After the research question is refined, open **Research Path** and confirm the route that matches the evidence structure. Later stages will show the decisions normally needed for that route first.

Fields that are usually irrelevant to a path are hidden, not deleted. Use **Show fields usually not needed for this path** whenever a project genuinely needs a cross-design decision.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.3` for future pilot work using this interface.


## Pathway-specific coaching

Once a research path is confirmed, **Run local review** and **Mark stage ready** use that path's actual methodological requirements. Qualitative work is not penalized for missing p-values or IV/DV, literature reviews are checked for synthesis/review logic, observational studies are checked for confounding and causal limits, and experiments retain unit/replication/condition requirements.

Changing the path invalidates downstream Stage 9–18 readiness and requires a new protocol review if a protocol was already locked.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.4` for future pilot work using this coaching/readiness condition.


## Progressive Help

Students can use **I’m stuck** at any stage or **Progressive help** beside a notebook field.

Support increases from L1 through L5. The current attempt is preserved before optional rescue, and each level used is recorded in scaffold-load evidence.

L5 never invents the project answer. It gives a structure, requires student-authored content, and requires the student to explain why the answer fits before it can be applied.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.5` for a future pilot of this instructional condition.


## Novice-friction hardening

The local review now recognizes several common first-time-researcher mistakes that can look nonblank while still showing unresolved reasoning. Examples include `idk`, unfinished scaffold tokens, random/convenience sampling confusion, loss of pairing, binary-data misconceptions, and incorrect p-value interpretations.

When a blocker is detected, use **Progressive help** for the named field. The diagnostic does not silently replace the student's answer.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.6` for a future pilot using this readiness condition.


## End-to-End Exemplar Project

Use **Exemplar Project** to inspect one complete synthetic research project from Stage 1 through Stage 18.

A worked stage is strong instructional support. The site warns students before the first view and records it as **Level 4 worked-example support**. Save an independent checkpoint first when independent evidence is desired.

The exemplar is experimental. Students on other research paths receive an explicit warning to study the reasoning chain without copying experimental terminology or statistical choices into a mismatched design.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.7` for future pilot work using this exemplar condition.


## Multi-Path Exemplar Library

Open **Exemplar Project** to see all eight research-path exemplars. The stage-level **Worked Stage** button automatically opens the exemplar that matches the student's current path.

Viewing worked content remains Level 4 support. Save an independent checkpoint first if independent evidence is desired.

Experimental methodology is no longer the default exemplar. Descriptive, observational, quasi-experimental, qualitative, literature-review, meta-analysis, and mixed-methods projects each have their own complete reasoning chain.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.8` for a future pilot using this exemplar condition.


## Browser usability and accessibility hardening

v2.9 completed a live Chromium pass across desktop, tablet, 320–430 px mobile layouts, 200% text enlargement, keyboard modal navigation, and all eight research paths at Stage 10.

The final automated browser pass completed **60/60 checks successfully after fixes**.

Dynamic dialogs now receive a consistent keyboard/focus contract, instructional microprint has been enlarged, mobile targets are larger, the desktop tool bar no longer widens the page, and path-specific Stage 10 views were browser-tested.

This is browser/software QA. It is not a WCAG certification or a usability study with real students.

Use `RMS-INSTRUCTIONAL-BASELINE-v2.9` for future pilot work using this browser-facing condition.


## Pilot freeze

v2.10 does **not** change the student-facing Research Methods Studio application. Participants remain on `RMS-INSTRUCTIONAL-BASELINE-v2.9`.

Before a pilot session run `python pilot/v2.10/scripts/verify_pilot_freeze.py`, complete `pilot/v2.10/forms/PRE_FLIGHT_CHECKLIST.csv`, and review the runbook, observer protocol, selected scenario card, and teacher round-trip rehearsal.

Do not mark a pilot wave ready until the go/no-go criteria are satisfied.
