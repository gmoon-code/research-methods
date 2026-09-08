
from pathlib import Path
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
data=(r/"assets/data-lab-ui.js").read_text()
writing=(r/"assets/writing-lab-ui.js").read_text()
assert "student-guidance.js" in idx and "student-guidance-ui.js" in idx
assert 'id="studentGuideBtn"' in idx and 'id="glossaryBtn"' in idx
assert "Guide.stagePanel" in app and "Guide.fieldHelp" in app
assert 'Guide.labPanel("literature",active)' in app
assert 'Guide.labPanel("methods",active)' in app
assert 'G.labPanel("data",active)' in data
assert 'G.labPanel("writing",active)' in writing
assert "What do the data types mean?" in app
assert "Read this before choosing an option" in app
print("PASS guidance integration")
