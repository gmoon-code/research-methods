# Browser-based editor on GitHub Pages

## Planned entry point

After the existing draft pull request is reviewed, approved and deployed, open

**https://gmoon-code.github.io/research-methods/editor.html**

This is a normal static GitHub Pages address. There is no requirement to download a ZIP archive, install Node.js, or run a local preview launcher for day-to-day use.

The `editor.html` entry redirects to the existing `teacher.html` administrator sign-in with an allowlisted Content Studio fragment. Only after successful verification of the existing signed teacher session will the Admin Workspace display Content Studio. Anyone without valid administrator credentials remains outside the editor.

A person already signed in should move through the same session verification before seeing the editor. The GitHub Pages static files may be public, but the backend publishing authority and teacher session remain protected.

## Editorial boundaries

- **Stage guidance** can participate in the separate authenticated v3 publication flow, subject to its existing complete release validation.
- **Research activities**, **Laboratory instructions** and **Student Guide** edit visible wording and produce **review-only export proposals**. They cannot publish through the stage-guidance backend.
- The browser does not gain GitHub write access merely because the editor is hosted on GitHub Pages. Any eventual automatic GitHub publishing workflow needs separate server-side authorization and review.
- This entry point does not enable student data collection or modify student progress.
- The existing `scripts/preview-admin-locally.mjs` is still available to inspect an unmerged draft safely, but it is not part of the public editor.

## Draft preview limitations

The feature branch is a draft pull request. It is not currently served as a separate online editor by the project's existing GitHub Pages publishing setup.

GitHub Pages ordinarily publishes one configured branch/folder or a deployed build artifact for a repository. It does not automatically publish every pull request at its own URL. Until the editor changes receive release approval, use the repository's automated Chromium screenshots or local draft preview for testing.

Do not change the production GitHub Pages publishing source to a feature branch and do not add preview domains or localhost to the production Worker's CORS allowlist merely to make a draft appear live. Real-authentication staging requires a separately reviewed environment and secrets.

## Release acceptance

Before any approved release, verify the editor bookmark in a signed-out browser, successful sign-in, the return to Content Studio, keyboard navigation, review-only export, and the separate publication authorization. These checks build on `docs/ADMIN_KEYBOARD_ACCEPTANCE.md`.

The prospective editor URL should only be announced as live after the Pages deployment and an authorised login test have succeeded.
