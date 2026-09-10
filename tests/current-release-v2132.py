
from pathlib import Path
import re, json

r = Path(__file__).resolve().parents[1]
idx = (r/"index.html").read_text(encoding="utf-8")
app = (r/"assets/app.js").read_text(encoding="utf-8")
chat = (r/"assets/ai-helper-ui.js").read_text(encoding="utf-8")
helpui = (r/"assets/student-help-ui.js").read_text(encoding="utf-8")
css = (r/"assets/style.css").read_text(encoding="utf-8")

assert "Guided Student Flow v2.13.2" in idx
assert "RMS-INSTRUCTIONAL-BASELINE-v2.13.2" in app
assert "Research Chat" in chat
assert "Research Chat" in helpui
assert "Ask Research AI" not in chat
assert "Research AI" not in chat
assert "Ask AI" not in chat

# Persistent student orientation.
for token in ['id="routeBtn"', 'data-open-research-snapshot', 'id="helpMenuBtn"', 'id="moreMenuBtn"']:
    assert token in idx, token

# Chat remains separate and persistent.
assert "ai-helper-launcher" in css
assert "body:not(.project-active) .ai-helper-launcher{display:none!important}" not in css

# Teacher/operational controls remain hidden from ordinary student shell.
assert 'class="legacy-tool-hooks"' in idx
assert ".legacy-tool-hooks{display:none!important}" in css

# Current baseline/freeze manifests agree.
baseline = json.loads((r/"pilot/INSTRUCTIONAL_BASELINE_MANIFEST_v2.13.2.json").read_text(encoding="utf-8"))
freeze = json.loads((r/"pilot/v2.13.2/PILOT_FREEZE_MANIFEST_v2.13.2.json").read_text(encoding="utf-8"))
assert baseline["baseline_id"] == "RMS-INSTRUCTIONAL-BASELINE-v2.13.2"
assert freeze["student_facing_baseline"] == baseline["baseline_id"]
assert baseline["file_count"] == freeze["frozen_file_count"]

print("PASS v2.13.2 current release baseline, Research Chat naming, route, and student-shell integration")
