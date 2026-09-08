
from pathlib import Path
import re
r=Path(__file__).resolve().parents[1]
idx=(r/"index.html").read_text()
scripts=re.findall(r'<script src="\./([^"]+)"',idx)
pos={x:i for i,x in enumerate(scripts)}
required=["assets/coach.js","assets/methods.js","assets/path-coach.js","assets/competencies.js","assets/rescue.js","assets/rescue-ui.js","assets/app.js"]
for x in required: assert x in pos,x
assert pos["assets/coach.js"] < pos["assets/path-coach.js"]
assert pos["assets/methods.js"] < pos["assets/path-coach.js"]
assert pos["assets/competencies.js"] < pos["assets/rescue.js"] < pos["assets/rescue-ui.js"] < pos["assets/app.js"]
assert pos["assets/path-coach.js"] < pos["assets/app.js"]
print("PASS browser dependency script order")
