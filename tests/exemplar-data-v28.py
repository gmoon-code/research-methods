
from pathlib import Path
import csv,json,math
import numpy as np
from scipy import stats
r=Path(__file__).resolve().parents[1]
# descriptive
with open(r/"examples/aquarium-water-description/SYNTHETIC_AQUARIUM_MONITORING.csv",newline="",encoding="utf-8") as f: a=list(csv.DictReader(f))
assert len(a)==21 and len({x["aquarium"] for x in a})==3
# observational
with open(r/"examples/sleep-school-observational/SYNTHETIC_OBSERVATIONAL_DATA.csv",newline="",encoding="utf-8") as f: o=list(csv.DictReader(f))
assert len(o)==30
sl=np.array([float(x["reported_weekday_sleep_hours"]) for x in o]);sc=np.array([float(x["biology_quiz_score"]) for x in o])
out=json.loads((r/"examples/sleep-school-observational/SYNTHETIC_ANALYSIS_OUTPUT.json").read_text())
pr=stats.pearsonr(sl,sc)
assert abs(float(pr.statistic)-out["pearson_r"])<1e-9
# quasi
with open(r/"examples/retrieval-quasi-experiment/SYNTHETIC_QUASI_DATA.csv",newline="",encoding="utf-8") as f: q=list(csv.DictReader(f))
assert len(q)==48 and {x["class_group"] for x in q}=={"retrieval_routine","comparison_class"}
# qualitative
with open(r/"examples/multilingual-science-qualitative/SYNTHETIC_INTERVIEW_EXCERPTS.csv",newline="",encoding="utf-8") as f: ql=list(csv.DictReader(f))
assert len(ql)==8
themes=json.loads((r/"examples/multilingual-science-qualitative/SYNTHETIC_THEME_MATRIX.json").read_text())
assert len(themes)==3
# lit review
with open(r/"examples/multilingual-science-literature-review/VERIFIED_MINI_REVIEW_STUDY_MATRIX.csv",newline="",encoding="utf-8") as f: lr=list(csv.DictReader(f))
assert len(lr)==4
# meta
with open(r/"examples/synthetic-meta-analysis/SYNTHETIC_EFFECT_EXTRACTION.csv",newline="",encoding="utf-8") as f: m=list(csv.DictReader(f))
assert len(m)==8
mo=json.loads((r/"examples/synthetic-meta-analysis/SYNTHETIC_META_ANALYSIS_OUTPUT.json").read_text())
assert mo["k"]==8 and 0<=mo["I2_percent"]<=100
# mixed
with open(r/"examples/retrieval-mixed-methods/SYNTHETIC_QUANTITATIVE_DATA.csv",newline="",encoding="utf-8") as f: mm=list(csv.DictReader(f))
with open(r/"examples/retrieval-mixed-methods/SYNTHETIC_INTERVIEW_EXCERPTS.csv",newline="",encoding="utf-8") as f: mi=list(csv.DictReader(f))
assert len(mm)==24 and len(mi)==6
print("PASS v2.8 exemplar evidence packs")
