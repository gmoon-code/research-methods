# Third-party notices — v2.15 Research Chat

## Transformers.js

Research Chat uses `@huggingface/transformers` version 4.2.0.

Project: https://github.com/huggingface/transformers.js

License: Apache License 2.0.

The GitHub Pages build copies the browser bundle and the pinned ONNX Runtime WebAssembly files into the published site.

## ONNX Runtime Web

Research Chat pins `onnxruntime-web` version `1.26.0-dev.20260416-b7804b056c`, matching the runtime used by Transformers.js 4.2.0.

Project: https://github.com/microsoft/onnxruntime

License: MIT.

## SmolLM2 360M Instruct

Base model: `HuggingFaceTB/SmolLM2-360M-Instruct`

ONNX conversion used by the Pages build: `onnx-community/SmolLM2-360M-Instruct-ONNX`

License: Apache License 2.0.

Pinned ONNX revision:

`fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9`

Pinned q4f16 WebGPU model:

- size — 272,353,302 bytes
- SHA-256 — `ce4a145ce32435411a296289d93b2c33334e6876ffba05373c9aa829c28e2026`

Pinned q4 fallback model:

- size — 386,495,938 bytes
- SHA-256 — `77b81bc8d2cb60c23a3399acba67dfa241d073764a4d1bdcce479747fb794aa6`

The model's published limitations state that it primarily understands and generates English and can produce inaccurate, inconsistent, or biased output. Research Methods Studio therefore presents it as an assistive explanation tool and uses deterministic guards for consequential workflow decisions.
