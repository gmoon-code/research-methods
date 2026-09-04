from pathlib import Path
from bs4 import BeautifulSoup
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8');css=(root/'assets/style.css').read_text(encoding='utf-8');app=(root/'assets/app.js').read_text(encoding='utf-8')
soup=BeautifulSoup(html,'html.parser')
assert soup.find(id='mobileStageSelect') is not None
assert soup.find(id='saveStatus').get_text(strip=True)=='Not saved yet'
assert '.mobile-stage-picker{display:none' in css and '@media(max-width:820px){.mobile-stage-picker{display:block}' in css
assert 'Pilot.clearProjectStorage(KEY' in app
assert 'Pilot.featureAccess(project,"public-transfer")' in app
assert 'Pilot.featureAccess(project,"ai")' in app
print('PASS RC1 static mobile/policy QA')
