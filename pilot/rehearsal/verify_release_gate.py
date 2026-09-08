#!/usr/bin/env python3
import csv, pathlib, sys, subprocess
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[1]
matrix=HERE/"FIELD_REHEARSAL_MATRIX_v2.0-RC1.csv"
defects=HERE/"FIELD_DEFECT_LOG_v2.0-RC1.csv"

with matrix.open(newline="",encoding="utf-8-sig") as f:
    rows=list(csv.DictReader(f))
required=[r for r in rows if (r.get("requirement") or "").strip().lower()=="required"]
not_pass=[r for r in required if (r.get("result") or "").strip().upper()!="PASS"]

open_serious=[]
with defects.open(newline="",encoding="utf-8-sig") as f:
    for r in csv.DictReader(f):
        sev=(r.get("severity") or "").strip().lower()
        status=(r.get("status") or "").strip().lower()
        if sev in {"blocker","major"} and status not in {"fixed","closed","resolved","accepted"}:
            open_serious.append(r)

baseline=subprocess.run([sys.executable,str(HERE/"verify_frozen_baseline.py")],capture_output=True,text=True)
print(baseline.stdout.strip())
print(f"Required tests: {len(required)}")
print(f"Required tests not PASS: {len(not_pass)}")
for r in not_pass[:20]:
    print(f"  {r['test_id']}: {r.get('result','')} — {r.get('pass_criterion','')}")
print(f"Open Blocker/Major field defects: {len(open_serious)}")
for r in open_serious:
    print(f"  {r.get('id')}: {r.get('severity')} — {r.get('description')}")

if baseline.returncode==0 and not not_pass and not open_serious:
    print("RELEASE GATE: PASS")
    sys.exit(0)
print("RELEASE GATE: HOLD")
sys.exit(2)
