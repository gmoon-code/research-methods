#!/usr/bin/env python3
from pathlib import Path
import json, hashlib, sys

ROOT = Path(__file__).resolve().parents[3]
manifest_path = ROOT / "pilot/v2.13.2/PILOT_FREEZE_MANIFEST_v2.13.2.json"
m = json.loads(manifest_path.read_text(encoding="utf-8"))

problems = []
for item in m["files"]:
    p = ROOT / item["path"]
    if not p.exists():
        problems.append((item["path"], "missing"))
        continue
    h = hashlib.sha256(p.read_bytes()).hexdigest()
    if h != item["sha256"]:
        problems.append((item["path"], "hash mismatch"))

print("Student-facing baseline:", m["student_facing_baseline"])
print("Frozen files checked:", len(m["files"]))
if problems:
    print("FREEZE VERIFICATION: FAIL")
    for path, issue in problems:
        print(path, "-", issue)
    sys.exit(2)

print("FREEZE VERIFICATION: PASS")
print("Freeze digest:", m["freeze_digest"])
