
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text(encoding="utf-8")
app=(r/"assets/app.js").read_text(encoding="utf-8")
flow=(r/"assets/student-flow-ui.js").read_text(encoding="utf-8")
word=(r/"assets/word-export.js").read_text(encoding="utf-8")

assert "Guided Student Flow v2.13.3" in idx
assert "RMS-INSTRUCTIONAL-BASELINE-v2.13.3" in app
assert '<script src="./assets/word-export.js"></script>' in idx
assert "Download Word notebook" in flow
assert "application/msword" in word
assert "research-notebook.doc" in app
assert "research-notebook.md" not in app

for rel in ["app.js","data-lab-ui.js","competency-ui.js","research-snapshot-ui.js","writing-lab-ui.js","student-flow-ui.js"]:
    text=(r/"assets"/rel).read_text(encoding="utf-8")
    assert "text/markdown" not in text, rel

baseline=json.loads((r/"pilot/INSTRUCTIONAL_BASELINE_MANIFEST_v2.13.3.json").read_text())
freeze=json.loads((r/"pilot/v2.13.3/PILOT_FREEZE_MANIFEST_v2.13.3.json").read_text())
assert baseline["baseline_id"]=="RMS-INSTRUCTIONAL-BASELINE-v2.13.3"
assert freeze["student_facing_baseline"]==baseline["baseline_id"]
assert baseline["file_count"]==freeze["frozen_file_count"]

print("PASS v2.13.3 Word .doc export, baseline, and student-shell integration")
