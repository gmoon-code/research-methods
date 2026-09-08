from pathlib import Path
import re,json
r=Path(__file__).resolve().parents[1]

adapter=(r/"assets/ai-adapter.js").read_text()
worker=(r/"assets/local-chat-worker.js").read_text()
chat=(r/"assets/local-chat.js").read_text()
policy=(r/"assets/local-chat-policy.js").read_text()
ui=(r/"assets/local-chat-ui.js").read_text()
cfg=(r/"assets/local-chat-config.js").read_text()
build=(r/"scripts/build-pages-v215.mjs").read_text()
deploy=(r/".github/workflows/deploy-pages-v215.yml").read_text()
ci=(r/".github/workflows/ci-v215.yml").read_text()
pkg=json.loads((r/"package.json").read_text())

idx=(r/"index.html").read_text() if (r/"index.html").exists() else ""
if idx:
    assert '<script src="./assets/ai-adapter.js"></script>' in idx
assert "local-chat-config.js" in adapter and "local-chat-ui.js" in adapter
assert "Cloud AI review is disabled" in adapter

for text,name in [(adapter,"adapter"),(worker,"worker"),(chat,"chat"),(policy,"policy"),(ui,"ui"),(cfg,"config")]:
    assert "api.openai.com" not in text,name
    assert "vercel" not in text.lower(),name
    assert not re.search(r"sk-[A-Za-z0-9_-]{20,}",text),name

assert "env.allowRemoteModels=false" in worker
assert "env.allowLocalModels=true" in worker
assert "../models/" in worker
assert "../vendor/transformers/wasm/" in worker
assert 'dtype:"q4"' in worker
assert 'device:candidate' in worker
assert '["webgpu","wasm"]' in worker

assert '"4.2.0"' in (r/"package.json").read_text()
assert "b8a5c0f183b78c55955a5364f610c36668b5e681" in cfg
assert "eb0d67c7e3b7d40f42d681b5f2eff4cef78968afe3f76c954f987dd870327a2a" in cfg
assert "eb0d67c7e3b7d40f42d681b5f2eff4cef78968afe3f76c954f987dd870327a2a" in build

assert "huggingface.co" in build
assert 'path.join(SITE,"models",MODEL.localId' in build
assert 'path.join(SITE,"vendor","transformers")' in build
assert "950*1024*1024" in build
assert "BUILD_MANIFEST_v2.15.json" in build

assert "actions/upload-pages-artifact@v4" in deploy
assert "actions/deploy-pages@v4" in deploy
assert "branches: [main]" in deploy
assert "npm run build:pages" in deploy
assert "v2.15-github-only-local-chat" in ci

for token in [
    "no API key","no per-message fee","first setup downloads about",
    "Small-model limitation","WebGPU","WebAssembly/CPU"
]:
    assert token.lower() in ui.lower(),token

for token in ["statistics_guard","source_integrity_guard","source_search_guard","authorship_guard","teacher_review_guard"]:
    assert token in policy,token

print("PASS v2.15 GitHub-only static architecture, pinned local model/runtime, same-origin inference assets, deployment, UX disclosure, and deterministic safeguards")
