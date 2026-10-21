# Student Guide and field-help authoring

The authenticated Content Studio now includes a visual, review-only editor for **18 stage guides** and **113 individual field-help records** drawn from `assets/student-guidance.js`.

This authoring mode complements the existing guidance editor, curriculum activity wording editor, and four laboratory guidance editor. The four review formats are separate and have independent source-version fingerprints.

## Editing

Open the Admin Workspace, enter Content Studio, and select **Edit the Student Guide and field help**. Choose **Stage explanations** or **Individual field help**. Stage guides include the overview title and description, steps, good-response description, named examples, suggestions for getting unstuck, and the worked-through reasoning sequence. For field help, you can edit what a field means, what students should write, its mini example, reflection questions, and common mistakes.

Click a visible text item and edit it in the inspector. A proposed change updates only the editor preview. All modified fields are kept in memory across selection changes until the page is reloaded. You can reset an individual item or all edits associated with a selected stage or field-help record.

The field selector includes a search for the underlying stable ID or the student-facing label. Every text item appears in its original instructional group. The source structures are fixed.

## Protection

The editor refuses empty or markup-containing strings and checks field-length limits. Each edit is represented by an exact allowlisted path, its original text, and the proposed replacement.

The protected content includes the 90-term glossary, stage-term relationships, student field keys, choice options, number and order of list items, stage identifiers, response examples from other modules, laboratory decision keys, and students' saved projects.

All previews are rendered with DOM text nodes, with no use of HTML injection. `window.RMSStudentGuidance` is never altered by editing.

## Export and import

**Export Guide review JSON** creates a `rms-student-guide-review-v1` packet, marked `review_required=true` and `live_publication=false`. It contains a SHA-256 fingerprint of the original complete Student Guide source plus each changed allowlisted text path.

**Reopen Guide review** compares the entire-source fingerprint, ensures the original text has not changed, rejects unknown or duplicate paths, and requires valid replacement text. Imported data remain proposals and cannot publish to the v3 service.

This is not a live content management or publishing path. A reviewed change must be applied separately to `assets/student-guidance.js`, pass full curriculum compatibility checks, and receive human editorial approval before deployment. No source file, backend, or student project is updated by these controls.

## Testing

`tests/admin-visual-guidance-smoke.mjs` uses a simulated browser-only teacher session to check edits to stage narratives and individual field guidance, array-item selection, source immutability, invalid-markup rejection, review export, version-locked import, rejection of protected glossary/term paths, and record-specific reset. The shared GitHub Actions job also tests existing guidance models, publication contracts, static Admin Workspace safeguards, and JavaScript syntax.

A real administrator login, live authorisation checks, and human visual acceptance testing remain separate release gates.
