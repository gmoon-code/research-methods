
from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text(encoding="utf-8")
app=(r/"assets/app.js").read_text(encoding="utf-8")
css=(r/"assets/style.css").read_text(encoding="utf-8")

assert "v2.13 Guided Student Flow" in idx
assert 'RMS-INSTRUCTIONAL-BASELINE-v2.13' in app
assert 'RMS-INSTRUCTIONAL-BASELINE-v2.4' not in app
assert 'class="legacy-tool-hooks"' in idx
assert ".legacy-tool-hooks{display:none!important}" in css
assert "body:not(.project-active) .ai-helper-launcher{display:none!important}" in css
assert "Saved on this browser" in app
assert "Ready to continue" in app
assert "Needs review after an earlier change" in (r/"assets/student-flow-ui.js").read_text(encoding="utf-8")
print("PASS v2.13 baseline/UI identifiers and student-facing shell")
