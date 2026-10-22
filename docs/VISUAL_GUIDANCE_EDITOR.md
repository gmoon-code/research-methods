# Visual guidance editing in the Admin Workspace

The existing authenticated Content Studio now includes an optional visual authoring panel for the 18 research stages. It uses the same six guidance fields and validator as the source editing controls.

## Editing workflow

1. Sign into the established Admin Workspace and open Content Studio.
2. Select one of the 18 stages.
3. Click its visible title, navigation label, purpose, teaching content, example, or warning.
4. Edit text directly. The source field updates immediately, and the same draft validator reports any unsupported markup.
5. Within teaching content, examples, and warnings, select text and use **Bold** or **Italic**. These insert `<strong>` and `<em>`, which the existing content schema permits.
6. Click an existing top-level teaching, example, or warning block to select it. Use **+ Text** beside the selected block to open a compact on-page composer. Choose a paragraph, heading or bullet list, type the new content and select **Add block**. The composer also supports Ctrl/⌘+Enter to insert and Escape or Cancel to dismiss without changing the draft. If a list is selected, you can add another list item from the same composer. The detailed block controls remain available below the preview, including **Add section heading**, **Add paragraph**, **Add bullet list**, and **Add list item**. You can duplicate a selected block, move it up or down, or remove it. A visible ⠿ drag grip beside the selected block provides pointer-based rearrangement within the same teaching, example, or warning field. Keyboard users retain the Move up and Move down buttons.
7. Use the existing preview, validation, staged publication, and rollback controls. No separate publishing route has been added.

Block insertion, movement, and removal are limited to the three existing rich-content fields and are checked against the original six-field validator before they update the draft. Moving a block does not change the stage sequence or page navigation. The editor does not permit removing the final content block in a field. The selection outline and temporary drag-target indicators are editor-only and are stripped before source synchronization. Dragging across fields or stages is unavailable; every proposed move is checked by the existing production schema validator before the Content Studio draft updates. A keyboard user can focus the rich-content region and use the arrow keys to choose a block before activating the controls.

Pasted HTML is rejected. Paste inserts plain text, and formatting buttons create limited, validated tags.

The visual editor does not add, delete, or reorder stages or change field schemas. Navigation, student work, consent, saved student progress, authentication, and server-side publication rules remain outside this change.

## Tests

The new `tests/admin-visual-guidance-smoke.mjs` exercises visual edits using a **simulated session only inside the test browser**. It verifies all 18 stages, bidirectional field synchronization, safe paste, selection formatting, heading insertion, duplication, pointer-based block movement, schema validation, and stage switching.

The original Admin Workspace's authentication and publication system must still be verified with a real authorized account before deployment. This feature is on a draft pull request and is not merged into the public site.

## Contextual block creation

The selected-block toolbar provides a small native, keyboard-accessible **Add guidance block here** dialog outside the editable guidance fields. Its Paragraph, Section heading, Bullet list and conditional List item actions reuse the same source field and six-field production schema validator as the full Content Studio block controls. Empty input and invalid combined markup are refused. The dialog follows the selected block in the viewport, can be closed without changing content, and disappears when the teacher selects a different block or stage. No separate HTML serialization, schema, authentication or publication route has been added. The editor-only form is never copied to the published guidance HTML. The browser smoke test covers inline paragraph and heading creation, keyboard submission, cancel, empty text, stage isolation and the original block controls.
