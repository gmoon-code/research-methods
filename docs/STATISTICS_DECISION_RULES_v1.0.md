# Statistics Decision Rules v1.0

The built-in wizard is pedagogical guidance, not a replacement for statistical review.

## Core sequence

Research question → estimand → design structure → outcome type → descriptive evidence → model/test choice → assumptions → effect magnitude → uncertainty → contextual interpretation.

## Included routes

- one numerical outcome → descriptive analysis
- two numerical/ordinal variables → Pearson/Spearman with scatterplot depending on the scientific estimand and relationship form
- two independent groups with continuous outcome → Welch t as a strong default when mean comparison is appropriate
- two paired conditions with continuous outcome → paired t on difference scores or paired nonparametric alternatives when warranted
- three or more independent groups → ANOVA/Welch ANOVA or rank-based alternative
- three or more repeated conditions → repeated-measures approach, mixed model, or Friedman depending on structure
- categorical association → chi-square/Fisher
- paired binary → McNemar
- repeated binary with 3+ conditions → Cochran's Q
- qualitative → coding/thematic synthesis with audit trail
- literature review → evidence mapping/synthesis, no pooled effect
- meta-analysis → advanced quantitative synthesis only when effect estimates are sufficiently comparable

## Guardrails

- Independence is a design property, not a normality assumption.
- Equal variance is not required for Welch t.
- For paired t, distributional assumptions concern paired differences.
- Repeated measurements must not be analyzed as independent observations.
- Chi-square uses counts.
- Statistical significance does not establish practical importance, causality, or generalizability.
- P-values should be interpreted alongside effect estimates, uncertainty, design, and context.
