
from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
app=(r/"assets/app.js").read_text()
scripts=re.findall(r'<script src="\./([^"]+)"',idx)
assert "assets/novice-friction.js" in scripts
assert scripts.index("assets/path-coach.js") < scripts.index("assets/novice-friction.js") < scripts.index("assets/app.js")
assert "PathCoach=window.RMSNoviceGuard" in app
guard=(r/"assets/novice-friction.js").read_text()
for code in ["NG-PLACEHOLDER","NG-GAP-OVERCLAIM","NG-RANDOM-CONVENIENCE","NG-PAIRING-LOST","NG-BINARY-NUMERIC-CODE","NG-PVALUE-PROBABILITY","NG-NONSIG-NO-EFFECT","NG-META-PVALUE-AVERAGE"]:
    assert code in guard
print("PASS v2.6 novice friction static integration")
