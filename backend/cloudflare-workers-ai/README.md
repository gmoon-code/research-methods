# Research Chat FREE backend

This Worker is the zero-cost Research Chat backend for Research Methods Studio v2.15.0.

It uses Cloudflare Workers AI through the `AI` binding. It does **not** use an OpenAI API key and does not call a paid third-party model API.

The only secret is `RMS_CHAT_ACCESS_CODE`. Never commit the real class code to GitHub, screenshots, issues, browser JavaScript, or `assets/runtime-config.js`.

The model is deliberately fixed to `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. The v2.15.0 release gate uses this model because Cloudflare currently documents it as available on Workers AI and supporting JSON Mode. A model change requires a new quality/security verification pass.

To keep the deployment genuinely zero-cost, use a **Cloudflare Workers Free** account and do not upgrade the Workers plan or configure prepaid AI Gateway billing. Cloudflare currently provides 10,000 Workers AI Neurons per day free. On Workers Free, requests beyond that allocation fail until the daily reset instead of creating overage charges.

From the repository root, run:

```bash
npm run check:cloudflare
npm run deploy:cloudflare
```

The deployment helper asks only for the class code. No AI API key is required.
