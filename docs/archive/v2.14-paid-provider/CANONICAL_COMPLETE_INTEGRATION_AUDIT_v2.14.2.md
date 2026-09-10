# Research Methods Studio v2.14.2 canonical complete integration audit

## Release identity

This release is built only from the frozen complete v2.13.3 application package whose SHA-256 is `6e8ae32c301d590dde46f0cd8d60d23fd15a92e912187d7e832475a52e8eaa78` plus the audited v2.14.2 production overlay. The updater refuses a different source for a canonical build.

The complete repository manifest is `release-manifest-v2.14.json`. It records every packaged file except the manifest itself, the SHA-256 of every recorded file, the canonical source checksum, and the package tree digest.

## Integration defects discovered and corrected

The exact canonical merge exposed defects that overlay-only testing could not prove away.

- The existing v2.13 Chat helper used the legacy `conversation_history` and `project_context` request contract and legacy response fields. The secure adapter/backend now preserve that interface while translating it through the minimized v2.14.2 network contract.
- Student-facing `Ask Research AI`, `AI review`, and `AI settings` wording was removed where it referred to the assistant. The product surface is Research Chat or Chat.
- The old teacher Chat settings modal exposed editable endpoint fields even though v2.14.2 intentionally ignores browser-supplied endpoints. The current modal shows the owner-controlled endpoint as read-only and manages only the session class code and local Chat enable state.
- Research Chat now shows its privacy/context behavior directly in the drawer and can request the teacher-provided class code without exposing endpoint configuration.
- Browser-side minimization occurs before serialization. Raw dataset-like fields, unverified project source records, and obvious email/phone patterns are excluded or redacted before the request crosses the browser network boundary. The server repeats minimization independently.
- Historical browser-QA scripts that hard-coded temporary build directories were made repository-relative so they remain runnable from the packaged repository.
- The endpoint parser was corrected so an absolute owner-configured HTTPS endpoint remains valid on opaque-origin local preview pages.
- The current accessibility audit was corrected to distinguish truly visible controls from descendants of closed `<details>` elements. Chromium exposes the tested controls with their expected accessible names when those drawers are opened.
- A current v2.14.2 release verifier now separates applicable current gates from archived version-lock tests that intentionally encode retired labels, old temporary paths, or retired mutable endpoint behavior.
- The archived v2.12 Cloudflare Worker reference was replaced with a v2.14.2 Cloudflare adapter that imports the same audited `api/research-chat.js` route. The Worker adds Cloudflare-native wrong-code, per-session, and class-wide rate-limit bindings and fails closed when those bindings are absent.
- The current Cloudflare first-deployment path now uploads both required secrets with the code deployment through Wrangler `--secrets-file`, avoiding a partial first deployment where one declared required secret is still missing. The guarded helper keeps secret values out of command-line arguments and deletes its temporary secret file.
- Owner-controlled absolute HTTPS endpoints are now provider-agnostic. The configuration and production-smoke scripts accept a clean Cloudflare Worker root as well as the optional Vercel `/api/research-chat` route, while browser settings still cannot substitute an arbitrary endpoint.

## Current complete-release gates

The authoritative command is:

```bash
python scripts/verify-complete-release-v2.14.2.py
```

The canonical merged application passed all of the following current gates during the final offline audit.

- 45 of 45 Research Chat backend, browser-adapter, endpoint-configuration, Cloudflare-adapter, guarded deployment-helper, authentication, privacy, Structured Outputs, citation, rate-limit, configuration, and compatibility contract tests
- 28 of 28 retained functional-engine regressions covering analytics, coaching, competencies, pathways, exemplars, literature, methods, data flow, writing, recovery, student flow, transfer, and related preserved application engines
- current static application integration checks for the v2.14.2 student shell plus preserved v2.13.3 Word-export/shell invariants, student-flow integration, RC1 static mobile/policy behavior, and current v2.8 exemplar evidence/source/script-order invariants
- 7 of 7 real HTTP static-asset checks, including every JavaScript/CSS file referenced by `index.html`, CSS-local resources, `404.html`, and missing-asset 404 behavior
- Chromium Research Chat browser-network privacy smoke pass
- 9 of 9 Research Chat rendered UI checks
- 7 of 7 Word `.doc` and Research Snapshot export checks
- 58 of 58 full combined browser checks across first-run orientation, route/progress, Stage work, future previews, pathway decisions, Methods/Data/Writing/Literature Labs, synchronization, review invalidation, Chat privacy/configuration, backups, and mobile behavior
- 22 of 22 current accessibility/responsive checks, including keyboard focus management, Help dialog trapping/restoration, nonmodal Chat behavior, form/button naming, 320/360/430-pixel layouts, minimum control height, 200 percent text enlargement, reduced motion, forced colors, and JavaScript error monitoring
- syntax validation for all current production/support JavaScript inspected by the complete-release verifier
- public-package artifact/secret scan and confirmation that no active `.github/workflows` directory is present
- canonical release-manifest byte/hash verification before browser QA mutates any local QA evidence in the extracted test copy

Historical tests remain in the repository as earlier release evidence. Some intentionally fail if run as a single undifferentiated suite because they assert retired labels, mutable browser endpoint behavior, or old temporary build locations. They are not the current v2.14.2 acceptance gate. See `tests/README_CURRENT_RELEASE.md`.

## Deployment boundary

This audit verifies the offline complete repository and its production boundary. It does not prove a hosted production service. There is currently no configured production backend in `assets/runtime-config.js`, and this audit did not perform a real authenticated OpenAI request from a deployed class endpoint. The package now supports a current Cloudflare Workers path without requiring Vercel, while retaining Vercel as an optional alternative.

The hosted classroom status therefore remains **NOT YET GO**. Before classroom use, complete `docs/RESEARCH_CHAT_PRODUCTION_DEPLOYMENT_v2.14.md` and every item in `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.14.md`, including a real authenticated health check, wrong-code rejection, one real non-sensitive model request, browser-source/network secret inspection, context-on/context-off behavior, citation rejection, mobile verification, privacy review, and teacher approval.
