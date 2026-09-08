
from pathlib import Path
import csv,json,math
import numpy as np
import statsmodels.stats.oneway as smow
r=Path(__file__).resolve().parents[1]
e=r/"examples/radish-salinity"
with open(e/"SYNTHETIC_SEED_LEVEL_DATA.csv",newline="",encoding="utf-8") as f: seed=list(csv.DictReader(f))
with open(e/"SYNTHETIC_DISH_LEVEL_ANALYSIS_DATA.csv",newline="",encoding="utf-8") as f: dish=list(csv.DictReader(f))
a=json.loads((e/"SYNTHETIC_ANALYSIS_OUTPUT.json").read_text())
assert len(seed)==90
assert len(dish)==18
assert len(set(x["dish_id"] for x in dish))==18
assert all(int(x["n_seeds"])==5 for x in dish)
groups=[]
for c in ["0","50","100"]:
    vals=np.array([float(x["mean_radicle_length_mm"]) for x in dish if x["NaCl_mM"]==c])
    groups.append(vals)
    assert len(vals)==6
    assert abs(vals.mean()-a["groups"][c]["mean_mm"])<1e-9
w=smow.anova_oneway(groups,use_var="unequal")
assert abs(float(w.statistic)-a["primary_analysis"]["F"])<1e-9
assert abs(float(w.pvalue)-a["primary_analysis"]["p"])<1e-15
assert a["experimental_unit"]=="Petri dish"
assert "independent treatment replicates" in a["subsamples"].lower()
print("PASS v2.7 exemplar data and statistical integrity")
