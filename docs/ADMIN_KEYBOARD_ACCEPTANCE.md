# Content Studio keyboard and administrator acceptance checklist

This checklist supports a private administrator acceptance test for the draft Content Studio implementation. It does not authorise a merge, publish a release, or enable student-data collection. Browser automation uses a simulated teacher session. An authorised administrator must perform the live-session checks below before considering any release.

## Covered automatically

The Admin visual editing browser suite uses Chromium to verify:

- The five editing-area links remain tabbable and their active state is clear.
- Left and right arrows, Home, and End move focus between editing-area links without unexpectedly switching the open editing area.
- Enter opens the focused area and moves focus to its heading.
- Inline editing exposes an associated label, keyboard instructions, a status description, and `aria-invalid` when wording is rejected.
- Tab advances from a valid edited text box to Save, and Shift+Tab returns to the same text box without changing the proposal.
- Alt+Up and Alt+Down move through editable wording and retain the existing source structure.
- Changing research stages, laboratories, Student Guide records, editing areas, or main Admin panels protects unfinished inline text.
- Review-only source maps, import/export checks, publication isolation, and in-memory draft boundaries continue to hold.
- A mobile-width preview scrolls with the page, shows visible touch controls, and does not cause horizontal document overflow.

These tests are useful regression checks. They do not establish conformance to an accessibility standard or replace testing with assistive technology.

## Live administrator acceptance, pending

Use the existing approved teacher sign-in process on a permitted **test** or **preview** deployment. Do not enter access codes in issue comments, screenshots, chat messages, or browser developer logs.

1. **Authenticate** using the existing session verification. Confirm a signed-out browser cannot view any Admin pane or reach an area using a fragment link.
2. **Navigate without a mouse** using Tab and Shift+Tab. In Content Studio, move focus among all five area links with Left/Right and Home/End. Press Enter to open each. Confirm the new heading receives a visible focus indicator and the correct pane opens.
3. **Edit wording** from a keyboard-only session in Research Activities, Lab Instructions, and Student Guide. Click via Enter or Space on a text target or adjacent pencil. Confirm a meaningful label is announced; the text cursor appears in the inline text box; and the text field's help explains Save, Cancel, and movement shortcuts.
4. **Test rejection and recovery.** Type blank text and an angle bracket into an inline field. Confirm the error is announced, `aria-invalid` is present, and Save and navigation are blocked. Correct the text, use Tab to Save, then Shift+Tab to return to the editor.
5. **Check unsaved changes.** Begin editing and try a different passage, an editing-area link, a record dropdown, and the top-level Admin sidebar. Choose Cancel at each confirmation and verify both text and selection survive. Try the same actions again and confirm discarding is explicit.
6. **Test the inspector.** Switch from direct editing to the detailed inspector and back. Use Save and open inspector to keep a valid proposal. Confirm status counts change and a reset removes only the intended proposal.
7. **Review with assistive technology.** On Windows, test with NVDA in a current desktop browser; confirm link names, current-area state, field labels, status messages, paragraph selectors, and focus location. Verify that repeated status announcements do not make typing difficult.
8. **Review a phone layout** with touch and an external keyboard when available. Confirm all important controls are reachable, the full-width passage editor stays within the viewport, and the preview has no nested scrolling trap.
9. **Export and re-import a review-only packet** in a test browser. Verify the imported proposals match the exported version and do not change field keys, field types, glossary references, application choices, laboratory calculations, or student progress.
10. **Verify publication isolation** separately using an authorised non-production v3 service. None of the review-only activity, laboratory, or Student Guide edits should appear as publishable stage-guidance release changes. Do not perform an actual public release while completing this checklist.

Record pass/fail and the browser/assistive-technology versions for each scenario. Document any incomplete checks as pending. Obtain explicit approval before merging the draft pull request or publishing any public asset.

## Keyboard reference

| Action | Keyboard |
| --- | --- |
| Navigate all focusable controls | Tab and Shift+Tab |
| Move among the five Content Studio area links | Left / Right, Home / End |
| Open a focused area link | Enter |
| Open editable wording | Enter or Space on the target or pencil |
| Save inline wording | Ctrl+Enter or Command+Enter |
| Cancel inline wording | Escape |
| Move between editable passages while focused in the text box | Alt+Up / Alt+Down |
| Navigate paragraphs without altering text | Choose a section in the paragraph selector |
