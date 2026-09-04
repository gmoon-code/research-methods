#!/usr/bin/env python3
import json, hashlib, pathlib, sys
HERE=pathlib.Path(__file__).resolve()
ROOT=HERE.parents[2]
manifest=json.loads((ROOT/"pilot/FROZEN_BASELINE_MANIFEST_v2.0.json").read_text(encoding="utf-8"))
bad=[]
items=manifest.get("measurement_sensitive_files") or manifest.get("files") or []
for item in items:
    if isinstance(item,str):
        rel=item; expected=None
    else:
        rel=item.get("path") or item.get("file")
        expected=item.get("sha256") or item.get("hash")
    if not rel: continue
    p=ROOT/rel
    if not p.exists():
        bad.append((rel,"MISSING",expected));continue
    got=hashlib.sha256(p.read_bytes()).hexdigest()
    if expected and got!=expected:bad.append((rel,got,expected))
print(f"Checked {len(items)} frozen manifest entries.")
if bad:
    print("BASELINE VERIFICATION: FAIL")
    for x in bad: print(*x)
    sys.exit(1)
print("BASELINE VERIFICATION: PASS")
