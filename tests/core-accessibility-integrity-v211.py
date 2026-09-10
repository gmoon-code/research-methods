
from pathlib import Path
import hashlib,re
r=Path(__file__).resolve().parents[1]
ref=Path("/mnt/data/rms-v210-src")

core=[
"assets/coach.js","assets/methods.js","assets/analytics.js","assets/literature.js","assets/writing.js",
"assets/transfer.js","assets/competencies.js","assets/curriculum.js","assets/pathways.js","assets/path-coach.js",
"assets/rescue.js","assets/rescue-model.js","assets/novice-friction.js","assets/exemplar-projects.js",
"assets/exemplar.js","assets/exemplar-ui.js","assets/accessibility.js","prompts/stage_prompts_v1.2.json"
]
for rel in core:
    assert (ref/rel).exists(),rel
    assert hashlib.sha256((r/rel).read_bytes()).hexdigest()==hashlib.sha256((ref/rel).read_bytes()).hexdigest(),rel

idx=(r/"index.html").read_text()
css=(r/"assets/style.css").read_text()
assert 'class="skip-link"' in idx
assert "assets/accessibility.js" in idx
assert idx.index("assets/accessibility.js") < idx.index("assets/app.js")
for token in ["prefers-reduced-motion:reduce","forced-colors:active","min-height:44px","overflow-wrap:anywhere"]:
    assert token in css,token
print("PASS v2.11 inherited methodology/accessibility engine integrity")
