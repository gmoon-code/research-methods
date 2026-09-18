# Research Methods Studio v2.17.1 FREE

Research Methods Studio is a static, student-facing research-methods workspace that guides students through an 18-stage research process while preserving their route, current Stage, current work, progress, and upcoming steps.

## Current release status

- **Static application:** v2.17.1.
- **Teacher Workspace:** authenticated and integrated across Overview, Review Queue, Students, Assignment Setup, Analytics, Chat Controls, and Recovery.
- **Research Chat backend service:** the unchanged validated Cloudflare Workers AI service remains on its v2.16.0 backend contract.
- **Research Chat hosting:** active on the validated Cloudflare Workers Free backend. `assets/runtime-config.js` contains the public production Worker endpoint.
- **Cost architecture:** GitHub Pages for the static site plus Cloudflare Workers Free / Workers AI free allocation for Research Chat.
- **Paid model APIs:** none in the current executable path.
- **Automatic deployment:** none. This repository contains no active `.github/workflows` deployment directory.

The public `workers.dev` endpoint is safe to keep in the repository. The student class code, teacher access code, and teacher-session signing secret remain Cloudflare Worker secrets and never belong in browser code, GitHub, screenshots, or student project files.

## Student experience

Students retain continuous access to the research route and their progress while working through the project. Major tools include:

- 18 guided research Stages
- Current Stage and route/progress orientation
- My Research Snapshot
- Help, Research Terms, Progressive Help, and local deterministic guidance
- Literature Workspace
- Methods Lab
- Data & Statistics Lab
- Scientific Writing Lab
- Research Chat
- My Journey and teacher-review packet workflow
- Word `.doc` notebook export
- JSON backup and recovery

Research Chat is optional. If the free AI allowance is unavailable or exhausted, the rest of the application continues to work.

## Teacher Workspace

Teachers enter through `teacher.html`. After server verification, the browser opens the authenticated Teacher Workspace.

The v2.17.1 Teacher Workspace provides:

- Overview
- Review Queue
- Students and read-only project inspection
- Assignment Setup
- descriptive Analytics
- current-browser Chat Controls
- local backup inspection and student-site Recovery handoff

Teacher Workspace packet processing remains local to the current page session. It does not upload imported student review packets, expose Research Chat transcripts, mutate student project storage, or restore student projects from the teacher page.

## Privacy boundary

The research notebook is stored in the student's browser unless the student deliberately uses Research Chat.

When Chat project context is enabled, the browser minimizes the project data before transmission. Raw dataset fields and obvious identifying fields are excluded, and the server repeats the minimization. When project context is disabled, project context is removed before the request is serialized.

The class Chat code is session-only in the browser and is not included in the project backup. The repository contains no real class code or model API key.

See `SECURITY.md`.

## Zero-cost boundary

The hosted Research Chat service uses the unchanged v2.16.0 Cloudflare Workers AI backend contract. To keep hosted Research Chat at $0, use Cloudflare Workers Free and do not upgrade to Workers Paid or configure prepaid AI Gateway billing.

The backend model remains locked to:

`@cf/meta/llama-3.3-70b-instruct-fp8-fast`

Provider pricing and model availability can change. Recheck Cloudflare pricing and model availability immediately before any backend redeployment.

## Verification

Node.js 20+ is required for the primary v2.17 application regression and browser smoke checks.

```bash
npm run test:research-chat
npm run test:research-chat:browser
```

The existing v2.16.0 Python release-engineering scripts remain retained for the unchanged Cloudflare backend, public-repository, and publication architecture. Their versioned filenames are historical and intentionally were not renamed as part of the v2.17 Teacher Workspace release.

## Deployment documentation

The following v2.16.0 documents remain authoritative for the unchanged backend and zero-cost deployment architecture:

- `docs/FREE_ZERO_COST_ARCHITECTURE_v2.16.0.md`
- `docs/CLOUDFLARE_FREE_DEPLOYMENT_v2.16.0.md`
- `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.16.0.md`
- `docs/PUBLIC_GITHUB_READINESS_v2.16.0.md`

The v2.17 Teacher Workspace contracts are retained under `docs/V2.17_TEACHER_WORKSPACE_*.md`.

Historical release engineering records remain under `docs/archive/`.

## Teacher access

Teacher authentication remains separate from the student class Chat code. The teacher access code is verified by the Cloudflare Worker. A successful login returns a signed session token with an eight-hour maximum lifetime. The token is scoped to browser `sessionStorage`, is verified by the Worker before teacher tools are shown, and is cleared when teacher mode is left.

The former query-string or client-only teacher bypass is not part of v2.17.1.
