
from pathlib import Path
import hashlib
r=Path(__file__).resolve().parents[1]
src=Path("/mnt/data/research-methods-studio-v2.4-pathway-specific-coaching-readiness")
files=["assets/coach.js","assets/methods.js","assets/analytics.js","assets/literature.js","assets/writing.js","assets/transfer.js","assets/competencies.js","assets/curriculum.js","prompts/stage_prompts_v1.2.json"]
for rel in files:
    assert hashlib.sha256((r/rel).read_bytes()).hexdigest()==hashlib.sha256((src/rel).read_bytes()).hexdigest(),rel
print("PASS inherited core engine integrity")
