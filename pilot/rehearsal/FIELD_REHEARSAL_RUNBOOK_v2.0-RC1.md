# RC1 Field Rehearsal Runbook

## Purpose

This is the final manual pre-pilot check for Research Methods Studio v2.0.1 RC1.

The software's measurement-sensitive baseline remains `RMS-PILOT-BASELINE-v2.0`. This rehearsal must not change competency rules, transfer items, statistics, Methods diagnostics, Writing diagnostics, deterministic coaching rules, curriculum, or stage prompts.

## Release rule

Do **not** promote RC1 to the classroom pilot baseline until:

1. every required row in `FIELD_REHEARSAL_MATRIX_v2.0-RC1.csv` is marked `PASS`
2. no open `Blocker` or `Major` defect remains
3. backup → restore succeeds on a non-sensitive sample project
4. student review packet → Teacher Dashboard → teacher feedback packet → student import succeeds
5. the frozen-baseline verification still passes

If a measurement-sensitive file must be changed, stop this release process and create a new documented baseline version.

---

# A. Deployment rehearsal

1. Deploy the RC1 folder contents to a **public GitHub repository** using GitHub Pages, or use an equivalent ordinary HTTPS static host.
2. Use **Deploy from a branch**, `main`, `/ (root)`.
3. Open the live HTTPS URL in a private/incognito window.
4. Confirm the page title and top navigation load without a repository-directory listing.
5. Refresh twice.
6. Close the tab, reopen the URL, and confirm the site still loads.
7. Record the deployed URL and Git commit SHA in `PILOT_BASELINE_SIGNOFF_v2.0-RC1.md`.

Expected result  
The same static application loads after refresh/reopen. No API key or student data appears in the repository source.

---

# B. Desktop student-path rehearsal

Use the 1366×768 desktop row first.

1. Open the site with no existing local project.
2. Complete onboarding.
3. Create project name `RC1 Seed Rehearsal`.
4. Enter a non-sensitive context such as `Practice project for pilot QA`.
5. Confirm save status changes from `Not saved yet` to a saved timestamp after a project edit.
6. Open **My Journey**.
7. Open Stage 1 from the Journey.
8. Type sample work.
9. Click **Save independent checkpoint** before any coach support.
10. Run the local Research Coach.
11. Confirm the independent checkpoint remains separately recorded from the supported review.
12. Navigate directly to Stages 4, 9, 12, 14, and 18.
13. Open and close each major laboratory:
    - Literature Workspace
    - Methods Lab
    - Data & Statistics Lab
    - Writing Lab
    - Learning Analytics
    - Pilot & Recovery
14. Confirm Escape closes the top modal.

Expected result  
No stage or tool becomes unreachable. The application never presents a heuristic score as a validated grade.

---

# C. Methods and data rehearsal

Use only the supplied nonhuman sample project/data.

Suggested research question  
`How is salt concentration associated with germination and seedling growth under these practice conditions?`

For rehearsal purposes, do not claim the supplied file represents a valid completed experiment. It is interface test data.

1. In Methods Lab, verify that the experimental/analytic unit and row unit can be entered separately.
2. Add a data dictionary with at least:
   - `plant_id`
   - `condition`
   - `replicate`
   - `initial_height_cm`
   - `final_height_cm`
   - `germinated`
3. Open Data & Statistics Lab.
4. Import `REHEARSAL_SAMPLE_DATA.csv`.
5. Confirm 18 rows are reported.
6. Inspect data quality.
7. Open numerical exploration for `final_height_cm`.
8. Open categorical exploration for `germinated`.
9. Do not treat plant rows as automatically independent treatment replicates if the Methods plan defines dish as the assigned unit.
10. Store one practice descriptive analysis record.
11. Return to Writing Lab and confirm the Results evidence map can see a stored analysis record.

Expected result  
The raw imported copy is not silently rewritten, repeated/nested-unit warnings remain visible when relevant, and Results evidence can trace to the stored analysis.

---

# D. Full backup and restore rehearsal

