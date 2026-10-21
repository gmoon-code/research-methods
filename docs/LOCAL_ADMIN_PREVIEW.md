# Open the draft Admin editor on your own computer

This preview lets you **click through the actual draft Content Studio** before the pull request is merged. It is a local interactive testing tool, not a website deployment or a real sign-in test.

The browser starts with a **simulated Admin session** and displays a prominent banner saying that it is a local preview. External requests are blocked, including all production Cloudflare Worker endpoints. The preview cannot publish content, collect student records, or validate real credentials. All editable wording changes remain local until you explicitly export a review-only JSON packet.

## Windows setup, first time

1. Install **Node.js 22** or another supported version of Node.js 20 or newer from [nodejs.org](https://nodejs.org/). You do not need Python.
2. Open the [draft branch](https://github.com/gmoon-code/research-methods/tree/feature/admin-visual-guidance-20261020) on GitHub. Use **Code → Download ZIP**, then extract the archive to a folder on your computer. Ensure the extracted folder contains both `package.json` and `admin-workspace.html`.
3. Open the extracted folder in File Explorer, then select **Open in Terminal** from its context menu. The terminal should start in the same folder as `package.json`.
4. Run the following commands in the Windows terminal. The first two install the browser-testing dependency and Chromium locally. The third opens the preview.

```powershell
npm.cmd install --no-save playwright@1.56.1
npx.cmd playwright install chromium
npm.cmd run preview:admin
```

**On later visits**, run only `npm.cmd run preview:admin` from the same extracted folder. To test newer draft changes, download the branch again and repeat the first-time setup in that new folder.

On macOS or Linux, use `npm install --no-save playwright@1.56.1`, `npx playwright install chromium`, and `npm run preview:admin` in the extracted directory.

If the preview says that Playwright or its Chromium executable is missing, repeat the relevant installation command. If the browser does not open on a school-managed computer, check whether local browser automation is restricted.

## What you will see

A new Chromium window opens to `http://127.0.0.1` on a dynamically assigned port. Its **LOCAL DRAFT PREVIEW** notice is deliberately visible. This is a browser-only simulated Admin experience, so **do not enter any access codes**. Click **Content Studio** from the main Admin navigation.

Try these interactions.

- **Research activities**. Click a displayed heading, edit it inline, save it, and check that the updated passage is marked as proposed.
- **Laboratory instructions**. Change a text passage, move to the next one using Save and Next, and verify your proposal count.
- **Student Guide**. Switch between a stage guide and field help, jump between wording blocks, and select a paragraph from a longer passage.
- **Discard warning**. Type a change without saving. Try another stage or editing area, then choose Cancel. Your unfinished text should still be there.
- **Keyboard-only navigation**. Use Tab, Shift+Tab, arrow keys on the editing-area links, Enter, Escape, Ctrl+Enter, and Alt+Up/Down.
- **Mobile view**. Use Chromium Developer Tools, then toggle its device toolbar (**Ctrl+Shift+M** on Windows). Check the editor at approximately 390 pixels wide.

Local activity, lab, and Student Guide proposals can be exported to JSON for review. Closing the browser ends the preview; its in-memory unsaved edits are discarded. The preview is not connected to any release service.

## Safety boundaries

The launcher `scripts/preview-admin-locally.mjs` serves only `admin-workspace.html` and static files under `assets/` on the local loopback interface. It intercepts the browser's teacher-session script *inside this dedicated preview browser only*. Every outgoing request outside the local preview's origin is aborted. It cannot contact live teacher-login services or the live v3 publishing backend.

This launcher is never included by the public Admin web page and does not change the application authentication code. The existing normal Admin pages still verify real teacher sessions.

## Testing the real login and backend

The repo's Cloudflare Worker configuration currently lists `https://gmoon-code.github.io` as the allowed browser origin. The draft code on a local origin will therefore not pass the real production login flow through that Worker. Do **not** add `localhost`, GitHub Codespaces hosts, or a public preview URL to the production Worker merely to make this test pass.

An authenticated acceptance test needs a **separate, restricted staging deployment**, with a staging frontend origin, a dedicated staging Worker, its own teacher access secret and session signing secret, an allowed staging origin, and separate v3 publication/storage resources. We must configure and review that staging environment separately. It should never use production secrets or publish to the student-facing release service.

No staging deployment is created by this preview command. A release or production deployment still requires explicit approval.

## Verification

The separate Chromium regression suite runs with a simulated browser session in GitHub Actions. The local preview launcher also has its own headless safety test in `tests/admin-local-preview.test.mjs`, checking the loopback-only origin, restricted static file access, simulated Admin UI, blocked external network requests, and actual editing. Those tests do not replace the pending live administrator and assistive-technology acceptance checks.
