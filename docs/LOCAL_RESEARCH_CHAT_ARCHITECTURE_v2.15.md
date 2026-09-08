# Research Chat v2.15 — GitHub-only local inference architecture

## Deployment boundary

Research Methods Studio v2.15 uses GitHub for the application deployment.

At runtime the student browser loads:

- the Research Methods Studio site from GitHub Pages
- the pinned Transformers.js browser runtime from the same GitHub Pages deployment
- the pinned SmolLM2 135M Instruct q4 model from the same GitHub Pages deployment

The language model then runs inside the student's browser.

There is no cloud inference API, serverless function, API key, class AI credential, or per-message charge in this design.

## Why the model is added during the GitHub Actions build

The q4 ONNX model is roughly 181 MB. Keeping that binary in the ordinary Git source history would make the repository unnecessarily large.

The source repository instead pins:

- model repository
- exact model revision
- exact q4 model SHA-256
- exact Transformers.js version

The GitHub Pages build downloads those pinned open-source dependencies, verifies the model hash, and places them in the `_site` deployment artifact. Students therefore receive the runtime model files from GitHub Pages, even though those third-party sources are retrieved during the GitHub Actions build.

## Runtime flow

1. Student opens Research Methods Studio.
2. Research Chat is visible but the model is not downloaded automatically.
3. Student opens Research Chat.
4. The interface explains the approximate first download, device path, cost boundary, and small-model limitation.
5. Student explicitly chooses **Download and load Research Chat**.
6. A Web Worker loads the local model.
7. WebGPU is tried first when available.
8. WebAssembly/CPU is used as the fallback.
9. The browser caches fetched model files when the browser Cache API permits it.
10. Questions and selected project context are sent only to the Web Worker for local generation.

## Model

- model family — SmolLM2 135M Instruct
- ONNX repository — `onnx-community/SmolLM2-135M-Instruct-ONNX`
- pinned revision — `b8a5c0f183b78c55955a5364f610c36668b5e681`
- quantization — q4
- q4 model SHA-256 — `eb0d67c7e3b7d40f42d681b5f2eff4cef78968afe3f76c954f987dd870327a2a`
- Transformers.js — 4.2.0

## Student-data boundary

Research Chat reads the saved Research Methods Studio project from browser local storage.

The minimized context includes selected decisions such as:

- current Stage
- currently focused research field
- research question
- design
- claim boundary
- predictor/exposure
- outcome
- independent unit
- population/sample
- analysis decision
- main result
- a limited number of literature extraction notes

Raw analysis data are not included in the Research Chat prompt.

Students can disable project context.

Research Chat conversation history uses a separate browser-local key so the older project-save engine cannot overwrite it.

## Deterministic safeguards

The application intercepts several high-risk requests before the small language model is called.

### Blank current research decision

A request for the complete answer is redirected toward a first student attempt.

### Inferential statistics

Research Chat does not become a second calculation engine. Requests to calculate tests, correlations, p-values, confidence intervals, or effect sizes are redirected to the deterministic Data & Statistics Lab.

### Fabricated sources

Requests to invent studies, citations, articles, references, or DOIs are blocked.

### Live source finding

The local model has no internet search. When no source record exists, it cannot claim to find or verify literature.

### Participant, privacy, and safety concerns

Questions that clearly raise human-participant, sensitive-information, or hazardous-procedure concerns receive a teacher-review message before model generation.

## Important capability boundary

SmolLM2 135M Instruct is a small local model. It can make factual or logical mistakes.

Appropriate use:

- explain terminology
- clarify what a field asks
- explain why a research step exists
- summarize recorded project decisions
- ask revision questions
- give bounded feedback on an existing attempt
- distinguish common research concepts

Do not treat Research Chat as the authority for:

- source verification
- new statistical calculations
- causal conclusions
- ethics approval
- hazardous procedures
- autonomous research design
- final grading

The deterministic Studio tools and teacher review retain those roles.
