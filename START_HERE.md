# START HERE — Research Methods Studio v2.0.1 RC1

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
