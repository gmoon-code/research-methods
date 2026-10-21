# Unified Content Studio workspace navigation

Research Methods Studio Admin Workspace now shows one authoring area at a time. This layout update belongs to the existing authenticated Admin workspace and does not change any student-facing code or publication authority.

## Five editing areas

The top of Content Studio has a compact, accessible navigation row for **Stage guidance**, **Research activities**, **Laboratory instructions**, **Student Guide**, and **Guidance publication**. The active editor is visibly selected, an area summary explains its purpose, and its current changed-draft or proposed-change count is displayed alongside the other areas.

The five areas retain their existing separate validation and publishing boundaries:

- **Stage guidance** uses the original six-field, 18-stage Content Studio model. Its in-memory drafts can be included in the existing isolated authenticated v3 guidance publication workflow.
- **Research activities** edits label and instruction proposals only, while stable field identifiers, choice options and student progress remain protected.
- **Laboratory instructions** edits the instructional headings and explanations of 32 panel definitions across four labs. Laboratory tools and decisions remain protected.
- **Student Guide** edits stage explanations and field-level help in the original 18 stage and 113 response-field records. Glossary links, keys, and other application structures remain protected.
- **Guidance publication** retains the original Admin service connection, signed publication session, release history, and rollback actions. This section cannot publish review-only proposals.

## Interaction and state

Only the selected area is visible. Hidden areas remain mounted. Their in-memory drafts and selected records are retained when an administrator changes views. The editor does **not** save or publish when switching. The status labels reflect the respective existing editor counters or service connection state. The compact stage selector helps reduce scrolling within stage guidance.

Navigation is implemented with ordinary focusable links, a visible current-area indicator, and a clear heading for the active view. Its layout adapts to smaller screens. On large displays, the area navigation stays available below the existing header while the administrator scrolls. Keyboard and assistive-technology users can use the same links.

A copyable area URL uses the page fragment, such as `#studentGuideAuthoring`. The existing teacher-session verification completes before the Admin Workspace opens. A matching fragment then selects the corresponding editor inside Content Studio. An unauthenticated visitor cannot use the fragment to bypass verification.

## Technical scope

- `assets/admin-content-workspace-navigation.js` handles area display, current focus, and status mirroring. It has no network, data-storage, or publishing code.
- `admin-workspace.html` marks the existing authoring areas with `data-editor-workspace`. The controlled groups are hidden with CSS using the standard HTML `hidden` attribute.
- The existing content browser, validators, import/export routines, service session, and publication coordinator remain unchanged.

The smoke suite confirms exclusive visibility, navigation across all editing areas, preserved draft values, indicator updates, publication isolation, authenticated deep-link selection, and original security contracts. Its teacher login is simulated within the test browser and is not a substitute for a live administrator acceptance test.
