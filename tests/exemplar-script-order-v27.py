
from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
scripts=re.findall(r'<script src="\./([^"]+)"',idx)
pos={x:i for i,x in enumerate(scripts)}
for x in ["assets/competencies.js","assets/exemplar-projects.js","assets/exemplar.js","assets/exemplar-ui.js","assets/app.js"]:
    assert x in pos,x
assert pos["assets/competencies.js"] < pos["assets/exemplar-projects.js"] < pos["assets/exemplar.js"] < pos["assets/exemplar-ui.js"] < pos["assets/app.js"]
print("PASS v2.7 exemplar script order")
