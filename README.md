# Research Methods Studio v2.15 — GitHub-only Local Research Chat

Research Methods Studio is a static GitHub Pages teaching application that scaffolds secondary students through a complete research process while preserving student reasoning and authorship.

## Current deployment architecture

v2.15 is designed for **GitHub only**.

- source code lives in this GitHub repository
- GitHub Actions builds the site
- GitHub Pages serves the application
- Research Chat runs an open-source language model inside the student's browser
- there is no Vercel or other runtime backend
- there is no OpenAI/provider API key
- there is no per-message inference charge

The Pages build downloads the pinned open-source model/runtime during GitHub Actions, verifies the model binaries, and includes them in the published Pages artifact. Student browsers then load those files from the GitHub Pages site itself.

## Research Chat

Research Chat is a local assistive tool for:

- explaining research terminology
- clarifying what a Stage or field asks
- explaining why a research step exists
- summarizing recorded project decisions
- asking revision questions
- giving bounded feedback on an existing attempt

It is deliberately **not** the authoritative engine for new statistical calculations, source verification, ethics approval, causal conclusions, hazardous procedures, or final grading.

Before the local model is called, deterministic application logic intercepts requests to:

- complete a blank current research decision for the student
- calculate new inferential statistics
- invent studies, citations, articles, references, or DOIs
- pretend to search for or verify literature
- proceed through clear human-participant/privacy/safety concerns without teacher review

## Local model

Research Chat currently pins:

- SmolLM2 360M Instruct
- ONNX repository `onnx-community/SmolLM2-360M-Instruct-ONNX`
- revision `fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9`
- q4f16 for the preferred WebGPU path
- q4 for WebGPU/WASM fallback
- Transformers.js 4.2.0
- ONNX Runtime Web `1.26.0-dev.20260416-b7804b056c`

The first Research Chat load is intentionally user-initiated because the model download is large. The UI estimates about 280 MB on the preferred WebGPU path and about 400 MB for the q4 fallback path. Preload on classroom devices before the lesson when possible.

## Student project

The existing application provides the 18-stage research workflow, including literature, methods, data/statistics, writing, transfer, competency, and pilot-support systems from the current GitHub baseline.

The local Research Chat reads a minimized subset of the browser-saved project only when the student keeps **Use my current research-project context** enabled. Raw analysis data are excluded from the chat prompt.

## Deployment

The production workflow is:

1. merge a validated branch into `main`
2. GitHub Actions runs the Research Chat tests
3. the Pages build downloads and verifies the pinned model files
4. the build vendors the exact browser inference runtime
5. the build fails if the published artifact exceeds the release size guard
6. the official GitHub Pages deployment action publishes `_site`

See:

- `docs/LOCAL_RESEARCH_CHAT_ARCHITECTURE_v2.15.md`
- `docs/THIRD_PARTY_NOTICES_v2.15.md`
- `docs/V2_15_MIGRATION_NOTE.md`

## Important migration boundary

The current GitHub `main` branch is the stable source baseline for this v2.15 branch. A later guided-flow UI package created in a previous local development runtime is not fully present in GitHub today. v2.15 does not pretend otherwise. See the migration note before merging or doing further UI integration.

## Release gate

The `v2.15-github-only-local-chat` branch and its draft pull request are the validation branch. Do not merge solely to test the model architecture. Merge only after the GitHub CI Pages build passes and the built artifact is reviewed.