1. Open **Pilot & Recovery**.
2. Export a **full recovery backup**.
3. Verify the filename contains project name, `full-backup`, and timestamp.
4. Make one obvious temporary project change.
5. Restore the full backup.
6. Confirm the application reloads.
7. Confirm the pre-change project state is restored.
8. Export a **privacy-minimized copy**.
9. Attempt to use that privacy copy as a recovery backup.

Expected result  
Full backup restores. Privacy-minimized copy is explicitly rejected for restore.

10. Click **New Project**.
11. Refresh/reopen the site.

Expected result  
The old rolling recovery snapshot does not resurrect the deleted project.

---

# E. Frozen pilot-policy rehearsal

Create a disposable sample project.

## AI disabled path

1. In Pilot & Recovery set AI policy to disabled.
2. Complete the other critical readiness settings.
3. Start/freeze the pilot baseline.
4. Try to access AI settings/AI coaching.

Expected result  
AI is unavailable under the frozen policy.

## Transfer private-bank path

1. Use another disposable sample project.
2. Set Transfer policy to `separate private evaluation bank`.
3. Start/freeze the pilot baseline.
4. Try to open the public Transfer Lab.

Expected result  
The public bank is unavailable and the interface explains why.

## Transfer classroom-practice path

1. Use another disposable project.
2. Set Transfer policy to classroom practice.
3. Start/freeze the pilot baseline.
4. Open Transfer Lab.

Expected result  
The public candidate bank is available and remains labeled public/unvalidated.

---

# F. Teacher packet round trip

Student side

1. In My Journey enter an alias such as `Pilot-A01`.
2. Make enough sample entries to generate a meaningful review packet.
3. Export the teacher review packet.

Teacher side

4. Open Teacher Dashboard.
5. Import the packet.
6. Import the same project packet again.

Expected result  
The project appears once. The newer import replaces the earlier packet.

7. Open Review.
8. Approve or request revision at one available checkpoint.
9. Add comment `RC1 packet round trip`.
10. Export teacher feedback.

Student side

11. Import the feedback packet in My Journey.

Expected result  
Checkpoint status/comment updates and feedback history contains the imported comment.

---

# G. Mobile and tablet rehearsal

For each required small-screen row:

1. Open the live URL.
2. Complete onboarding.
3. Confirm the top research-tool row remains reachable and horizontally scrollable where necessary.
4. Use **Go to research stage**.
5. Confirm all 18 stages appear.
6. Jump to Stages 1, 9, 14, and 18.
7. Open Literature, Methods, Data, Writing, Journey, and Pilot modals.
8. Scroll to the bottom of each.
9. Close each without browser zooming or getting trapped.
10. Export one backup file if the device/browser permits downloads.

Expected result  
No core research stage or tool disappears at narrow widths.

---

# H. Keyboard-only rehearsal

Do not use a mouse for this row.

1. Reload the site.
2. Press Tab from the top.
3. Use the skip link to reach main content.
4. Tab through project controls and stage navigation.
5. Activate My Journey with Enter/Space.
6. Continue tabbing through the dialog controls.
7. Press Escape.

Expected result  
Keyboard focus is visible, controls are operable, and Escape closes the top dialog.

Repeat with one large laboratory modal.

---

# I. Screen-reader smoke test

Use NVDA on Windows or VoiceOver on Apple hardware.

Check only a focused smoke test, not a claim of WCAG conformance.

1. Confirm the page title is announced.
2. Confirm major navigation/landmarks are intelligible.
3. Confirm the save-status live region announces a save change.
4. Open My Journey and confirm a dialog title is announced.
5. Navigate form labels in one stage.
6. Open one laboratory and confirm the dialog can be exited.

Expected result  
No unlabeled critical control blocks completion of the student pathway.

---

# J. Final sign-off

1. Fill every required result in `FIELD_REHEARSAL_MATRIX_v2.0-RC1.csv`.
2. Record any problem in `FIELD_DEFECT_LOG_v2.0-RC1.csv`.
3. Run:

```bash
python pilot/rehearsal/verify_release_gate.py
```

4. The script must return `RELEASE GATE: PASS`.
5. Complete `PILOT_BASELINE_SIGNOFF_v2.0-RC1.md`.

If it returns HOLD, do not freeze the classroom release.
