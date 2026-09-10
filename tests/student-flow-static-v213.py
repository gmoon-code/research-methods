
from pathlib import Path
import re,hashlib
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
css=(r/"assets/style.css").read_text()
pathui=(r/"assets/pathway-ui.js").read_text()
helpui=(r/"assets/student-help-ui.js").read_text()
data=(r/"assets/data-lab-ui.js").read_text()
writing=(r/"assets/writing-lab-ui.js").read_text()

# Student shell retains orientation and accumulated-work access.
for token in ["id=\"routeBtn\"","data-open-research-snapshot","id=\"helpMenuBtn\"","id=\"moreMenuBtn\"","id=\"saveStatus\""]:
    assert token in idx,token
assert "legacy-tool-hooks" in idx
assert "Teacher Dashboard" in idx # hidden compatibility hook still exists
assert ".legacy-tool-hooks{display:none!important}" in css

# New modules load in safe order.
scripts=re.findall(r'<script src="\./([^"]+)"',idx)
for x in ["assets/student-flow.js","assets/student-flow-ui.js","assets/student-help-ui.js","assets/accessibility.js","assets/app.js"]:
    assert x in scripts,x
assert scripts.index("assets/student-flow.js") < scripts.index("assets/student-flow-ui.js") < scripts.index("assets/app.js")
assert scripts.index("assets/student-help-ui.js") < scripts.index("assets/app.js")
assert scripts.index("assets/accessibility.js") < scripts.index("assets/app.js")

# Main stage workflow.
for token in ["FROM EARLIER","NOW","NEXT","Start this stage","Check this stage","Ready to continue","Continue to Stage","stage-section-outline","current-form-section"]:
    assert token in app,token
assert "Flow.canWorkStage(project,stageId)" in app # Snapshot cannot bypass future-stage soft gate.
assert "Saved on this browser" in app
assert "Download backup and start new" in app

# Student checks do not display a numeric grade-like score.
assert "coach-score" not in app
assert 'class="coach-score"' not in app
assert "This is guidance for revision, not a grade." in app

# Research path is recommendation-first.
assert "Recommended from your current question" in pathui
assert "Compare other possible research paths" in pathui
assert "Write your working research question first" in pathui

# Help is consolidated.
for token in ["What is this asking me to do?","Help me get unstuck","Look up a research term","Ask Research AI"]:
    assert token in helpui,token

# Labs use sequential route controls instead of simultaneous tab strips.
assert "labStepper" in app and "labStepper" in data and "labStepper" in writing
for selector in [".lit-tabs",".methods-tabs",".data-tabs",".writing-tabs"]:
    assert selector in css

# Data import has explicit browser-storage guard.
assert "1500000" in data
assert "could not be saved in this browser" in data

print("PASS v2.13 student-shell, progressive-disclosure, route, help, lab, and storage static integration")
