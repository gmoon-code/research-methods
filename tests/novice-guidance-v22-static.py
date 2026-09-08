
from pathlib import Path
r=Path(__file__).resolve().parents[1]
ui=(r/'assets/student-guidance-ui.js').read_text()
app=(r/'assets/app.js').read_text()
dl=(r/'assets/data-lab-ui.js').read_text()
idx=(r/'index.html').read_text()
assert 'choiceHelp' in ui and 'guide-walkthrough' in ui
assert 'Guide.choiceHelp(id)' in app
assert 'Pearson r — linear association' in dl
assert 'Fisher exact — exact 2×2 option' in dl
assert 'v2.2' in idx
print('PASS v2.2 novice guidance integration')
