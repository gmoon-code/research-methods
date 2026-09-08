
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
ui=(r/"assets/exemplar-ui.js").read_text()
data=json.loads((r/"assets/exemplar-projects-v2.7.json").read_text())
assert 'data-open-exemplar' in idx
for f in ["assets/exemplar-projects.js","assets/exemplar.js","assets/exemplar-ui.js"]:
    assert f in idx
assert "ExemplarUI.bind" in app
assert 'data-open-exemplar-stage="${s.id}"' in app
assert len(data["projects"])==1
ex=data["projects"][0]
assert len(ex["stages"])==18
assert ex["status"]=="synthetic_instructional_exemplar"
assert "Level 4" in ui
assert "No copy button is provided" in ui
assert "copy to my project" not in ui.lower()
assert "Apply exemplar" not in ui
assert (r/"examples/radish-salinity/COMPLETE_SYNTHETIC_EXEMPLAR_PAPER.md").exists()
assert (r/"examples/radish-salinity/SYNTHETIC_SEED_LEVEL_DATA.csv").exists()
assert (r/"examples/radish-salinity/SYNTHETIC_DISH_LEVEL_ANALYSIS_DATA.csv").exists()
print("PASS v2.7 exemplar static integration")
