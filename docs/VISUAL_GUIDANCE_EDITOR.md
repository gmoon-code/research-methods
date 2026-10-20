# Visual guidance editing in the Admin Workspace

The existing authenticated Content Studio now includes an optional visual authoring panel for the 18 research stages. It uses the same six guidance fields and validator as the source editing controls.

## Editing workflow

1. Sign into the established Admin Workspace and open Content Studio.
2. Select one of the 18 stages.
3. Click its visible title, navigation label, purpose, teaching content, example, or warning.
4. Edit text directly. The source field updates immediately, and the same draft validator reports any unsupported markup.
5. Within teaching content, examples, and warnings, select text and use **Bold** or **Italic**. These insert `<strong>` and `<em>`, which the existing content schema permits.
6. Use the existing preview, validation, staged publication, and rollback controls. No separate publishing route has been added.

Pasted HTML is rejected. Paste inserts plain text, and formatting buttons create limited, validated tags.

The visual editor does not add, delete, or reorder stages or change field schemas. Navigation, student work, consent, saved student progress, authentication, and server-side publication rules remain outside this change.

## Tests

The new `tests/admin-visual-guidance-smoke.mjs` exercises visual edits using a **simulated session only inside the test browser**. It verifies all 18 stages, bidirectional field synchronization, safe paste, selection formatting, schema validation, and stage switching.

The original Admin Workspace's authentication and publication system must still be verified with a real authorized account before deployment. This feature is on a draft pull request and is not merged into the public site.
