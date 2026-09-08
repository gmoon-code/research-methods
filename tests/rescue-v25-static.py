
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
gui=(r/"assets/student-guidance-ui.js").read_text()
model=json.loads((r/"assets/rescue-model-v2.5.json").read_text())
assert len(model["fields"])==113
for k,v in model["fields"].items():
    assert set(v["levels"])=={"1","2","3","4","5"}
    assert v["levels"]["5"]["frame"]
assert 'data-open-rescue-navigator="0"' in idx
assert "Progressive help" in app
assert "Rescue.maxFieldLevel" in app
assert "RescueUI.bind" in app
assert 'data-rescue-lab=' in gui
assert "blank_when_help_requested" in (r/"assets/rescue.js").read_text()
assert "applyFieldRevision" in (r/"assets/rescue.js").read_text()
print("PASS v2.5 rescue static integration")
