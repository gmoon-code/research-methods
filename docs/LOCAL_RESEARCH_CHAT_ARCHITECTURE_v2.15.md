# Research Chat v2.15 — GitHub-only local inference architecture

## Deployment boundary

Research Methods Studio v2.15 uses GitHub for the application deployment.

At runtime the student browser loads:

- the Research Methods Studio site from GitHub Pages
- the pinned Transformers.js browser runtime from the same GitHub Pages deployment
- one of two pinned SmolLM2 360M Instruct model variants from the same GitHub Pages deployment

The language model then runs inside the student's browser.

There is no cloud inference API, serverless function, API key, class AI credential, or per-message charge in this design.

## Why model binaries are added during the GitHub Actions build

The model binaries are too large to keep comfortably in ordinary Git source history. The source repository instead pins the model repository, exact model revision, exact binary sizes and SHA-256 hashes, Transformers.js version, and ONNX Runtime Web version.

GitHub Actions downloads those public open-source dependencies during the Pages build, verifies the model binaries, and places them in the `_site` artifact. Students then receive the model/runtime files from GitHub Pages itself.

## Runtime flow

1. Student opens Research Methods Studio.
2. Research Chat is visible, but model loading does not begin automatically.
3. Student opens Research Chat.
4. The interface explains the expected first download, device path, cost boundary, and small-model limitation.
5. Student explicitly chooses **Download and load Research Chat**.
6. A Web Worker loads the model so generation does not occupy the main UI thread.
7. When WebGPU is available, Research Chat tries the smaller q4f16 GPU variant first.
8. If that fails, it tries q4 on WebGPU and then q4 through WebAssembly/CPU.
9. Without WebGPU, q4 WebAssembly/CPU is used directly.
10. Browser caching is enabled for model/WASM resources when the browser supports it.
11. Questions and selected project context stay on the device during generation.

## Model and runtime pins

- model family — SmolLM2 360M Instruct
- ONNX repository — `onnx-community/SmolLM2-360M-Instruct-ONNX`
- pinned revision — `fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9`
- WebGPU preferred dtype — q4f16
- q4f16 size — 272,353,302 bytes
- q4f16 SHA-256 — `ce4a145ce32435411a296289d93b2c33334e6876ffba05373c9aa829c28e2026`
- WebAssembly/CPU fallback dtype — q4
- q4 size — 386,495,938 bytes
- q4 SHA-256 — `77b81bc8d2cb60c23a3399acba67dfa241d073764a4d1bdcce479747fb794aa6`
- Transformers.js — 4.2.0
- ONNX Runtime Web — `1.26.0-dev.20260416-b7804b056c`

The Pages build carries both model variants so one deployment supports GPU and CPU/WASM devices. A normal student browser downloads only the variant requested by its execution path.

## GitHub Pages size and bandwidth considerations

GitHub documents a 1 GB maximum for a published Pages site and a soft bandwidth limit of 100 GB per month. The build therefore fails above 900 MB to preserve headroom.

The first Research Chat load is intentionally opt-in. The interface advises preloading before class because the initial model download is approximately 280 MB on the preferred WebGPU path or approximately 400 MB on the q4 fallback path.

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

Raw analysis data are not included in the Research Chat prompt. Students can disable project context. Research Chat conversation history uses a separate browser-local key.

## Deterministic safeguards

The application intercepts several high-risk requests before the language model is called.

### Blank current research decision

A request for a completed answer is redirected toward a first student attempt.

### Inferential statistics

Requests to calculate inferential tests, correlations, p-values, confidence intervals, or effect sizes are redirected to the deterministic Data & Statistics Lab.

### Fabricated sources

Requests to invent studies, citations, references, articles, or DOIs are blocked.

### Live source finding

The local model has no internet search and is not allowed to pretend that it found or verified literature.

### Participant, privacy, and safety concerns

Questions that clearly raise human-participant, sensitive-information, or hazardous-procedure concerns receive a teacher-review boundary before generation.

## Reliability decision for model loading

Transformers.js 4.2.0 has had a reported browser issue involving repeated model downloads when `progress_callback` is active. v2.15 therefore does not use that callback during the large language-model load. The interface shows an indeterminate loading state instead of risking duplicate transfers of hundreds of megabytes.

## Important capability boundary

SmolLM2 360M Instruct is still a small local model. Its published model documentation warns that generated content can be factually inaccurate, logically inconsistent, or biased.

Appropriate use includes explaining terminology, clarifying a field, explaining why a research step exists, summarizing recorded project decisions, asking revision questions, and giving bounded feedback on an existing attempt.

Research Chat is not the authority for source verification, new statistical calculations, causal conclusions, ethics approval, hazardous procedures, autonomous research design, or final grading. The deterministic Studio tools and teacher review retain those roles.
