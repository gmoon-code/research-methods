# Research Methods Studio v3 Admin Workspace Foundation Contract

## Status

This document defines the product, privacy, data, and implementation boundaries for the v3 Admin Workspace foundation.

The frozen public baseline is Research Methods Studio v2.17.1.

The v3 work begins on a separate development branch. The v2.17.1 production tag and public release remain unchanged until a later release candidate passes its own acceptance gates.

## Product model

Research Methods Studio is a public, self-guided research environment.

A person may use the student-facing site independently without belonging to a class, having a teacher, receiving a grade, or waiting for teacher approval.

The student-facing product guides a user through the research process with detailed stages, explanations, examples, structured prompts, tools, local project storage, backup and recovery, and optional Research Chat support.

The private workspace serves the platform owner or authorized administrator.

Its primary purposes are platform administration, content management, operational oversight, and appropriately governed research-data management.

Classroom review features may remain available as an optional module for administrators who also teach classes. They are not a dependency of the public research workflow.

## Naming

The private product is named **Admin Workspace**.

User-facing references to **Teacher Workspace** will be migrated deliberately in later milestones.

The current authenticated teacher entry and signed session infrastructure may be reused during the transition so the security boundary does not change at the same time as the product model.

Renaming authentication secrets, Worker routes, or backend contracts is outside the foundation milestone unless a later security review requires it.

## Primary Admin Workspace areas

The v3 primary navigation contains seven areas.

### 1. Dashboard

Dashboard provides a concise operational overview.

It may include

- current public application version
- content version and publication state
- service health
- Research Chat service state
- recent content changes
- research-study status
- aggregate usage summaries when collection is enabled
- data-quality warnings
- unresolved operational issues
- recovery and backup status

Dashboard must not rank users, score research quality, or expose raw participant records by default.

### 2. Content Studio

Content Studio is the primary content-management surface.

An administrator can locate, inspect, edit, preview, validate, publish, and restore student-facing instructional content without editing source files manually.

Supported content categories should grow from a shared content registry.

Initial categories include

- stage titles
- stage purposes
- stage instructions
- task prompts
- field labels
- field explanations
- examples
- warnings
- help text
- progressive-help text
- terminology and glossary entries
- resource links
- milestone descriptions
- research-process guidance
- student-facing interface copy
- optional Chat guidance text
- structured question banks where those questions are content-driven

Content Studio must support complete replacement of a content block when the administrator chooses to replace the full block.

Content Studio must also support targeted edits to one field without forcing a full replacement.

### Content editing workflow

Every editable content record has

- a stable content key
- a content type
- a student-facing location
- a current published value
- an optional draft value
- a revision identifier
- publication status
- validation state
- last-updated metadata
- change summary metadata

The required lifecycle is

1. select content
2. edit a draft
3. validate
4. preview using the student renderer
5. publish
6. record the published revision
7. allow rollback to a prior valid revision

Publishing must never require direct modification of HTML or JavaScript by the administrator.

The initial v3 implementation may use repository-backed content publication while the final storage architecture is developed. The Admin Workspace contract must remain independent of a specific storage provider.

### Content safety

Content publishing must validate structure before a revision becomes active.

A malformed draft must never replace the currently valid published content.

Preview must be isolated from the production content state.

Rollback must restore a complete known-valid revision.

Content history must preserve enough metadata to determine what changed, when it changed, and which revision is currently active.

## 3. Usage and Research Data

Usage and Research Data manages data collection boundaries and research datasets.

Operational analytics and research data are separate data domains.

They must not be combined silently.

### Operational data

Operational data supports product maintenance and usability analysis.

Possible event types include

- application version
- content version
- stage opened
- tool opened
- feature availability
- successful or failed backup action
- recovery result category
- client-side error category
- Research Chat availability state
- coarse session progress events

The application must define exactly which operational fields are collected before collection is enabled.

The application must not place raw research-project text, names, email addresses, phone numbers, direct identifiers, student records, or uploaded datasets into operational telemetry.

The application must not persist IP addresses or raw request metadata into its own operational dataset.

### Research data

Research data exists only for a defined research purpose.

A study has its own

- study identifier
- study title
- research purpose
- approved variable set
- consent text
- active or inactive state
- collection start and end rules
- retention rule
- export schema
- versioned data dictionary

Research participation is explicit.

Using the public site must remain possible when a user does not participate in a research study.

A user who declines research participation must continue to receive the normal self-guided research experience unless a specific research-only feature is clearly identified as such.

### Participant identifiers

Research records use a study-specific random participant identifier.

The identifier must not be derived from a person's name, email address, school identifier, project title, browser fingerprint, or IP address.

Cross-study linkage is disabled by default.

A study may define a linkage method only when that method is explicitly required by the research design and approved by the applicable research protocol.

### Structured data first

The default research-data model collects structured variables.

Examples include

