
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
model=json.loads((r/"assets/pathway-model-v2.3.json").read_text())
assert 'id="pathwayBtn"' in idx
for f in ["pathway-model.js","pathways.js","pathway-ui.js"]:
    assert f in idx
assert "Paths.shouldShowField" in app
assert "Paths.label" in app
assert "PathUI.stageBanner" in app
assert "Show fields usually not needed for this path" in (r/"assets/pathway-ui.js").read_text()
assert len(model["paths"])==9
assert set(["qualitative","literature_review","experimental","observational","meta_analysis"]).issubset(model["field_modes"])
# Critical novice-load checks
assert model["field_modes"]["qualitative"]["researchHyp"]=="hide"
assert model["field_modes"]["qualitative"]["primaryEstimand"]=="hide"
assert model["field_modes"]["literature_review"]["researchHyp"]=="hide"
assert model["field_modes"]["literature_review"]["predictorIV"]=="hide"
assert model["field_modes"]["experimental"]["predictorIV"]=="core"
assert model["field_modes"]["observational"]["controlCondition"]=="hide"
print("PASS v2.3 pathway static integration")
