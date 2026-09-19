# v3 Content Publication and Rollback Contract

## Status

This document defines the publication architecture that follows Content Studio milestone 2.

This contract was authored while the current public release remained v2.17.1.

The contract did not enable publication by itself. The later v3.0.0 release candidate implemented the authenticated publication service, immutable revision history, rollback workflow, defensive public loader, bounded bundled fallback, and the required pre-cutover verification gates.

The v3 branch remains a development branch and draft pull request until the production cutover gate is deliberately completed.

## Current runtime facts

The public student application currently loads `assets/curriculum.js` directly.

The curriculum object is mutable and exposes

- phases
- stages
- terms

The current Content Studio manages six guidance fields for each of the 18 stages

- title
- nav
- purpose
- learn_html
- example_html
- warning_html

Other stage properties remain bundled with the application and are outside the first publication scope.

Current student modules including `assets/app.js`, `assets/student-flow.js`, and `assets/student-flow-ui.js` capture a reference to `window.RMSCurriculum` when they load.

The existing Cloudflare Worker already provides a signed private session boundary through the current teacher-session implementation.

The Worker currently has no content storage binding.

## Publication goals

The publication system must let an authenticated administrator publish validated instructional-content changes without manually editing production source files.

A publication must be versioned.

A prior known-valid publication must be recoverable.

The public student application must continue to work when the publication service is unavailable.

No publication operation may expose administrator credentials, Worker secrets, or storage credentials to browser code.

Publication must remain separate from operational analytics and research-data collection.

## Publication scope for the first release

The first publication release covers exactly the existing 18 stage-guidance records.

Each record is identified by

`curriculum.stage.<stage_id>.guidance`

where `stage_id` is an integer from 1 through 18.

Each published record contains exactly

- title
- nav
- purpose
- learn_html
- example_html
- warning_html

Publication does not change

- stage ID
- phase
- section definitions
- student work fields
- checks
- custom stage tools
- glossary
- response examples
- student project data
- Chat configuration
- research-study configuration

Those categories require separate later Content Studio schemas.

## Release model

Publication operates on a complete content release, not a partial live patch.

A release contains all 18 stage-guidance records.

This prevents the public application from receiving a mixture of old and new stage definitions during one publication operation.

A release has

- schema version
- content version
- release ID
- created timestamp
- published timestamp
- parent release ID when applicable
- release reason or change summary
- content hash
- 18 validated stage-guidance records

The server creates release identity and timestamps.

The browser does not choose trusted release metadata.

## Release identity

Release IDs must be opaque server-created identifiers.

They must not contain administrator identity, student identity, project names, access codes, or other personal information.

A release should also carry a SHA-256 content hash calculated from a canonical representation of the validated release payload.

The hash supports integrity checks and duplicate detection.

It is not an authentication credential.

## Current publication state

The server maintains one current published release.

The current public snapshot is stored independently from immutable release history.

The public reader therefore needs one current-snapshot read.

This design avoids a two-step public read in which a pointer might become visible before the referenced release has propagated.

The current snapshot contains the complete validated release plus its release metadata.

Immutable history stores each published release separately.

## Authoritative storage and coordination

The first Cloudflare implementation uses one SQLite-backed Durable Object named `ContentReleaseCoordinator`.

The Worker binds it as `RMS_CONTENT_COORDINATOR`.

All publication requests for this application route to one named coordinator instance. The coordinator owns the authoritative current release, immutable revision records, and revision metadata.

SQLite-backed Durable Object storage is used because publication requires strongly ordered state transitions. Conflict checking and publication writes must not depend on eventually consistent reads.

The coordinator exposes the logical operations

- read current release
- read public current release
- publish a complete validated release
- roll back to an immutable revision
- list revision metadata

The Worker HTTP routes authenticate and validate request boundaries, then delegate authoritative release transitions to the coordinator.

No storage credential, database identifier, or namespace identifier appears in browser runtime configuration.

The Durable Object binding and class declaration contain no account-specific storage identifier and can remain in repository configuration.

A future storage-provider change must not alter the public release schema.