- stage progress state
- sequence of stage completion
- selected strategy categories
- use of specific help tools
- number of revisions
- milestone states
- response category selections
- error-category codes
- preparation-strategy selections
- self-report scale responses
- timestamps or elapsed-time categories when approved
- feature-use counts
- optional survey responses defined by the study

Open-ended research text is excluded from research collection by default.

A study that needs open-ended text must enable it explicitly in the study definition and must define its privacy treatment.

### Free-text safeguards

Open-ended text may contain identifying information even when a participant was asked not to provide it.

If a study collects free text, the data pipeline must treat the text as potentially identifiable until it passes the study's required minimization or review process.

A user-facing consent description must state when project text or open-ended responses are collected.

The Admin Workspace must distinguish structured de-identified or pseudonymous fields from free-text fields that may carry re-identification risk.

### Data minimization

Every collected field must have a documented purpose.

Unused fields are not collected merely because they are technically available.

Raw browser storage objects are never uploaded as a research dataset.

Full project backups are never treated as research telemetry.

Research Chat transcripts are not research data unless a specific study explicitly enables transcript collection under its own consent and data rules.

Student project datasets are never collected automatically.

### Consent state

The research client must preserve a clear state such as

- not asked
- declined
- consented
- withdrawn
- study ended

Consent state must be study-specific.

Withdrawal behavior must be defined by the study and applicable research requirements.

The interface must avoid implying that participation affects access to the public research helper.

## 4. Analytics

Analytics provides aggregate, descriptive views over approved operational or research data.

Operational analytics and research analytics have visibly separate contexts.

Possible operational views include

- sessions by application version
- stage-open frequencies
- stage progression funnels
- help-tool use
- backup and recovery success categories
- feature errors
- service availability

Possible research views depend on the active study data dictionary.

The Admin Workspace may provide

- counts
- percentages
- distributions
- cross-tabulations
- descriptive summaries
- missingness summaries
- export-ready filtered records

The foundation does not create automated grades, performance rankings, predictive student labels, or hidden learner scores.

Research analyses beyond descriptive summaries should be implemented only when their statistical purpose and assumptions are explicitly defined.

## 5. Services

Services replaces the classroom-centered meaning of Chat Controls.

It provides administrator-visible operational status for external or backend services.

Initial service areas may include

- Research Chat
- public endpoint configuration
- backend application version
- service health
- rate-limit state categories when safely available
- configured or unconfigured status
- deployment compatibility information

Services must not expose secret values.

Research Chat transcript content remains inaccessible from this operational surface unless a future study explicitly creates a separate consented transcript dataset.

## 6. Recovery and Operations

Recovery and Operations supports platform maintenance and safe recovery workflows.

It may include

- backup-format inspection
- backup-version compatibility
- checksum verification
- restore compatibility information
- public release status
- content revision rollback
- content publication health
- data-export health
- data-ingestion health
- safe diagnostic information

The Admin Workspace must not silently restore or overwrite a public user's local project.

User project recovery remains under the user's control unless a later authenticated account architecture explicitly changes that boundary.

## 7. Settings

Settings contains administrator configuration that does not belong to content editing or research records.

Possible settings include

- public site identity
- feature flags
- optional modules
- classroom compatibility tools
- study availability
- operational collection state
- content publication policy
- safe retention configuration
- export defaults

Secret values are not rendered back to the browser after server configuration.

## Optional Classroom Tools module

The current teacher-review workflow may be preserved as an optional compatibility module.

It may include

- manual student review-packet import
- checkpoint review
- teacher feedback export
- classroom aggregate summaries

This module is secondary.

The public research process does not depend on classroom packet exchange.

No classroom review state may block an independent public user from progressing through the normal research route unless that user is intentionally participating in a configured classroom workflow.

## Public user model

The v3 foundation assumes that a public user may be

- an independent learner
- a secondary student
- a university student
- a teacher conducting personal research
- a professional learning research methods
- a researcher using the structured workflow
- a participant in an approved research study
- a classroom student using an optional classroom configuration

The interface should avoid language that unnecessarily assumes every user has a teacher, class, grade, or school.

Context-specific classroom language may appear inside an explicitly enabled classroom module.

## Account boundary

The v3 foundation does not require public user accounts.

The existing local-first project model remains the production baseline until an account architecture is deliberately designed.

A later account system must not be introduced implicitly through analytics or research collection.

Research participant identifiers are not user accounts.

## Local-first project boundary

The user's active research project remains local to the browser under the current architecture.

Admin analytics do not gain access to full local project state merely because aggregate collection is enabled.

Only approved event or study fields cross the network.

The collection client must construct a new allowlisted payload from approved fields.

It must not serialize the full project object and then attempt to remove disallowed fields.

## Data ingestion boundary

Any future Admin data-ingestion endpoint must

- authenticate the destination service
- validate an explicit schema
- reject unknown fields
- enforce payload-size limits
- reject unsupported study identifiers
- reject collection for inactive studies
- enforce consent state for research records
- separate operational and research records
- sanitize server errors
- avoid returning internal diagnostics to public users
- avoid writing direct identifiers into approved de-identified datasets

