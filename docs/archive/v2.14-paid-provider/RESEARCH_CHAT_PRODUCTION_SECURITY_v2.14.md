# Research Chat v2.14.2 Security and Instructional Boundary

## Credential boundary

`OPENAI_API_KEY` belongs only in the server environment. It must never be placed in GitHub Pages, `runtime-config.js`, browser JavaScript, a student project file, a class-code prompt, an issue, or a repository secret example containing a real value.

The class Research Chat code is a separate shared application credential. It limits unauthenticated use of the public endpoint but is not equivalent to the OpenAI API key. It should be high entropy, at least 16 characters, and rotated if exposed.

## Endpoint boundary

The browser uses only the endpoint set by the owner in `assets/runtime-config.js`. Legacy browser-stored arbitrary AI endpoint settings are retired. The server itself calls the fixed official OpenAI Responses endpoint.

## Origin boundary

Production fails closed unless `RMS_ALLOWED_ORIGINS` contains at least one valid origin. Browser calls are accepted only when the `Origin` header exactly matches an allowed origin. Local HTTP origins are permitted only for localhost development.

## Data minimization

The browser performs an allowlist transformation before it sends project context. The server independently repeats the allowlist and redaction.

Automatically supplied context can include a limited research summary, current Stage, a non-sensitive focused field, recent Chat messages, and project literature records already marked `verified=true`. Raw dataset fields and identifier-like focused fields are excluded from automatic context.

Email-like and phone-like strings are redacted in the browser before transmission and again on the server. This is best effort. It cannot reliably identify every name, indirect identifier, sensitive circumstance, or identifying combination of facts. Students must still be instructed not to paste identifiable participant information or raw participant datasets into Chat.

## Context-off behavior

When project context is disabled, the browser sends a neutral Stage, empty focused field, empty project summary, and no project sources. This happens before JSON serialization and network transmission.

## Student authorship

Research Chat may explain concepts, diagnose reasoning, ask questions, give structures, and help students revise. It is instructed not to replace a student's completed graded work, invent data or sources, or claim work was completed when it was not.

Stage-specific help is tracked separately from generic explanation. Neutral context forces support accounting to zero on the server even if model output claims otherwise.

## Source integrity

Project-source citations are restricted to literature records supplied in the minimized project context with `verified=true`. That flag is a project-workflow status from the application. It is not independent external bibliographic authentication.

After generation, the server checks every source ID against the supplied verified set. Unknown IDs cause the answer to be discarded and replaced with source-verification guidance. The server also rejects conventional inline citation patterns, URLs, DOI strings, and bracketed source references in model prose so a source cannot bypass the structured citation channel.

## Statistics boundary

Research Chat may explain analysis choices and interpretation principles. It is instructed not to generate new inferential statistics, p-values, effects, confidence intervals, or causal claims unsupported by the supplied project record. Numerical analysis of raw data belongs in the application's Data & Statistics tools.

## OpenAI request boundary

The server uses the OpenAI Responses API with

- `store: false`
- strict JSON Schema Structured Outputs
- low reasoning effort
- low text verbosity
- a bounded output-token budget
- a pseudonymous 64-character `safety_identifier`
- a server-selected model from the tested allowlist

The tested model allowlist is `gpt-5.6-terra`, `gpt-5.6-luna`, `gpt-5.6-sol`, and `gpt-5.6`. An unsupported value fails closed.

`store: false` prevents application-requested response storage through the Responses API. It should not be described as a blanket promise of zero provider-side retention under every account or policy condition. Current provider data-control terms and school requirements must be reviewed before classroom GO.

## Request and error boundary

The endpoint enforces request-size limits while reading the stream, requires JSON for POST requests, caps history/context/output sizes, uses a shorter OpenAI timeout than the Vercel function maximum duration, and returns sanitized errors. Provider response bodies, API keys, and raw student text are not intentionally returned through error responses or application logs.

## Rate limiting and cost control

A serverless in-memory counter is not a reliable distributed rate limiter. The included Cloudflare Worker therefore uses Cloudflare Rate Limiting bindings for three separate controls: wrong-code attempts, authenticated sessions, and class-wide traffic. The Worker fails closed if those bindings are absent. Cloudflare describes these counters as permissive/eventually consistent, so they are an abuse-control boundary rather than exact accounting.

If Vercel or another provider is used, configure an equivalent durable platform/shared rate limit before classroom GO. In every deployment, also configure an OpenAI project budget or usage alert. The class code, exact-origin policy, request limits, rate limits, and output cap work together; no single control should be treated as sufficient by itself.
