# Protected activity wording editor

The authenticated Admin Workspace includes a **proposal-only** editor for the 18 Research Methods Studio activity stages. This is distinct from the six-field guidance editor and from the authenticated isolated v3 guidance publication service.

## Authoring

Open Admin Workspace, select Content Studio, and scroll to **Edit research activity wording**. Choose a stage and click a heading, instruction, student field label, or completion-check sentence. Revise the wording in the inspector. The preview updates immediately and shows field types without collecting any student answers. Drafts remain in memory during the current browser session. Resetting one stage does not discard changes proposed for other stages.

The first authoring release covers existing `sections[].title`, `sections[].desc`, `sections[].fields[][1]`, and `checks[]` strings from `assets/curriculum.js`. This includes ordinary input forms and the completion checks on stages with separately implemented interactive activities. It does not expose text inside other specialised application components, AI prompts, or student guidance modules.

The editor treats section order, stage identities, field storage keys, input types, choice options, checks length, special activity configuration, and all other curriculum data as read-only. Text may not be empty, contain markup, or exceed field-specific length bounds. No student state is read or written.

## Review and export

Select **Review wording changes** to inspect each old and proposed value. **Export review JSON** downloads a packet with the original and proposed text, precise stage and path, and a SHA-256 digest of the complete original bundled curriculum. It contains no credentials or student records. The digest binds the proposal to a specific source version.

The export is **not** a curriculum release, content publication, hotpatch, or authenticated update. It is not consumed by the existing student application or v3 guidance service. A subsequent implementation would need explicit, reviewed change application, full student progress-compatibility verification, editorial review, and the existing release checks. A change to a student's visible field label or a completion criterion may affect their understanding of the task and requires pedagogical review even when its technical data key stays fixed.

Keep the proposed JSON separately before closing the browser, since drafts are intentionally ephemeral.

## Validation

`tests/admin-visual-guidance-smoke.mjs` runs in Chromium under a **simulated browser-only teacher session**. It tests stage navigation, edits across multiple stages, selection, unsafe markup rejection, export structure and digest, immutable curriculum data, the special-activity stage, and resetting one stage independently. The simulated session does not authenticate a real user or test live publication.

The Admin Workspace retains its original authentication boundary and publishing code. No new network endpoint, storage provider, or publishing permission is introduced by the activity editor.
