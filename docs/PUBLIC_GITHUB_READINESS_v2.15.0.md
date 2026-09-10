# Public GitHub readiness — v2.15.0 FREE

## Purpose

This gate covers what is safe and appropriate to place in the future public GitHub repository used for GitHub Pages. It does not deploy the site and does not activate Research Chat.

## Publication decisions

- First remote publication target: `release/v2.15.0-free-public` review branch.
- GitHub Pages source after a separate review/merge gate: `main` branch, repository root.
- Static build step: none.
- Jekyll processing: disabled through `.nojekyll`.
- Research Chat endpoint in the checked-in release: blank.
- Automatic GitHub deployment workflows: absent.
- Production Chat provider: Cloudflare Workers AI through the Worker `AI` binding.
- Required Worker secret: `RMS_CHAT_ACCESS_CODE` only.

## Public-safe material

The repository may contain application source, current Worker source/configuration, generic synthetic examples, generic pilot templates, tests, QA screenshots generated from synthetic/test projects, and release records.

No real student or participant data was intentionally included in the release. The included rehearsal/exemplar data are synthetic or generic instructional fixtures.

## Material excluded from the public release

- real class Chat code
- `.env` / `.dev.vars`
- Cloudflare credentials/tokens
- Wrangler local state
- `node_modules`
- local caches and logs
- real student project backups
- real participant datasets
- student-identifying screenshots

## Archived material

Older paid-provider deployment material and the early provider-reference backend have been moved under `docs/archive/` and carry explicit superseded warnings. They are retained only for engineering traceability.

Current publication/deployment instructions are only:

- `GITHUB_PUBLICATION_HANDOFF_v2.15.0.md`
- `FREE_ZERO_COST_ARCHITECTURE_v2.15.0.md`
- `CLOUDFLARE_FREE_DEPLOYMENT_v2.15.0.md`
- `PRODUCTION_ACCEPTANCE_CHECKLIST_v2.15.0.md`

## GitHub Pages compatibility

The public page shell uses relative asset references rather than root-absolute `/...` references. This is required for a project page hosted under a repository path such as `/research-methods/`.

`assets/runtime-config.js` must remain public configuration only. It may later contain the public Worker endpoint but must never contain the class code or any credential.

## Pre-publication gate

Run:

```bash
python scripts/verify-complete-release-v2.15.0.py
python scripts/verify-public-github-readiness-v2.15.0.py
```

Both must pass from the exact files intended for publication. Then use:

```bash
python scripts/prepare-github-publication-v2.15.0.py --check
python scripts/prepare-github-publication-v2.15.0.py --target "PATH_TO_CLONE" --dry-run
```

The helper compares Git tree object IDs so line-ending conversion, missing files, or extra files are detected before push. `.gitattributes` disables text normalization for byte-stable publication across operating systems.

Immediately before the real branch push also inspect the staged/candidate release information manually for anything unexpected. A verifier cannot detect every possible piece of contextual student information.

## External state that must be rechecked later

GitHub Pages availability/pricing and Cloudflare Workers/Workers AI Free limits are external provider policies and can change. Recheck the current provider documentation immediately before deployment.
