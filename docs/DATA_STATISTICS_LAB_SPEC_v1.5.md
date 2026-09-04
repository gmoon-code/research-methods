# Data Analysis & Statistics Laboratory v1.5

## Purpose

Teach students how raw evidence becomes a defensible Results record. The lab follows the course materials in keeping analyses traceable, preserving paired structures, reporting descriptive evidence, matching tests to research design, and separating Results from Discussion.

## Seven tabs

1. Import raw CSV
2. Data quality
3. Explore and visualize
4. Estimand-first analysis setup
5. Run analysis
6. Analysis record
7. Results traceability audit

## Implemented calculations

- numerical descriptives including mean, SD, median, quartiles, IQR, range, skewness, and IQR outlier flags
- categorical counts and percentages
- Pearson correlation with confidence interval
- Spearman rank correlation
- Welch independent-samples t-test with raw difference, confidence interval, and Hedges' g
- paired-samples t-test with paired difference CI and Cohen dz
- classical one-way ANOVA with eta squared and omega squared
- Welch one-way ANOVA
- chi-square independence with expected-count diagnostics and Cramér's V
- two-sided Fisher exact test for 2×2 tables
- McNemar exact paired-binary test
- Cochran's Q for repeated binary outcomes

## Methodological safeguards

- no inferential test is forced for descriptive research
- Welch t is used as the default two-independent-means route because equal population variances are not required
- paired observations remain paired
- row unit and independent-unit mismatch from Methods Lab is surfaced
- outlier flags do not automatically delete observations
- sparse expected counts are flagged
- p-values are separated from effect magnitude, causality, practical importance, and generalizability
- non-significance is not treated as proof of no effect

## Current boundaries

Advanced regression, multilevel/mixed models, formal power analysis, nonparametric rank-test engines, post-hoc multiple-comparison engines, and meta-analysis computation remain outside v1.5. Advanced designs should be routed for teacher/statistical review rather than approximated incorrectly.
