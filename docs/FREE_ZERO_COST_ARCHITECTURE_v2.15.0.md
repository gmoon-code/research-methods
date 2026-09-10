# Research Methods Studio v2.15.0 FREE architecture

## Release objective

v2.15.0 removes the paid model-API requirement from Research Chat. The static application remains suitable for GitHub Pages. Research Chat uses Cloudflare Workers AI through a Worker binding and requires no OpenAI API key or other third-party model credential.

## Zero-cost boundary

To keep the hosted system at $0:

1. Host the static website on GitHub Pages.
2. Use a Cloudflare Workers **Free** account for the Research Chat Worker.
3. Do not upgrade the Workers plan.
4. Do not enable prepaid AI Gateway billing or other paid AI billing.
5. Keep the v2.15.0 model lock at `@cf/meta/llama-3.3-70b-instruct-fp8-fast` unless a later release revalidates another model.

Cloudflare currently documents 10,000 Workers AI Neurons per day at no charge. On Workers Free, use beyond the free allocation fails rather than producing overage charges. The package converts quota/capacity failures into a temporary Chat-unavailable message; the 18-stage application remains usable.

This package cannot inspect a future Cloudflare account's billing plan offline. The deployment helper therefore requires an explicit confirmation that the owner intends to remain on Workers Free with no prepaid AI billing.

## Model choice

The release model is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

It was selected because the current Cloudflare documentation lists the model as active and its JSON Mode documentation explicitly lists it among supported models. JSON Mode is required by this application because the server validates a structured response before anything reaches the student UI.

The model allowlist contains exactly this identifier. Changing `RMS_AI_MODEL` to another model makes health fail closed.

## What remains browser-local

The research route, Stage work, Snapshot, Labs, local guidance, Word export, JSON recovery, and notebook state remain browser-local unless Chat is deliberately used.

When Chat is used, the browser sends the student's question, bounded recent Chat history, current Stage/focused field, a small allowlist of project summary fields, and literature records already marked `verified=true` in the project. Raw dataset fields are blocked from automatic context. Obvious email and phone patterns are redacted before transmission and again in the server core.

## Provider boundary

There is no OpenAI API call in the v2.15.0 executable Research Chat path. The Worker calls `env.AI.run()` through the Cloudflare Workers AI binding.

The browser accepts only a clean HTTPS `*.workers.dev/` production endpoint for this free edition. There is no same-origin Vercel fallback and no browser-editable backend address.

## Hosted status

Offline verification does not prove the future hosted service. Research Chat remains **NOT YET GO** until a real Cloudflare Free Worker is deployed and the included authenticated smoke test succeeds.