Server receipt of a request does not authorize storage of every request attribute.

## Admin authentication

The Admin Workspace remains protected by authenticated server-verified access.

The current signed teacher-session mechanism may be reused during migration.

The browser must not gain administrator access through a query string, local flag, hidden button, or client-only check.

The Admin Workspace must fail closed when its authentication configuration is unavailable.

## Authorization

The foundation assumes one administrator role initially.

The architecture must not prevent later introduction of scoped roles such as

- content editor
- research-data analyst
- operations administrator
- full owner

Role-based authorization is a later milestone and must be enforced server-side when introduced.

## Research export

Research Data must support export of the study's approved fields.

Exports need

- study identifier
- schema version
- export timestamp
- variable names
- data dictionary reference
- filtering summary
- row count
- missingness information where appropriate

A standard export may use CSV for tabular analysis and JSON for full typed metadata.

Raw secrets, browser credentials, IP addresses, server tokens, and unrelated project content must never be included.

## Data-quality support

Research Data should make data-quality checks visible.

Examples include

- duplicate participant-event identifiers
- malformed events
- missing required study fields
- unexpected schema versions
- impossible timestamps
- invalid categorical values
- repeated submissions where uniqueness is required
- consent-state conflicts

A data-quality warning does not automatically imply participant misconduct or invalid research.

## Versioning

The Admin Workspace and public content each have explicit versions.

The application version, content version, study schema version, and backend service version are separate concepts.

Changing student-facing content does not require pretending that the backend service changed.

Changing a research data schema requires its own version update.

A published study dataset must retain enough version information to reconstruct which application and content definitions were active when a record was collected.

## Migration from v2.17.1

The migration is incremental.

### Foundation milestone

The first v3 milestone

- creates this contract
- leaves the live student site unchanged
- leaves the v2.17.1 Admin/Teacher implementation unchanged
- defines the new information architecture and privacy boundaries
- identifies reusable v2.17.1 components

### Admin shell milestone

The next milestone will

- rename the private surface to Admin Workspace
- create the new seven-area navigation
- preserve existing authenticated access
- preserve current Teacher Workspace functionality behind a compatibility area where needed
- introduce no research collection yet

### Content Studio milestone

Content Studio will be implemented before broad research-data collection.

The first usable Content Studio must prove that an administrator can safely edit, preview, validate, publish, and roll back at least one real student-facing content category.

### Data architecture milestone

Operational and research collection will be designed and tested separately.

No public research-data collection is enabled merely by creating the Admin UI.

A study-definition and consent architecture must exist before research records are accepted.

### Analytics milestone

Analytics consumes only the data domains that have passed their own collection and privacy gates.

### Optional classroom migration

The existing review-packet workflow may then move into an optional Classroom Tools area.

Its packet compatibility should be preserved when practical.

## Reusable v2.17.1 components

The following v2.17.1 work is expected to remain useful

- server-verified private-session authentication
- private workspace access gate
- safe text rendering practices
- local JSON validation patterns
- pure derivation functions
- descriptive analytics patterns
- Chat service status logic
- backup inspection and Recovery logic
- regression-test infrastructure
- browser smoke infrastructure
- release and rollback discipline

Reuse requires confirming that the component's semantics still fit the Admin product model.

## Components requiring conceptual redesign

The following areas are not accepted as the primary v3 model without redesign

- teacher-centric naming
- Review Queue as a primary navigation destination
- Students as the central unit of the private workspace
- teacher checkpoint approval as a platform-wide assumption
- teacher feedback packets as the main data exchange
- classroom-only aggregate analytics
- manual packet import as the primary source of platform data

They may remain available inside the optional Classroom Tools module.

## Accessibility and usability

The Admin Workspace must use the same quality standard as the public site.

An administrator should be able to determine

- where they are
- what object they are editing
- whether they are editing a draft or published content
- whether a change is saved
- whether a change is published
- what data domain they are viewing
- whether a dataset is operational or research data
- which study and schema apply
- what action is destructive
- how to recover from an error

Dense administrative information must use progressive disclosure, clear hierarchy, readable contrast, and explicit status labels.

## Foundation non-goals

This foundation does not

- enable public telemetry
- enable research data collection
- create user accounts
- upload existing local projects
- collect raw research notebooks
- collect Chat transcripts
- add grading
- add learner rankings
- replace the current backend
- change the v2.17.1 public release
- alter the frozen v2.17.1 tag

## Foundation acceptance criteria

The foundation is accepted only when

- the v3 branch starts from the frozen v2.17.1 production commit
- this contract exists as the only product change in the foundation commit
- the public student site has no behavior change
- the existing private workspace has no behavior change
- no backend route changes
- no data collection begins
- no new persistence begins
- no secrets or credentials are added
- the new Admin Workspace product model is explicit
- Content Studio is identified as the first substantive Admin capability
- operational data and research data are explicitly separated
- research participation is explicitly optional
- the local-first project boundary remains intact
- classroom review is explicitly optional