## Publish sequence

A publish request follows this order.

1. Verify allowed origin.
2. Verify the existing signed Admin session.
3. Enforce a dedicated publication rate limit when configured.
4. Read and size-limit the JSON request body.
5. Reject unknown top-level fields.
6. Validate the expected current release identifier supplied by the Admin client when a current release exists.
7. Validate exactly 18 stage-guidance records.
8. Verify stage IDs 1 through 18 occur exactly once.
9. Verify record keys match their stage IDs.
10. Validate all six editable fields.
11. Reject unsupported markup and attributes.
12. Canonicalize the release payload.
13. Calculate the content hash.
14. Create server-controlled release metadata.
15. Write the immutable revision.
16. Write the complete current snapshot.
17. Return only safe release metadata to the Admin client.

If validation fails, no storage write occurs.

The expected-current-release check, immutable revision write, revision-metadata write, and current-release write occur inside one coordinator storage transaction.

If any storage operation in that transaction fails, the transaction is rolled back and the prior current release remains authoritative. A partial publication must not remain in storage.

## Optimistic concurrency

The Admin publish request includes the release ID that was current when the draft was prepared.

The authoritative coordinator compares that expected release ID with the current release inside the same strongly consistent transaction that performs publication.

A mismatch returns a conflict response and commits no publication writes.

This prevents an older Admin page from silently overwriting a newer publication, including when two Admin requests arrive close together.

The Admin must refresh publication state and deliberately resolve the conflict.

## Rollback model

Rollback creates a new publication event.

Rollback does not delete history and does not silently move a pointer backward.

The administrator selects a prior revision.

The server

1. verifies origin and signed Admin session
2. reads the requested immutable revision
3. revalidates it under the supported schema
4. confirms the expected current release ID
5. creates a new release ID
6. records the selected historical release as the rollback source
7. writes the rollback as a new immutable revision
8. writes that complete release as the current snapshot

The release history therefore remains chronological and auditable.

## Public read endpoint

The public content endpoint is read-only.

It returns either

- the complete current validated content release
- a clear no-publication response when no server publication exists
- a sanitized service failure

It never returns

- storage metadata
- administrator session data
- secrets
- internal error diagnostics
- draft content
- unpublished revisions
- research data
- student project data

The public response may be cached only under an explicit content-version policy.

Admin publication responses remain `no-store`.

## Public fallback

The bundled `assets/curriculum.js` remains a valid complete curriculum.

The student application must never require the remote content service to start.

A public content loader may overlay the six managed fields only when all of the following are true

- the configured content endpoint is valid HTTPS
- the response schema is supported
- all 18 records are present
- each record passes browser-side defensive validation
- stage identity matches the bundled curriculum
- the complete release is received within the defined startup budget

If any check fails, the loader leaves the bundled curriculum unchanged.

No partial overlay is permitted.

## Student boot ordering

The existing modules capture a reference to `window.RMSCurriculum`.

The publication loader therefore preserves the original curriculum object and mutates only approved stage-guidance properties in place.

It must not replace `window.RMSCurriculum` with a different object after dependent modules have captured the original reference.

The loader begins after the bundled curriculum exists.

The first student render must wait until the publication loader has reached one terminal state

- published release applied
- no publication configured
- no publication exists
- remote publication rejected
- remote service unavailable
- startup timeout reached

This gate applies to initial rendering only.

It must not block local project loading indefinitely.

## Startup budget

Remote content lookup must have a bounded startup budget.

If the public content service does not complete within that budget, the student application uses the bundled curriculum.

A later response must not replace curriculum content after the student has begun interacting with the page.

This prevents mid-session instructional content changes.

## Runtime content state

The browser may expose a read-only runtime content-state object for diagnostics.

It may contain

- source, such as bundled or published
- content version
- release ID
- content hash
- load status
- safe failure category

It must not contain

- administrator data
- secrets
- request headers
- IP information
- storage identifiers
- unpublished content

The Admin Services or Recovery and Operations views may display this safe state later.

## Validation parity

Admin browser validation and Worker publication validation must enforce the same content contract.

