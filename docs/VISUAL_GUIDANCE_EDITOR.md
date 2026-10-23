# Visual guidance editing in the Admin Workspace

The existing authenticated Content Studio now includes an optional visual authoring panel for the 18 research stages. It uses the same six guidance fields and validator as the source editing controls.

## Editing workflow

1. Sign into the established Admin Workspace and open Content Studio.
2. Select one of the 18 stages.
3. Click its visible title, navigation label, purpose, teaching content, example, or warning.
4. Edit text directly. The source field updates immediately, and the same draft validator reports any unsupported markup.
5. Within teaching content, examples, and warnings, select text and use **Bold** or **Italic**. These insert `<strong>` and `<em>`, which the existing content schema permits.
6. Click an existing top-level teaching, example, or warning block to select it. Use **+ Text** beside the selected block to open a compact on-page composer. Choose a paragraph, heading, bullet list, numbered list, or concept box, type the new content and select **Add block**. For either list type, enter one item per line to create the whole list at once; empty lines are skipped. Use **Insert position** to put the new block before or after the selected block. The composer also supports Ctrl/⌘+Enter to insert and Escape or Cancel to dismiss without changing the draft. If a list is selected, you can add another list item from the same composer. The detailed block controls remain available below the preview, including **Add section heading**, **Add paragraph**, **Add bullet list**, and **Add list item**. You can duplicate a selected block, move it up or down, or remove it. A visible ⠿ drag grip beside the selected block provides pointer-based rearrangement within the same teaching, example, or warning field. Keyboard users retain the Move up and Move down buttons.
7. Use the existing preview, validation, staged publication, and rollback controls. No separate publishing route has been added.

Block insertion, movement, and removal are limited to the three existing rich-content fields and are checked against the original six-field validator before they update the draft. Moving a block does not change the stage sequence or page navigation. The editor does not permit removing the final content block in a field. The selection outline and temporary drag-target indicators are editor-only and are stripped before source synchronization. Dragging across fields or stages is unavailable; every proposed move is checked by the existing production schema validator before the Content Studio draft updates. A keyboard user can focus the rich-content region and use the arrow keys to choose a block before activating the controls.

Pasted HTML is rejected. Paste inserts plain text, and formatting buttons create limited, validated tags.

The visual editor does not add, delete, or reorder stages or change field schemas. Navigation, student work, consent, saved student progress, authentication, and server-side publication rules remain outside this change.

## Tests

The new `tests/admin-visual-guidance-smoke.mjs` exercises visual edits using a **simulated session only inside the test browser**. It verifies all 18 stages, bidirectional field synchronization, safe paste, selection formatting, heading insertion, duplication, pointer-based block movement, schema validation, and stage switching.

The original Admin Workspace's authentication and publication system must still be verified with a real authorized account before deployment. This feature is on a draft pull request and is not merged into the public site.

## Contextual block creation

The selected-block toolbar provides a small native, keyboard-accessible **Add guidance block here** dialog outside the editable guidance fields. Its Paragraph, Section heading, Bullet list, Numbered list, Concept box and conditional List item actions reuse the same source field and six-field production schema validator as the full Content Studio block controls. Empty input and invalid combined markup are refused. The dialog follows the selected block in the viewport, can be closed without changing content, and disappears when the teacher selects a different block or stage. No separate HTML serialization, schema, authentication or publication route has been added. The editor-only form is never copied to the published guidance HTML. The browser smoke test covers inline paragraph and heading creation, keyboard submission, cancel, empty text, stage isolation and the original block controls.


## Adding concept boxes from the page preview

Select a block in a stage's teaching, example, or warning content area, choose **+ Text** in the contextual toolbar, and select **Concept box** in the Block type menu. Enter the concept explanation and choose **Add block**. The editor inserts a `div.concept-box` containing a paragraph immediately after the selected block. The six-field Content Studio validator checks the whole changed rich-content field before it is committed to the in-memory draft. If validation fails, the original content remains unchanged. The block can subsequently be selected, moved, duplicated, or removed using the existing controls. The generated content does not contain editor selection markers or active scripts. The authenticated browser smoke test covers insertion, the validated source HTML, and removal. Publishing still uses the existing authenticated review flow, and this draft feature is not live.

