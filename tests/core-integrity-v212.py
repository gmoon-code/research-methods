
from pathlib import Path
import hashlib
r=Path(__file__).resolve().parents[1]
ref=Path("/mnt/data/research-methods-studio-v2.11-current-research-snapshot-response-examples")
unchanged=[
"assets/coach.js","assets/methods.js","assets/analytics.js","assets/literature.js","assets/writing.js",
"assets/transfer.js","assets/competencies.js","assets/curriculum.js","assets/pathways.js","assets/path-coach.js",
"assets/rescue.js","assets/rescue-model.js","assets/novice-friction.js","assets/exemplar-projects.js",
"assets/exemplar.js","assets/exemplar-ui.js","assets/research-snapshot.js","assets/research-snapshot-ui.js",
"assets/student-guidance.js","assets/student-guidance-ui.js","assets/response-examples.js",
"prompts/stage_prompts_v1.2.json"
]
for rel in unchanged:
    assert hashlib.sha256((r/rel).read_bytes()).hexdigest()==hashlib.sha256((ref/rel).read_bytes()).hexdigest(),rel
print(f"PASS v2.12 inherited research/guidance engines unchanged: {len(unchanged)} files")
