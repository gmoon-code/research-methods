# Research Methods Studio v3.0.0 FREE

Research Methods Studio is a public, self-guided research environment that supports an 18-stage research process while keeping the user's route, current Stage, current work, progress, and upcoming steps visible.

## Release architecture

- **Static application version** v3.0.0
- **Public student experience** local-first research workflow with optional Research Chat
- **Admin Workspace** authenticated private administration surface with seven primary areas
- **Content Studio** edits, validates, previews, publishes, versions, and rolls back the six managed guidance fields across all 18 stages
- **Published content service** isolated Cloudflare Worker at `rms-research-methods-v3`
- **Student public content loader** reads only the current safe public release and falls back to the bundled curriculum within a bounded startup window
- **Research Chat** remains on the validated `rms-research-chat-free` Worker and keeps the existing v2.16.0 backend service contract
- **Research-data collection** disabled in this release
- **Paid model APIs** none in the executable path

Application version, published content version, content schema version, and backend service version are separate. Publishing instructional content does not change the application version.

## Student experience

Students and other public users can use the site without belonging to a class or waiting for teacher approval.

The student-facing application includes

- 18 guided research Stages
- visible route and progress orientation
- My Research Snapshot
- Help, Research Terms, Progressive Help, and deterministic local guidance
- Literature Workspace
- Methods Lab
- Data and Statistics Lab
- Scientific Writing Lab
- Research Chat
- My Journey
- optional classroom review-packet workflow
- Word `.doc` notebook export
- JSON backup and recovery

The user's active research project remains local to the browser unless the user deliberately uses a networked feature such as Research Chat.

## Published instructional content

The bundled `assets/curriculum.js` remains a complete fallback curriculum.

At startup, `assets/public-content-loader.js` may read the current validated release from the configured public content endpoint. It can overlay only these six fields for each of the 18 stages

- title
- navigation label
- purpose
- learning guidance
- example guidance
- warning guidance

The loader validates the entire release before applying anything. Partial overlays are rejected. If the remote content service is unavailable, malformed, unsafe, incomplete, or too slow, the application uses the bundled curriculum. A late response cannot replace curriculum content after the student application has started.

## Admin Workspace

Authorized administrators enter through the existing private authentication boundary and are routed to `admin-workspace.html`.

The seven primary areas are

1. Dashboard
2. Content Studio
3. Usage and Research Data
4. Analytics
5. Services
6. Recovery and Operations
7. Settings

The first v3 release makes Content Studio publication functional. Other v3 areas retain their defined privacy and product boundaries while later milestones are developed.

Content Studio supports

- all 18 stage-guidance records
- field-level editing
- complete content-block replacement
- validation
- isolated preview
- in-memory drafts
- dirty-draft protection
- authenticated publication
- immutable revision history
- optimistic publication conflict protection
- rollback through a new chronological release

The existing classroom packet tools remain a secondary compatibility workflow. They are not required for independent public use.

## Privacy boundary

The active research notebook remains local to the user's browser under the current architecture.

Research Chat is optional. When project context is enabled, the browser minimizes project data before transmission. Raw datasets and obvious identifying fields are excluded, and the server repeats the minimization. When project context is disabled, project context is removed before network serialization.

The class Chat code is session-only in the browser and is not included in project backups.

The Admin publication access code and signed Admin session are separate from the student Chat code. Secret values never belong in browser source, GitHub, screenshots, student project files, or content releases.

The v3.0.0 release does not enable operational telemetry or research-study data collection.

## Service separation

The runtime configuration intentionally separates three service roles

- `researchChatEndpoint` and `chatEndpoint` use `rms-research-chat-free`
- `publicContentEndpoint` uses `rms-research-methods-v3`
- `adminContentEndpoint` uses `rms-research-methods-v3`

The public content loader never sends Admin credentials. Admin publication routes require the signed private session.

## Content storage and rollback

Published instructional content is coordinated by the SQLite-backed `ContentReleaseCoordinator` Durable Object.

Publication writes a complete validated 18-stage release. Immutable revision history is retained. Rollback creates a new publication event from a prior valid revision, preserving chronological history.

The bundled curriculum is the final application-level fallback if the remote content service is unavailable.

Source-control rollback remains separate from content rollback.

## Verification

Node.js 20 or newer is required for the primary regression and browser smoke checks.

```bash
npm run test:research-chat
npm run test:research-chat:browser
```

The v3 backend deployment checks are available through

```bash
npm run check:cloudflare:v3
npm run deploy:cloudflare:v3
```

The isolated v3 backend has its own deployment and canary gates. A frontend deployment does not imply a backend redeployment.

## Release and recovery documentation

Current v3 contracts and release controls are documented in

- `docs/V3_ADMIN_WORKSPACE_FOUNDATION_CONTRACT.md`
- `docs/V3_CONTENT_PUBLICATION_ROLLBACK_CONTRACT.md`
- `docs/V3_PRODUCTION_CUTOVER_CHECKLIST.md`

The immutable v2.17.1 tag and the pre-v3 cutover backup branch remain recovery references for the previous public application release.

Historical v2 release-engineering files are retained for auditability and should not be rewritten merely to match the current application version.

## Backend service contract

The Research Chat behavior continues to use the validated v2.16.0 backend contract and the Cloudflare Workers AI binding.

The v3 application adds content-publication routes and the content coordinator without changing the student Chat endpoint used by the public site.

Provider pricing and model availability can change. Recheck Cloudflare requirements immediately before any backend redeployment.

## Private access

The user-facing private product is named **Admin Workspace**.

The existing signed teacher-session mechanism remains the underlying authentication implementation during the v3 transition. Internal legacy route and secret names are retained where renaming them would create unnecessary release risk.

A successful private login returns a signed session token with an eight-hour maximum lifetime. The token is held in browser `sessionStorage`, verified by the Worker before private tools are shown, and cleared when private mode is left.

The former query-string or client-only privilege bypass is not part of v3.0.0.
