# Editing review-only wording directly on the page

The three review-only authoring areas, **Research activities**, **Lab instructions**, and **Student Guide**, now support editing the displayed wording without transferring manually to a separate inspector.

## How to use it

In Content Studio, open one of these areas and find the instruction or field text to revise. Select its pencil icon (accessible as **Edit this wording here**). An inline text box appears immediately under the selected content. Edit the plain text and choose **Save wording**. You can use **Ctrl+Enter** or **Command+Enter** to save through the same action, or **Escape** or **Cancel** to discard the uncommitted inline change.

Clicking the text itself continues to open the original inspector for users who prefer that workflow. Both editing approaches update the same local proposal data. You can still review, export, import, and reset proposed wording using the existing controls.

When switching records, save an open inline change first. An unfinished text box is temporary. If you start another in-place edit with unsaved changes, the interface asks whether to discard them.

## Validation and security

The inline interface takes its maximum length from the corresponding existing inspector. It checks nonempty text, field length, HTML angle brackets, and control characters before enabling Save. The text box accepts plain text only and does not interpret pasted markup or run pasted scripts.

An inline Save updates the original inspector and dispatches its standard input event, so it passes through the existing authoring model and draft validator. It does **not** publish, access student projects, modify the source curriculum or Student Guide objects, or create a network request.

Each pencil control is a separate real button. It is focusable and has a descriptive accessible label. Source text and edit controls remain sibling elements, so there are no nested buttons. It remains accessible on touch devices.

## Code and verification

The shared authoring module is `assets/admin-inline-review-editor.js`. It enhances only the current previews under `#activityPreview`, `#labGuidePreview`, and `#studentGuidePreview`, reattaching pencil controls after their existing renderers replace a preview.

Chromium tests in `tests/admin-visual-guidance-smoke.mjs` cover all three areas, invalid HTML-like text, inline Save, inspector synchronisation, Cancel/Escape, Ctrl+Enter, proposal counts and unchanged student source structures. The existing full Studio workflow also checks the original publication and Admin safeguards.

Drafts and exported packets retain their existing review-only boundaries. The public student website remains unchanged until a separately reviewed and approved release.
