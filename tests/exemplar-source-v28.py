
from pathlib import Path
import json
r=Path(__file__).resolve().parents[1]
bank=json.loads((r/"assets/exemplar-projects-v2.8.json").read_text())
for ex in bank["projects"]:
    assert ex.get("sources"),ex["path"]
    assert all(s.get("verified") for s in ex["sources"]),ex["path"]
    assert all(s.get("citation") and s.get("use") and s.get("boundary") for s in ex["sources"])
# specific DOI integrity
text=(r/"docs/MULTI_PATH_SOURCE_VERIFICATION_v2.8.md").read_text()
for doi in [
"10.1016/j.smrv.2009.10.004","10.1016/j.smrv.2005.11.001","10.1111/j.1467-9280.2006.01693.x",
"10.1126/science.1199327","10.3102/0013189X13480524","10.17226/25182","10.17226/25216",
"10.1191/1478088706qp063oa","10.1136/bmj.n71","10.1002/jrsm.12","10.1136/bmj.327.7414.557",
"10.3102/0013189X033007014"
]: assert doi in text
print("PASS v2.8 verified-source registry integrity")
