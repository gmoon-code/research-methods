# Synthetic Meta-Analysis of a Learning Intervention

> **Synthetic teaching exemplar.** The eight effect estimates and their standard errors were invented to demonstrate statistical calculations. The three cited scholarly works are genuine sources about meta-analysis methods and reporting. No primary intervention reports, participant records, systematic search, study selection or real learning effects are represented.

## Research question

What pooled standardised mean difference results from applying a DerSimonian–Laird random-effects calculation to eight hypothetical effect estimates?

## Introduction and methodological rationale

A quantitative synthesis may help researchers understand how effect estimates from different studies relate to one another. Before combining results, they need to establish that the comparisons, outcomes and effect metrics can meaningfully be considered together. Researchers must also determine which effects are independent and how to represent uncertainty in the underlying estimates.

A standardised mean difference expresses a difference in outcome means relative to a measure of variability. Its use requires careful attention to the outcome being measured and the direction of the comparison. The present file contains eight values labelled `standardized_mean_difference_g`, along with a standard error for each. Those values are given as inputs. Because no source means, standard deviations or sample sizes are supplied, the correction ordinarily associated with Hedges' g cannot be independently checked.

Borenstein et al. (2010) explain why a fixed-effect model and a random-effects model answer questions under different assumptions. A fixed-effect model assumes that all studies estimate a common true effect; a random-effects model allows underlying effects to vary across studies. Higgins et al. (2003) discuss statistical inconsistency, including I², which can help describe variability in a meta-analysis without explaining its causes. PRISMA 2020 (Page et al., 2021) concerns transparent reporting of reviews, including the records and decisions needed to establish what was actually searched and included.

These sources provide a methodological basis for the exercise. They are not publications about the eight hypothetical intervention effects, and the synthetic dataset does not establish a new empirical evidence base.

## Method

### Synthetic inputs and unit of analysis

The file `SYNTHETIC_EFFECT_EXTRACTION.csv` contains eight rows, identified as T01–T08. Each row has the fields `study_id`, `standardized_mean_difference_g` and `standard_error`. The values of g range from **0.17 to 0.64**, with strictly positive standard errors from **0.11 to 0.19**. All eight identifiers are distinct.

For teaching, the eight estimates are treated as statistically independent and as though they were calculated on an appropriately aligned scale. Their labels do not verify independence. In a real review, a researcher would need to establish which reports share participants, whether multiple outcomes arise from the same sample, what interventions and comparisons were studied, and whether the effect directions are consistent. The present file contains no information with which to make those checks.

### Proposed evidence-search and eligibility procedures

A genuine systematic review would define its eligible populations, learning interventions, comparison conditions, outcome measures, research designs and follow-up periods. Reviewers would document their searches, screening and exclusions, then evaluate the underlying studies and extract the data needed to compute comparable effects. PRISMA 2020 offers reporting guidance for such work.

None of those activities is documented for T01–T08. The study identifiers and numerical effects were created for instruction. A search history or PRISMA flow diagram would therefore give a misleading account of their provenance, and no risk-of-bias ratings can legitimately be assigned to fictional studies.

### Statistical method

Let the eight input effects be `gᵢ` and their standard errors be `SEᵢ`. A simple DerSimonian–Laird random-effects calculation begins by defining each within-effect variance as `vᵢ = SEᵢ²`. Fixed-effect inverse-variance weights `1/vᵢ` give a reference pooled estimate used to calculate Cochran's Q, the weighted sum of squared deviations around that reference.

With `k = 8`, the degrees of freedom for Q are `k − 1 = 7`. The DerSimonian–Laird moment estimate of between-effect variance is

`τ² = max(0, (Q − (k − 1))/C)`

where `C = Σwᵢ − (Σwᵢ²/Σwᵢ)` and the `wᵢ` in this expression are the fixed-effect inverse-variance weights. The calculation then assigns random-effects weights `1/(vᵢ + τ²)` and obtains their weighted mean. The conventional pooled standard error is the square root of the reciprocal of the sum of those random-effects weights.

The displayed confidence interval uses a normal approximation of **pooled g ± 1.96 × standard error**. This simplified interval treats the estimated between-effect variance as fixed and does not fully represent the uncertainty introduced by estimating τ², particularly when there are few effects. Other estimators or small-sample methods could produce different estimates and intervals.

For descriptive inconsistency, the calculation uses `I² = max(0, (Q − (k − 1))/Q) × 100%`. I² does not measure the fraction of studies affected by bias or show why the hypothetical estimates differ. It can also be imprecise with a small set of studies.

