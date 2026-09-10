
from pathlib import Path
import re,hashlib
r=Path(__file__).resolve().parents[1]
ref=Path("/mnt/data/research-methods-studio-v2.12-persistent-ai-research-helper")
idx=(r/"index.html").read_text(encoding="utf-8")
css=(r/"assets/style.css").read_text(encoding="utf-8")
js=(r/"assets/accessibility.js").read_text(encoding="utf-8")

scripts=re.findall(r'<script src="\./([^"]+)"',idx)
assert "assets/accessibility.js" in scripts and "assets/app.js" in scripts
assert scripts.index("assets/accessibility.js") < scripts.index("assets/app.js")
assert 'class="skip-link"' in idx
assert 'id="mainContent" tabindex="-1"' in idx

for token in ["aria-modal","stopImmediatePropagation","openerByBackdrop","focusables","inert=true","Escape"]:
    assert token in js,token
for token in ["prefers-reduced-motion:reduce","forced-colors:active","min-height:44px","overflow-wrap:anywhere"]:
    assert token in css,token

# The accessibility engine itself was not rewritten by the v2.13 UX pass.
assert hashlib.sha256((r/"assets/accessibility.js").read_bytes()).hexdigest()==hashlib.sha256((ref/"assets/accessibility.js").read_bytes()).hexdigest()
print("PASS v2.13 accessibility static integration and inherited accessibility engine")
