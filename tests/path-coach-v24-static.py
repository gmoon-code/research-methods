from pathlib import Path
r=Path(__file__).resolve().parents[1];idx=(r/'index.html').read_text();app=(r/'assets/app.js').read_text();journey=(r/'assets/journey.js').read_text();paths=(r/'assets/pathways.js').read_text()
assert 'path-coach-model.js' in idx and 'path-coach.js' in idx
assert 'PathCoach.reviewStage' in app and 'PathCoach.readinessChecks' in app and 'PathCoach.stageGate' in app and 'PathCoach.methodsReadiness' in app
assert 'research_path:project.pathway?.selected' in app and 'pathway_rule:' in app
assert 'protocolReviewRequired' in paths and 'for(let stage=9;stage<=18;stage++)' in paths
assert 'RMSPathCoach' in journey and 'snap.researchPath=project.pathway?.selected' in app
print('PASS v2.4 static integration')