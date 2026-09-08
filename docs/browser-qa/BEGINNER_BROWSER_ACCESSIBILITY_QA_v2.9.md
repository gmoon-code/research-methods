# Beginner Browser Usability & Accessibility QA v2.9

## Result

**60 / 60 live browser checks passed after remediation.**

The test uses Playwright with the installed system Chromium and renders the exact packaged HTML, CSS, and JavaScript using `page.set_content()`.

The managed Chromium build in this environment blocks `http://localhost`, private-network URLs, `file://`, and `data:` navigation through organization policy. Because of that restriction, the automated browser cannot navigate directly to the local static server. The QA injects the exact package into an `about:blank` page and exercises Chromium rendering, CSS, JavaScript, keyboard events, responsive layout, focus behavior, and dynamic modal behavior there.

Static HTTP serving is tested separately.

This means the browser pass **does not constitute a real-origin persistence test**. Local-storage behavior continues to be covered by the existing Pilot/Recovery implementation tests. A final deployed GitHub Pages check remains appropriate before a classroom pilot.

## Browser configurations exercised

- Desktop 1440 × 1000
- Tablet 768 × 1024
- Mobile 430 × 900
- Mobile 360 × 800
- Mobile 320 × 800
- 200% text-enlargement simulation
- keyboard-only modal navigation
- nested modal focus/escape behavior
- all eight research paths at Stage 10

## Eight-path browser sweep

Stage 10 was rendered and checked for:

- Descriptive quantitative
- Observational / correlational
- Experimental
- Quasi-experimental
- Qualitative
- Literature review
- Meta-analysis
- Mixed methods

For every path, the browser confirmed:

1. visible Stage 10 controls had accessible labels
2. the stage produced no page-level horizontal overflow
3. Worked Stage 10 routed to the path-matched exemplar

## Defects found and fixed during the live pass

### 1. Desktop tool header widened the entire page

At 1440 px, the tool row produced approximately **350 px of horizontal page overflow**.

Fix:
- desktop tool controls can wrap
- top bar height can grow
- maximum tool-area width is bounded

Result:
- no page-level horizontal overflow at the tested desktop width

### 2. Skip link did not reliably move keyboard focus

The visible skip link changed the fragment but did not consistently place focus on `#mainContent`.

Fix:
- explicit keyboard/click handler focuses the main landmark
- main content remains `tabindex="-1"`

Result:
- keyboard focus moves directly into the workspace

### 3. Dynamic modals did not share one consistent accessibility contract

The application contains many independently created modal systems.

Fix:
- a generic MutationObserver now adds `role="dialog"`
- `aria-modal="true"`
- automatic `aria-labelledby`
- initial focus on the dialog title
- background `inert`
- body scroll lock
- Tab focus trapping
- Escape closing
- opener focus restoration

Result:
- progressive help, exemplar library, nested confirmations, and laboratory modals use a common focus model without rewriting every feature module

### 4. Nested Escape closed two dialogs

An inherited Pilot/Recovery Escape listener received the same key after the accessibility layer closed the nested confirmation.

Fix:
- the active dialog handler stops propagation for Escape
- only the top modal closes
- focus returns to the underlying modal
- a second Escape closes the underlying modal and restores focus to the original page opener

### 5. Mobile controls remained at 40 px

Several buttons and disclosure summaries were 40 px high.

Fix:
- mobile buttons and summaries now use a minimum 44 px height

Result:
- the narrow-mobile interactive-target audit passes

### 6. Instructional microprint was too small

Several inherited guidance, rescue, path, and exemplar components used 7–10 px text.

Fix:
- substantive instructional prose now has a 14 px floor
- secondary labels have a 12 px floor
- form labels and stage/lab tabs have a 14 px floor
- long scientific strings and citations can wrap safely

This is a substantial readability improvement for novice users.

### 7. Pathway banner contrast failed the sampled AA audit

The Stage pathway label used `#718391` on `#f6fafc`, producing a sampled contrast ratio of approximately **3.73:1** for normal-sized text.

Fix:
- darker secondary text
- pathway label enlarged
- resulting pair is approximately **5.25:1**

### 8. Skip link could become partially visible under enlarged text

The older negative-pixel hiding rule could expose part of the skip link when text size doubled.

Fix:
- transform-based off-screen positioning
- focused state returns it to the viewport

## Other live checks passed

- no JavaScript page errors on initial render
- first-run Pilot & Recovery onboarding has dialog semantics and focus
- first-run onboarding dismisses with Escape
- visible Stage 1 form controls have labels
- visible buttons have accessible names
- sampled solid-background instructional text meets AA contrast thresholds
- progressive-help focus stays trapped during repeated Tab presses
- Escape restores focus to the progressive-help opener
- exemplar library receives dialog semantics
- nested exemplar confirmation makes the underlying dialog inert
- no page-level overflow at 768, 430, 360, or 320 px
- mobile top tools remain available
- 200% text enlargement produces no page-level horizontal overflow
- reduced-motion CSS is present
- forced-colors CSS is present
- dynamic laboratory tables become keyboard focusable and labelled

## Screenshots

The package contains screenshots under `docs/browser-qa/screenshots/`.

They include:

- desktop welcome page
- exemplar library
- 430 px mobile layout
- 320 px mobile layout
- mobile Stage work view
- 200% text-enlargement view

## Accessibility claim boundary

This release should **not** be described as certified WCAG conformance.

The pass provides meaningful browser-facing accessibility and usability evidence, but full conformance work would still require broader assistive-technology testing, including screen-reader testing with representative users/platforms, additional color/zoom states, and ideally real novice-user usability sessions.
