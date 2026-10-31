# Reported Sleep and Biology Quiz Scores

> **Synthetic teaching exemplar.** The two scholarly reviews cited here are genuine publications. All 30 student records, their reported sleep durations, study-hour values and biology quiz scores were invented for instruction. This example does not document a real classroom study, student recruitment or evidence of an effect of sleep on achievement.

## Research question

Among students in one synthetic biology-class sample, what is the association between reported weekday sleep duration and biology quiz score?

## Introduction and literature basis

Students' experiences of sleep can be described through duration, perceived sleep quality and daytime sleepiness, although these measures do not represent the same construct. Dewald et al. (2010) synthesised research on these measures and school performance among children and adolescents. Their meta-analysis reported a modest pooled correlation between sleep duration and school performance, *r* = .069. Curcio et al. (2006) reviewed evidence on sleep loss, learning and academic achievement, considering studies with differing research designs. Both publications offer grounds for investigating sleep-related experiences in educational settings, with appropriate attention to the particular outcome and design used.

The instructional example narrows this broad literature to an association between reported weekday sleep duration and one biology quiz score. The two reviews do not establish what that association would be in any particular class. They also do not supply the questionnaire, assessment or student observations in the synthetic file. The example therefore illustrates how an observational analysis might be planned and reported, while keeping the invented numbers separate from the empirical literature.

## Method

### Design and sample

The illustrative design is cross-sectional and correlational. A fabricated convenience-class dataset includes one row for each of 30 distinct student identifiers, S01 through S30. Sleep duration was not assigned or manipulated, and the file contains no repeated sleep reports or quiz assessments. The 30 records are invented, so no recruitment, school approval or participant consent occurred for this teaching example.

For an actual study involving students, researchers would need the permissions and applicable ethics review required in their setting. Linking self-reported sleep with educational records could expose identifiable information even if a numerical identifier replaces a name. A teacher's grading authority may also affect students' freedom to decline. An approved process would need to separate research consent decisions from grading, limit access to the linkage key and make withdrawal conditions clear. Any age-related consent and parental permission requirements would need to be established before recruitment.

### Variables and measurement

The source file `SYNTHETIC_OBSERVATIONAL_DATA.csv` has four fields, `student_id`, `reported_weekday_sleep_hours`, `weekly_study_hours` and `biology_quiz_score`. Reported weekday sleep duration is a numerical measured predictor, and quiz score is the numerical outcome. Weekly study hours is an additional recorded variable that might inform a real analysis of alternative explanations. Its presence alone does not justify claiming that confounding was controlled.

No original sleep questionnaire, reporting window, quiz administration record or scoring rubric accompanies the invented data. These gaps prevent independent assessment of whether the measures would represent their intended constructs in a real study. Quiz values in the synthetic file are bounded at 100.0, with several records reaching that value, and the scoring scale should be documented before interpreting an actual assessment.

### Data preparation and analysis

The file contains one paired sleep-duration and quiz-score value for each of 30 distinct student IDs, with no missing or duplicate rows. A real data plan would specify how to treat missing survey responses, protect identifiable educational records and document any exclusions before inspecting the association. In this constructed file, the 30 rows are retained for the descriptive analysis.

Summarise both numerical variables using their observed range and mean. Inspect a scatterplot with reported sleep hours on one axis and quiz score on the other, looking for nonlinearity and the upper score boundary. Pearson's correlation coefficient provides a numerical description of linear association. A conventional model-based significance test can be demonstrated, but inferential interpretation would depend on defensible sampling and model assumptions that this synthetic exercise does not establish. Correlation is not a treatment-effect estimate.

## Results

**Every value in this section comes from invented teaching data.** The 30 synthetic sleep reports range from **4.8 to 9.2 hours**, with a mean of **6.98 hours**. Quiz scores range from **75.2 to 100.0**, with a mean of **92.32**. Six students' synthetic records have quiz scores of exactly **100.0**, leaving an evident concentration at the upper observed boundary.

The sample Pearson correlation between sleep duration and quiz score is **r = .7472**, with a conventional two-sided test giving **p ≈ 2.10 × 10⁻⁶** under the illustrative independent-pairs model. The coefficient and test output can be recalculated from `SYNTHETIC_OBSERVATIONAL_DATA.csv` and checked against `SYNTHETIC_ANALYSIS_OUTPUT.json`. The number describes the particular invented pairs of values, without providing evidence for an association among real secondary students.

The spreadsheet also records weekly study hours, averaging **2.60 hours** and ranging from **1.2 to 4.5 hours**. Those values remain available for examining the dataset, although they cannot establish whether study habits account for the sleep–score pattern. Nor does the correlation identify the direction of any underlying influence.

## Discussion and limitations

The positive association in the synthetic file is substantially larger than the modest pooled sleep-duration correlation reported by Dewald et al. (2010). Because the file was deliberately constructed, this contrast should not be treated as evidence of disagreement between empirical studies. It illustrates why a teaching dataset's numerical pattern cannot be generalised to a real class or used to confirm a published review.

If similar variables were measured in an actual classroom, several alternative explanations would require consideration. Students who reported different amounts of sleep might also differ in previous achievement, attendance, educational opportunities or stress. Study hours alone would be an incomplete account of those influences. Cross-sectional records also lack the temporal ordering needed to establish whether sleep preceded an assessment change. Self-reported duration could be affected by recall or rounding, while the quiz's purpose and scoring would determine what its numerical values actually mean.

The visible score boundary warrants attention as well. Six scores reach 100.0, so the association may reflect the bounded outcome scale as well as the observed distribution. A scatterplot would help a reader assess whether a linear summary is adequate for the invented data. Even a precisely calculated coefficient and very small model-based p-value cannot repair unverified measurements, a convenience sample or omitted causes. In this example there are no real measurements at all.

The useful conclusion is methodological. A student can connect an observational question to paired records and a reproducible calculation, then describe what remains uncertain. Treating sleep duration as an observed predictor keeps the final claim proportionate to the evidence. Any intervention recommendation, particularly one directed at students' sleep, would need a different and much stronger evidential basis.

## Conclusion

The 30 synthetic paired records illustrate a positive numerical correlation between reported weekday sleep duration and biology quiz score. The relationship is constructed for instruction, and its magnitude does not describe real student learning. A scientifically defensible observational report would distinguish the sample association from causal explanations, document how the variables were measured and protect the students whose information could otherwise be linked.

## References

Curcio, G., Ferrara, M., & De Gennaro, L. (2006). Sleep loss, learning capacity and academic performance. *Sleep Medicine Reviews, 10*(5), 323–337. https://doi.org/10.1016/j.smrv.2005.11.001

Dewald, J. F., Meijer, A. M., Oort, F. J., Kerkhof, G. A., & Bögels, S. M. (2010). The influence of sleep quality, sleep duration and sleepiness on school performance in children and adolescents: A meta-analytic review. *Sleep Medicine Reviews, 14*(3), 179–189. https://doi.org/10.1016/j.smrv.2009.10.004
