
from pathlib import Path
import hashlib

r=Path(__file__).resolve().parents[1]
ref=Path("/mnt/data/research-methods-studio-v2.12-persistent-ai-research-helper")

# v2.13 changes learner-facing flow/UI and state synchronization. These substantive
# research-method engines and locked instructional content are expected unchanged.
unchanged=[
    "assets/coach.js",
    "assets/methods.js",
    "assets/analytics.js",
    "assets/literature.js",
    "assets/writing.js",
    "assets/transfer.js",
    "assets/competencies.js",
    "assets/curriculum.js",
    "assets/pathways.js",
    "assets/path-coach.js",
    "assets/rescue.js",
    "assets/rescue-model.js",
    "assets/novice-friction.js",
    "assets/exemplar-projects.js",
    "assets/exemplar.js",
    "assets/exemplar-ui.js",
    "assets/accessibility.js",
    "assets/student-guidance.js",
    "assets/response-examples.js",
    "assets/ai-adapter.js",
    "assets/ai-helper.js",
    "prompts/stage_prompts_v1.2.json",
]
for rel in unchanged:
    a=hashlib.sha256((r/rel).read_bytes()).hexdigest()
    b=hashlib.sha256((ref/rel).read_bytes()).hexdigest()
    assert a==b, f"{rel} changed unexpectedly"
print(f"PASS v2.13 inherited substantive research/instruction engines unchanged: {len(unchanged)} files")
