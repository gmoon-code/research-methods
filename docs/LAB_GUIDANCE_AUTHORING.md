# Specialised laboratory guidance authoring

The Admin Workspace Content Studio now includes a **review-only** visual editor for the instructional heading and explanation of each panel in the four student laboratories.

The protected modules are the Literature Lab, Methods Lab, Data and Statistics Lab, and Writing Lab. Their instructional content is sourced from the bundled `assets/student-guidance.js`, specifically `labs.<laboratory>.<panel>.title` and `labs.<laboratory>.<panel>.text`. There are 32 panels in the current source.

## What the editor does

Within the authenticated Content Studio, select a laboratory and instruction panel. Click the title or explanation to edit its wording in the inspector. Changes remain in memory and are shown in the preview. You can review all changes across laboratories and export a small JSON review packet. You can reopen a saved packet against **the same source version**, using its SHA-256 digest.

The editor rejects empty, overlong, marked-up, or control-character text. Imported packets are also checked for matching original strings, duplicated paths, approved field types, and version identity. The content is rendered using text nodes, never as active HTML.

The research terms, glossary definitions, decision keys, choice rules, panel identities, student submissions, laboratory controls and calculations, source modules, authentication settings, and publishing permissions are read-only. The `window.RMSStudentGuidance` object is not modified by the authoring module.

## Publication boundary

This new review format is `rms-lab-guidance-review-v1`. It is independent of the stage-guidance release in the v3 publication service and the activity wording review format. Export only downloads a local JSON file. No live publication, file mutation, network write, or GitHub merge happens from the lab editor. Changes require scientific and editorial review, a separate controlled patch to `assets/student-guidance.js`, and student workflow regression checks before release.

Proposals are ephemeral in the browser. Export before leaving the page.

## Verification

`tests/admin-visual-guidance-smoke.mjs` visits all four laboratory categories, exercises editing, switching and reset, rejects unsafe markup, exports and imports a valid review packet, rejects mismatched source versions and attempts to edit protected decision keys, and checks that the student guidance module remains unchanged. The test uses a locally simulated teacher login only. Live administrator authentication and a human visual acceptance review are separate deployment requirements.
