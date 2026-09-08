# Third-party notices — v2.15 Research Chat

## Transformers.js

Research Chat uses `@huggingface/transformers` version 4.2.0.

Project: https://github.com/huggingface/transformers.js

License: Apache License 2.0.

The GitHub Pages build copies the browser bundle and required ONNX Runtime WebAssembly files into the published site.

## SmolLM2 135M Instruct

Base model: `HuggingFaceTB/SmolLM2-135M-Instruct`

ONNX conversion used by the Pages build: `onnx-community/SmolLM2-135M-Instruct-ONNX`

License: Apache License 2.0.

Pinned ONNX revision:

`b8a5c0f183b78c55955a5364f610c36668b5e681`

Pinned q4 model SHA-256:

`eb0d67c7e3b7d40f42d681b5f2eff4cef78968afe3f76c954f987dd870327a2a`

The model's published limitations state that it primarily understands and generates English and can produce inaccurate, inconsistent, or biased output. Research Methods Studio therefore presents it as an assistive explanation tool and uses deterministic guards for consequential workflow decisions.
