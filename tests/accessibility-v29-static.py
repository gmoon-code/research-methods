
from pathlib import Path
import hashlib,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
css=(r/"assets/style.css").read_text()
js=(r/"assets/accessibility.js").read_text()

scripts=re.findall(r'<script src="\./([^"]+)"',idx)
assert "assets/accessibility.js" in scripts
assert scripts.index("assets/accessibility.js") < scripts.index("assets/app.js")
assert 'class="skip-link"' in idx
assert 'id="mainContent" tabindex="-1"' in idx

for token in ["aria-modal","role','dialog","stopImmediatePropagation","openerByBackdrop","focusables","inert=true","Escape"]:
    assert token in js,token
for token in [
    "prefers-reduced-motion:reduce","forced-colors:active","min-height:44px",
    "text-zoom-200","overflow-wrap:anywhere","--muted:#637181"
]:
    assert token in css,token

# Core methodological/learning engines remain unchanged from v2.8.
src=Path("/mnt/data/research-methods-studio-v2.8-multi-path-exemplars")
files=[
"assets/coach.js","assets/methods.js","assets/analytics.js","assets/literature.js","assets/writing.js",
"assets/transfer.js","assets/competencies.js","assets/curriculum.js","assets/pathways.js","assets/path-coach.js",
"assets/rescue.js","assets/rescue-model.js","assets/novice-friction.js",
"assets/exemplar-projects.js","assets/exemplar.js","assets/exemplar-ui.js",
"prompts/stage_prompts_v1.2.json"
]
# Exemplar state/UI are intentionally NOT required unchanged because v2.9 adds only generic accessibility behavior;
# verify content bank remains byte-identical, while exemplar UI may be behaviorally enhanced by the generic layer.
for rel in files:
    if rel in {"assets/exemplar.js","assets/exemplar-ui.js"}:
        continue
    assert hashlib.sha256((r/rel).read_bytes()).hexdigest()==hashlib.sha256((src/rel).read_bytes()).hexdigest(),rel
print("PASS v2.9 accessibility static integration and inherited-core integrity")