The Worker is authoritative.

Client validation improves usability but never authorizes publication.

A request that passed browser validation can still be rejected by the Worker.

## Managed markup

The first publication schema accepts only the restricted instructional markup already used by the current curriculum.

Approved elements are

- h3
- p
- div
- strong
- b
- em
- i
- br
- ul
- ol
- li
- span

Approved attributes are limited to explicitly allowlisted class values required by the curriculum.

Active content, links, embedded resources, forms, event handlers, scriptable URLs, inline scripts, stylesheets, SVG, MathML, objects, and iframes are rejected.

The public loader defensively validates again before applying a release.

## Request limits

Publication requests must have explicit body-size limits.

Individual plain-text and markup fields retain bounded lengths.

The server rejects unknown fields.

The server rejects duplicate stages, missing stages, unsupported schemas, malformed JSON, and over-sized requests before storage writes.

## Admin endpoints

The planned route family is

- `GET /admin/content/state`
- `GET /admin/content/revisions`
- `POST /admin/content/publish`
- `POST /admin/content/rollback`

All Admin routes require the existing signed Admin session.

The public route is

- `GET /content/public`

The exact route implementation may be split into a separate module while preserving this contract.

## Authentication and authorization

The current signed teacher-session implementation may continue to provide the underlying session token during the v3 transition.

User-facing product language remains Admin Workspace.

Internal legacy names may remain temporarily when renaming them would create release risk.

Publication authorization is enforced by the Worker.

A browser flag, query parameter, local-storage value, or hidden UI control can never authorize publication.

## CORS

Admin publication routes accept only configured allowed origins.

Public content reads also use explicit allowed-origin behavior suitable for the GitHub Pages application.

Preflight permits only the methods and headers required by the content API.

## Error handling

Public errors are sanitized.

Admin errors distinguish safe operational categories such as

- invalid draft
- stale publication state
- publication service unavailable
- revision not found
- rate limited

Responses do not include stack traces, storage-provider diagnostics, secret names with values, or internal request metadata.

## Logging boundary

Publication logic must not log full content payloads by default.

Operational logs may include safe release metadata and failure categories.

Logs must not contain Admin session tokens or access codes.

Publication logging remains separate from research data.

## Revision history

Revision history is an operational content-management record.

It is not student research data.

A history item may expose to the authenticated Admin

- release ID
- content version
- created or published timestamp
- parent release ID
- rollback source when applicable
- content hash
- administrator-supplied change summary

The first version does not require administrator personal identity.

## Recovery

The bundled curriculum is the final recovery layer.

If the content service becomes unusable, the public application still has a complete instructional path.

Admin rollback restores a prior server publication.

Source-control rollback remains a separate application-release recovery mechanism.

Content rollback must not modify student project storage.

## Version separation

The system tracks at least

- application version
- bundled curriculum seed version
- published content version
- content schema version
- backend service version

A content publication does not imply a new application version.

An application deployment does not imply a new published content release.

## Deployment boundary

Adding publication code to the repository does not make publication live.

A live publication system requires all of the following

- reviewed Worker route implementation
- configured SQLite-backed `ContentReleaseCoordinator` Durable Object binding
- successful coordinator transaction regression tests
- successful backend regression tests
- successful Admin publication tests
- successful public fallback tests
- deployment verification
- real authenticated publication canary
- rollback canary
- confirmation that bundled fallback still works when the content service is unavailable

Until those gates pass, Content Studio remains draft-only.

## First implementation slice

The first implementation slice after this contract should add pure publication-domain logic and tests without enabling a live route.

That slice should cover

- release-schema validation
- canonical release construction
- content hashing input
- publish conflict checks
- rollback release construction
- safe public release projection

Only after the pure model is stable should Worker storage and routes be added.

## Non-goals for the first publication release

The first publication release does not

- publish student form fields or question schemas
- publish response examples
- publish glossary content
- publish Chat prompts
- collect usage telemetry
- collect research-study data
- add public user accounts
- add administrator identity tracking
- alter student project storage
- remove the bundled curriculum fallback
