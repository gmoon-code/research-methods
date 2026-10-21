# Editing review-only wording directly on the page

The three review-only authoring areas, **Research activities**, **Lab instructions**, and **Student Guide**, now support editing the displayed wording without transferring manually to a separate inspector.

## How to use it

In Content Studio, open **Research activities**, **Lab instructions**, or **Student Guide**. **Click the actual displayed wording** to open its inline editor. This is the default editing mode. The adjacent pencil button provides the same direct-edit action for discoverability and keyboard access. Modify the text and choose **Save wording**, or press **Ctrl+Enter** or **Command+Enter**. **Escape** and **Cancel** discard the uncommitted inline change.

You can change **How would you like to edit?** to **Open the detailed inspector**. In that mode, clicking displayed wording uses the original inspector, while the pencil still opens the inline editor. The editing-mode control appears only in the three supported review-only authoring areas. It is a local interface preference for the current page, not an account setting.

Inside an inline editor, **Detailed inspector** opens the original inspector directly. If you've typed valid new wording, the action becomes **Save and open inspector**, preserving that proposal before switching views. After inline Save or Cancel, the preview takes the full width again and the duplicate inspector stays hidden. Explicitly requesting the inspector opens it.

Both workflows update the same proposal model. You can still review, export, import, and reset proposed wording using the original controls.

When switching records or workspaces, the interface checks for text that is still in the open inline editor. If that text differs from the current proposed wording, a confirmation appears. **Cancel** returns to the unfinished edit with its text and selection intact. **OK** discards only the uncommitted inline text and allows navigation. If the input has not changed, navigation closes it without prompting.

The same guard applies when changing a research stage, laboratory and panel, Student Guide stage or field, choosing a different visible text block, reviewing/exporting proposals, importing a packet, or resetting proposals. Cancelled selector changes restore the previously selected record. Reloading or closing the tab with unfinished inline wording triggers the browser's unsaved-changes prompt. A complete review proposal still needs an explicit JSON export to survive a page reload.

The visual layout also now collapses the duplicate inspector while an inline editor is open and expands the student guidance preview when its inspector is hidden. In Stage Guidance, the advanced structured source fields are collapsed by default beneath the visual editor. They remain accessible for precise edits and preserve the same validation schema.

## Validation and security

The inline interface takes its maximum length from the corresponding existing inspector. It checks nonempty text, field length, HTML angle brackets, and control characters before enabling Save. The text box accepts plain text only and does not interpret pasted markup or run pasted scripts.

An inline Save updates the original inspector and dispatches its standard input event, so it passes through the existing authoring model and draft validator. It does **not** publish, access student projects, modify the source curriculum or Student Guide objects, or create a network request.

Each pencil control is a separate real button. It is focusable and has a descriptive accessible label. Source text and edit controls remain sibling elements, so there are no nested buttons. It remains accessible on touch devices.

## Code and verification

The shared authoring module is `assets/admin-inline-review-editor.js`. It enhances only the current previews under `#activityPreview`, `#labGuidePreview`, and `#studentGuidePreview`, reattaching pencil controls after their existing renderers replace a preview.

Chromium tests in `tests/admin-visual-guidance-smoke.mjs` cover all three areas, invalid HTML-like text, inline Save, inspector synchronisation, Cancel/Escape, Ctrl+Enter, proposal counts and unchanged student source structures. The existing full Studio workflow also checks the original publication and Admin safeguards.

Drafts and exported packets retain their existing review-only boundaries. The public student website remains unchanged until a separately reviewed and approved release.
