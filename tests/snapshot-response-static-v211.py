
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
ui=(r/"assets/student-guidance-ui.js").read_text()
snap=(r/"assets/research-snapshot-ui.js").read_text()
model=json.loads((r/"assets/response-examples-v2.11.json").read_text())

assert model["field_count"]==113
assert len(model["fields"])==113
assert 'data-open-research-snapshot' in idx
assert "My Research Snapshot" in idx
assert "assets/research-snapshot.js" in idx
assert "assets/research-snapshot-ui.js" in idx
assert "assets/response-examples.js" in idx
assert idx.index("assets/response-examples.js") < idx.index("assets/student-guidance-ui.js")
assert idx.index("assets/research-snapshot.js") < idx.index("assets/app.js")
assert "SnapshotUI.bind" in app
assert "Guide.responseCue" in app
assert "Guide.updateResponseCount" in app
assert "current-context-strip" in app
assert "Typical working response" in ui
assert "Too vague" in ui
assert "Good working response" in ui
assert "How much should I write?" in ui
assert "Earlier or cross-path responses" in snap
assert "Source records" in snap
assert "Structured Methods Lab records" in snap
assert "Writing Lab drafts" in snap
print("PASS v2.11 snapshot/response-example static integration")
