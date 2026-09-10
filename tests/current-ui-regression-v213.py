
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text(encoding="utf-8")
app=(r/"assets/app.js").read_text(encoding="utf-8")
flow=(r/"assets/student-flow.js").read_text(encoding="utf-8")
flowui=(r/"assets/student-flow-ui.js").read_text(encoding="utf-8")
helpui=(r/"assets/student-help-ui.js").read_text(encoding="utf-8")
pathui=(r/"assets/pathway-ui.js").read_text(encoding="utf-8")
rescue=(r/"assets/rescue-ui.js").read_text(encoding="utf-8")
guide=(r/"assets/student-guidance-ui.js").read_text(encoding="utf-8")
snap=(r/"assets/research-snapshot-ui.js").read_text(encoding="utf-8")
exui=(r/"assets/exemplar-ui.js").read_text(encoding="utf-8")
model=json.loads((r/"assets/response-examples-v2.11.json").read_text(encoding="utf-8"))

# The full research route and current accumulated work remain first-class.
for token in ['id="routeBtn"','data-open-research-snapshot','id="helpMenuBtn"','id="moreMenuBtn"']:
    assert token in idx,token
for token in ["My Research Route","Needs review after an earlier change","Coming later","Done for now"]:
    assert token in flowui,token
assert "stage-context-compact" in app
assert "FROM EARLIER" in app and "NOW" in app and "NEXT" in app

# Guidance was consolidated, not removed.
assert model["field_count"]==113 and len(model["fields"])==113
for token in ["Too vague","Good working response","Help me get unstuck","Look up a research term","Research Chat"]:
    assert token in helpui,token
assert "What are you stuck on?" in rescue
assert "Search for the word that is stopping you." in guide

# Pathway decision support is recommendation-first with alternatives disclosed later.
for token in ["Recommended from your current question type","Use this research path","Compare other possible research paths","I am still deciding"]:
    assert token in pathui,token

# Exemplars remain available contextually even though the global exemplar button is hidden.
assert 'data-open-exemplar-stage="${s.id}"' in app
assert "openStage" in exui or "stage" in exui.lower()

# Snapshot remains a full accumulated-work view and preserves migration/cross-path history.
for token in ["At-a-glance research chain","Earlier or cross-path responses","Earlier duplicate versions preserved during upgrade"]:
    assert token in snap,token

# Old global tool hooks are preserved for compatibility but hidden from student mode.
assert "legacy-tool-hooks" in idx
assert "Teacher Dashboard" in idx
assert "Teacher/setup tools are hidden in student mode" in flowui

# Student-facing diagnostic review no longer renders a percentage-like coach score.
assert 'class="coach-score"' not in app
assert "This is guidance for revision, not a grade." in app

assert "Ask Research AI" not in helpui and "Ask Research AI" not in flowui
assert "AI settings" not in flowui
assert "id=\"aiEndpoint\"" not in app and "id=\"aiChatEndpoint\"" not in app
assert "assets/runtime-config.js" in app and "Class Chat code for this browser session" in app
print("PASS v2.14.2 current route/help/pathway/exemplar/snapshot/Chat student-UI regression")
