# Start Here — Research Methods Studio v2.15.0 FREE

This is the current publication/deployment entry point. Do not use older deployment instructions from `docs/archive/`.

## 1. Current state

The complete 18-stage website is offline-verified. Research Chat is intentionally disconnected because `assets/runtime-config.js` contains a blank endpoint.

This means you can inspect and test the website without creating a Cloudflare account and without exposing any credential.

## 2. Verify the package before publication

From the repository root, with Node.js 20+ and Python 3 installed:

```bash
python scripts/verify-complete-release-v2.15.0.py
python scripts/verify-public-github-readiness-v2.15.0.py
```

Both commands must pass before a GitHub publication is treated as release-ready.

## 3. Future GitHub publication

The first remote step is deliberately **not** a direct upload to `main`. Publish the exact frozen release to the review branch first:

`release/v2.15.0-free-public`

From the extracted release, run the publication helper against a clean local clone of `gmoon-code/research-methods`:

```bash
python scripts/prepare-github-publication-v2.15.0.py --check
python scripts/prepare-github-publication-v2.15.0.py \
  --target "PATH_TO_YOUR_CLONED_RESEARCH_METHODS_REPO" \
  --dry-run
```

Only after the dry run passes should the same command be run without `--dry-run`. The helper pushes only `release/v2.15.0-free-public`, verifies the remote Git tree, and proves that remote `main` did not move. It does not enable GitHub Pages or merge anything. Normal publication does not rerun the release-engineering browser suite, so Git and Python are sufficient for this branch-publication step.

Use `docs/GITHUB_PUBLICATION_HANDOFF_v2.15.0.md` for the exact procedure.

After that remote branch has been reviewed and verified, a separate later gate can merge the exact release to `main` and configure GitHub Pages from `main` and `/ (root)`.

The site is designed to work as a project page such as:

`https://YOUR-USERNAME.github.io/research-methods/`

All page assets are referenced relatively so the repository-name path prefix is preserved.

## 4. Student data before Chat is enabled

The research notebook is stored in browser `localStorage`. Students should download JSON backups regularly. Word `.doc` export provides a readable copy but is not a full recovery backup.

Browser storage can be cleared, so backup practice is part of normal use.

## 5. Research Chat remains optional

Publishing the static site does **not** activate Chat. The checked-in runtime configuration is intentionally blank.

Later, if you want Chat:

1. keep the static site on GitHub Pages
2. create a Cloudflare Workers **Free** deployment
3. deploy `backend/cloudflare-workers-ai/worker.mjs` through the provided helper
4. store only `RMS_CHAT_ACCESS_CODE` as a Worker secret
5. configure the resulting clean `https://...workers.dev/` endpoint locally
6. run the production smoke test
7. complete every item in `docs/PRODUCTION_ACCEPTANCE_CHECKLIST_v2.15.0.md`

Use `docs/CLOUDFLARE_FREE_DEPLOYMENT_v2.15.0.md` for the exact procedure.

## 6. Privacy when Chat is later enabled

The browser sends the student's question and recent Chat history. Project context is included only when **Use my current project context** is enabled.

Before network transmission, the browser excludes raw dataset fields and obvious identifying fields. The Worker repeats server-side minimization. The class code stays outside the project JSON and is stored only for the browser session.

Research Chat is a support tool. It does not replace the student's paper, invent data, or treat unverified project sources as verified citations.

## 7. Zero-cost boundary

The v2.15.0 executable Chat path uses Cloudflare Workers AI and no paid model API key. To keep the hosted configuration at $0, remain on Workers Free and do not enable Workers Paid or prepaid AI Gateway billing.

Provider pricing and model availability can change. Recheck Cloudflare's current Workers AI pricing/model documentation immediately before deployment.

## 8. What belongs in the public repository

Safe to publish:

- static application files
- current Cloudflare Worker source
- tests and QA records
- generic synthetic exemplar/pilot data
- `.env.example` with blank secret values
- deployment documentation

Never publish:

- a real `RMS_CHAT_ACCESS_CODE`
- `.env` or `.dev.vars`
- Wrangler local state
- `node_modules`
- student project backups or exported student work
- real participant/student datasets
- screenshots containing student information
- Cloudflare credentials or tokens

See `SECURITY.md` and `docs/PUBLIC_GITHUB_READINESS_v2.15.0.md`.