## Multi-item list authoring

The on-page **+ Text** composer creates bulleted (`ul`) or numbered (`ol`) lists. Each non-empty input line becomes a separate list item (`li`) in source order. The editor constructs text nodes so that characters such as `&` are escaped safely. Every insertion passes the unchanged six-field validator, synchronizes with the existing draft, and can be undone by removing the selected list. A browser regression covers multiple items, skipped blank lines, numbered list semantics, safe source HTML and removing the new block. This changes no public content or publishing rules.

## Placement near an existing block

The on-page composer defaults to **After selected block** and also offers **Before selected block** for paragraphs, headings, lists and concept boxes. Insertion immediately selects the newly created block, and the original block retains its markup. The in-list **Item in selected list** action continues to append to that list, so the position selector is hidden for that case. The six-field validator runs on every proposed insertion and blocks invalid changes before source synchronization. A browser regression checks the DOM and source order of a newly inserted block before its selected neighbour.

## Detailed inspector parity

The expanded block inspector uses a resizable multiline text area, allowing teachers to create an entire bulleted or numbered list with one list item per line. Its controls include **Add numbered list** and **Add concept box**, using the same schema-validated insertion functions as the on-page quick composer. This is an editing interface improvement only; no student content or publication mechanism is modified.

## Undo and redo of block operations

The guidance panel includes **Undo block** and **Redo block** controls. They reverse validated structural operations such as adding, duplicating, moving or removing a top-level guidance block, including a new list item. At most 30 recent operations are retained for the selected stage during this editing session. These buttons affect only guidance block structure, not character-by-character text edits. Editing text or the underlying Content Studio source fields clears structural history, protecting subsequent changes from being silently overwritten. Changing stages clears history as well. Before applying a recorded snapshot, the editor checks that its source still matches the expected version and that the replacement passes the unchanged six-field schema. This history remains local and does not alter publication or the public site.

## Reorder and remove individual list items

Click a specific item inside a bulleted or numbered list in the on-page guidance editor. The selected item receives a dashed editor-only outline and the contextual actions offer **Item ↑**, **Item ↓**, and **Delete item**. The detailed block inspector offers equivalent **Item up**, **Item down**, and **Remove item** controls. These operations retain the list type, stay within the selected list and pass the existing six-field validator before updating the draft. The final list item cannot be removed, preventing an empty list. Undo block and Redo block preserve and restore item order. Selection metadata is stripped from saved or exported HTML, and switching stages clears the selection.

The contextual and detailed list item controls also offer **Copy item** or **Duplicate item**. This duplicates one selected list item immediately after its original, then selects the new item. The duplicate uses the current list's formatting and stays within the same list; validation and Undo/Redo protections are unchanged.

### Pointer selection and keyboard focus

When the teacher clicks a list item, the visual editor waits for the click to choose the block before updating the contextual controls. Keyboard focus still selects content through the existing focus and arrow-key handlers. This avoids rebuilding the floating controls between pointer-down and pointer-up, which previously redirected clicks from a list item to the containing editor region. The regression test includes selecting the sole remaining list item after an Undo/Redo and removal sequence.

## Place a new item next to the selected list item

Inside a bulleted or numbered list, select the item that should serve as the insertion point. Choose the contextual **+ Text** menu, select **Item in selected list**, and use **Insert position** to place a new item immediately before or after it. If only the list container is selected, the original append-to-end behaviour remains available. The new item becomes selected for immediate editing, and the list type, existing item order, schema validation and structural Undo/Redo are retained. The browser regression covers inserting between two items, source synchronization, selection highlighting and Undo restoration.

## Additional signed-out release smoke test

The separate `tests/admin-anonymous-entry-smoke.mjs` Chromium test checks the public editor bookmark, direct Admin Workspace deep links, an expired local token, and a plausible but unverified local token. External network calls are blocked in every test context, and the browser must return to the sign-in page without revealing the Admin Workspace. The test uses no access codes, privileged tokens or publication operations. This **negative authentication check** supplements the simulated signed-in editor tests and does not replace the pending real authorised teacher login review.
