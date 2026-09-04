#!/usr/bin/env python3
import csv, math, argparse
from collections import defaultdict

def read(path):
    rows=[]
    with open(path,newline="",encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            try: level=int(r["level_0_to_3"])
            except: continue
            if level not in range(4): continue
            key=(r.get("task_id",""),r.get("competency",""),r.get("response_type","independent") or "independent")
            rows.append((key,level,r))
    return rows

def align(a,b):
    A={k:(v,r) for k,v,r in a}; B={k:(v,r) for k,v,r in b}
    return [(k,A[k][0],B[k][0],A[k][1],B[k][1]) for k in A.keys() & B.keys()]

def metrics(pairs,k=4):
    n=len(pairs); m=[[0]*k for _ in range(k)]
    for _,a,b,_,_ in pairs: m[a][b]+=1
    if not n:return {"n":0,"agreement":None,"kappa":None,"weighted_kappa":None,"matrix":m}
    po=sum(m[i][i] for i in range(k))/n
    ra=[sum(m[i]) for i in range(k)]
    rb=[sum(m[i][j] for i in range(k)) for j in range(k)]
    pe=sum((ra[i]/n)*(rb[i]/n) for i in range(k))
    kap=None if abs(1-pe)<1e-12 else (po-pe)/(1-pe)
    pow_=pew=0.0
    for i in range(k):
        for j in range(k):
            w=1-((i-j)**2)/((k-1)**2)
            pow_ += w*m[i][j]/n
            pew += w*(ra[i]/n)*(rb[j]/n)
    kw=None if abs(1-pew)<1e-12 else (pow_-pew)/(1-pew)
    return {"n":n,"agreement":po,"kappa":kap,"weighted_kappa":kw,"matrix":m}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("rater_a");ap.add_argument("rater_b")
    args=ap.parse_args()
    p=align(read(args.rater_a),read(args.rater_b))
    print(metrics(p))
    groups=defaultdict(list)
    for x in p:groups[x[0][1]].append(x)
    for c,x in sorted(groups.items()):print(c,metrics(x))

if __name__=="__main__":main()
