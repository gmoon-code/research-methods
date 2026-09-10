#!/usr/bin/env python3
from pathlib import Path
import csv,sys,subprocess
ROOT=Path(__file__).resolve().parents[3]
freeze=subprocess.run([sys.executable,str(ROOT/'pilot/v2.13.2/scripts/verify_pilot_freeze.py')],capture_output=True,text=True)
print(freeze.stdout.strip())
if freeze.returncode:
    print('PILOT READINESS: NO-GO — frozen baseline changed')
    sys.exit(2)
with open(ROOT/'pilot/v2.13.2/forms/PRE_FLIGHT_CHECKLIST.csv',newline='',encoding='utf-8') as f: checks=list(csv.DictReader(f))
with open(ROOT/'pilot/v2.13.2/forms/PILOT_ISSUE_LOG.csv',newline='',encoding='utf-8') as f: issues=list(csv.DictReader(f))
pending=[r for r in checks if r['status'].strip().upper()!='PASS']
blocking=[r for r in issues if r.get('status','').strip().upper() not in {'CLOSED','RESOLVED'} and r.get('severity','') in {'Blocker','Major'}]
if blocking:
    print('PILOT READINESS: NO-GO — open Blocker/Major issues')
    for r in blocking: print(r.get('issue_id'),r.get('severity'),r.get('description'))
    sys.exit(3)
if pending:
    print(f'PILOT READINESS: NOT YET GO — {len(pending)} checklist item(s) are not PASS')
    for r in pending: print(r['item_id'],r['requirement'],'=>',r['status'])
    sys.exit(4)
print('PILOT READINESS: GO')
