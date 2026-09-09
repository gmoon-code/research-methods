# v2.14 release gate

Branch: `release/v2.14-live-research-chat`

Status: **NOT YET GO**

Run `npm test` before review. After merge, `.github/workflows/deploy-v214.yml` requires all five production secrets, verifies the secure Research Chat backend with authenticated smoke tests, and only then deploys the privacy-minimized GitHub Pages artifact.

See `docs/RELEASE_v2.14.md` for the complete acceptance checklist.
