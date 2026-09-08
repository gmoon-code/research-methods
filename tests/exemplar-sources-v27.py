
from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
s=json.loads((r/"examples/radish-salinity/VERIFIED_SOURCE_RECORDS.json").read_text())
assert len(s)==3
dois=" ".join(x["citation"] for x in s)
for doi in ["10.1146/annurev.arplant.59.032607.092911","10.1111/nph.13519","10.3390/agronomy15020361"]:
    assert doi in dois
assert all(x["verified"] for x in s)
paper=(r/"examples/radish-salinity/COMPLETE_SYNTHETIC_EXEMPLAR_PAPER.md").read_text()
assert "synthetic" in paper.lower()
assert "do not document an actual conducted experiment" in paper
assert ("18 Petri dishes" in paper) or ("Eighteen Petri dishes" in paper)
assert "90 seed" in paper
print("PASS v2.7 source and synthetic-status integrity")