## Results

**All numerical findings in this section are calculations from invented inputs.** The eight effects and their standard errors reproduce a fixed-effect reference estimate of **0.3656** and Cochran's **Q(7) = 8.0729**. The DerSimonian–Laird estimate of between-effect variance is **τ² = 0.003087**.

Using the resulting random-effects weights gives a pooled standardised mean difference of **g = 0.3688**, with an approximate conditional standard error of **0.05386**. The conventional normal-approximation **95% confidence interval is [0.2632, 0.4743]**, matching the saved analysis output to reporting precision. The calculated **I² = 13.29%**.

| Synthetic input | g | Standard error |
| --- | ---: | ---: |
| T01 | 0.22 | 0.12 |
| T02 | 0.41 | 0.15 |
| T03 | 0.35 | 0.11 |
| T04 | 0.58 | 0.18 |
| T05 | 0.17 | 0.14 |
| T06 | 0.49 | 0.13 |
| T07 | 0.31 | 0.16 |
| T08 | 0.64 | 0.19 |

The table, `SYNTHETIC_EFFECT_EXTRACTION.csv` and `SYNTHETIC_META_ANALYSIS_OUTPUT.json` give a traceable route between the inputs and the results. The pooled coefficient is a mathematical summary of the constructed effect estimates. It does not estimate how much a real learning intervention changes students' outcomes.

## Discussion and limitations

The exercise shows how input precision and an estimate of between-effect variation influence a random-effects mean. Effects with smaller standard errors generally receive more weight, while the added τ² component changes their relative contributions. The pooled value sits within the range of the eight invented effects and differs slightly from the fixed-effect reference estimate.

A relatively low calculated I² might appear reassuring. Its value depends on the observed Q statistic and the assumed properties of the input effects, however, and it does not establish that the hypothetical interventions are equivalent. Eight rows also provide limited information for characterising a distribution of underlying effects. The normal-approximation confidence interval is a transparent teaching choice, with uncertainty that is narrower in scope than some alternative approaches would allow.

The more fundamental boundary concerns evidence provenance. No primary studies exist behind the synthetic table. The individual g values cannot be recalculated from outcome data, and the assumption that their sampling errors are independent is unverified. There is no search or eligibility trail, no appraisal of study quality and no way to investigate whether a particular educational setting influenced any reported result. A numerical synthesis with internally correct mathematics can therefore remain entirely uninformative about what happens in real classrooms.

A real meta-analysis would also need to address variation in the outcome constructs, time points and study designs. Whether a common or varying-effect model is appropriate depends on the research question and nature of the evidence. Reporting Q, τ² and I² cannot resolve those decisions on its own.

## Conclusion

The eight fabricated effect values yield a DerSimonian–Laird random-effects pooled g of approximately 0.3688, with a conventional normal interval of 0.2632–0.4743 and calculated I² of 13.29%. The arithmetic provides an example of how weights and heterogeneity enter a synthesis model. Its validity as an empirical educational conclusion cannot be established because the underlying research studies, their populations and their effect-size calculations do not exist.

The exemplar is intended to teach how a meta-analytic result is assembled and how its reporting should remain proportionate to the evidence available. Genuine intervention reviews require their own search records, primary-study data, appraisal and carefully justified model choices.

## References

Borenstein, M., Hedges, L. V., Higgins, J. P. T., & Rothstein, H. R. (2010). A basic introduction to fixed-effect and random-effects models for meta-analysis. Research Synthesis Methods, 1(2), 97–111. https://doi.org/10.1002/jrsm.12

Higgins, J. P. T., Thompson, S. G., Deeks, J. J., & Altman, D. G. (2003). Measuring inconsistency in meta-analyses. BMJ, 327(7414), 557–560. https://doi.org/10.1136/bmj.327.7414.557

Page, M. J., McKenzie, J. E., Bossuyt, P. M., Boutron, I., Hoffmann, T. C., Mulrow, C. D., Shamseer, L., Tetzlaff, J. M., Akl, E. A., Brennan, S. E., Chou, R., Glanville, J., Grimshaw, J. M., Hróbjartsson, A., Lalu, M. M., Li, T., Loder, E. W., Mayo-Wilson, E., McDonald, S., ... Moher, D. (2021). The PRISMA 2020 statement: An updated guideline for reporting systematic reviews. BMJ, 372, n71. https://doi.org/10.1136/bmj.n71
