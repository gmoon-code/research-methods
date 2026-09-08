
from pathlib import Path
import json,re
r=Path(__file__).resolve().parents[1]
bank=json.loads((r/"assets/exemplar-projects-v2.8.json").read_text())
assert len(bank["projects"])==8
assert sum(len(x["stages"]) for x in bank["projects"])==144
paths={x["path"] for x in bank["projects"]}
expected={"descriptive_quantitative","observational","experimental","quasi_experimental","qualitative","literature_review","meta_analysis","mixed_methods"}
assert paths==expected
ui=(r/"assets/exemplar-ui.js").read_text()
app=(r/"assets/app.js").read_text()
idx=(r/"index.html").read_text()
assert "Multi-Path Exemplar Library" in idx
assert "recommendedProject" in ui
assert "Recommended for your path" in ui
assert "Cross-path comparison" in ui
assert "data-open-exemplar-stage" in app
assert "path-matched project" in app
# Methodological differentiation
by={x["path"]:x for x in bank["projects"]}
assert "p-value" in by["descriptive_quantitative"]["stages"][13]["rejected"]
assert "association" in by["observational"]["stages"][14]["decision"].lower() or "association" in by["observational"]["stages"][14]["notebook"].get("result1","").lower()
assert "not randomly assigned" in by["quasi_experimental"]["disclaimer"].lower() or "nonrandom" in by["quasi_experimental"]["data_summary"].lower()
assert "thematic" in by["qualitative"]["stages"][13]["decision"].lower()
assert "pool" not in by["literature_review"]["stages"][13]["decision"].lower()
assert "p-values" in by["meta_analysis"]["stages"][13]["rejected"].lower()
assert "integration" in by["mixed_methods"]["stages"][13]["decision"].lower() or "joint" in by["mixed_methods"]["stages"][13]["decision"].lower()
print("PASS v2.8 multi-path static differentiation")
