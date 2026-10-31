# Retrieval Routine in Two Pre-Existing Classes

> **Synthetic teaching exemplar.** The two cited retrieval-practice studies are genuine scholarly publications. The classroom routines, 48 student records and every numerical result below are constructed for instruction. No actual classroom study, assessment or intervention is documented. Each instructional condition corresponds to a single pre-existing class, so the numerical contrast cannot identify a routine effect.

## Research question

How did pre-to-post biology scores change in a class using a retrieval-practice routine compared with a pre-existing comparison class?

## Introduction and literature basis

Remembering previously studied information can itself form part of learning. Roediger and Karpicke (2006) examined retrieval tests alongside opportunities to restudy passages and found advantages for retrieval on delayed retention assessments in their experimental settings. In another controlled comparison, Karpicke and Blunt (2011) found that retrieval practice supported meaningful learning from science-related texts when compared with elaborative study using concept maps. These findings establish a scholarly reason to examine retrieval opportunities in biology teaching, although the experimental procedures, participants and outcome measures differ from those imagined here.

A teacher might therefore wish to describe how students' scores change during a period that includes a retrieval routine. Existing school classes, however, are not automatically comparable. Students may enter with different prior experiences and receive instruction under different classroom conditions. The present example compares two such classes to teach the distinction between calculating a pre/post difference and attributing that difference to one instructional activity.

## Method

### Design and sample

The hypothetical design is a two-group quasi-experimental classroom comparison with one pre-existing class labelled `retrieval_routine` and another labelled `comparison_class`. There are 24 invented student records in each class. The students were not individually randomised, and the classes were neither randomised nor replicated within instructional conditions.

A critical consequence follows from this structure. All students in one class share the retrieval condition, while all students in the other share the comparison condition. The independent unit representing an instructional condition is therefore the class. With only one class under each condition, any difference between instructional routines is indistinguishable from a difference between the classes themselves. Forty-eight student records can describe student score change, but they are not 48 independent replications of the instructional comparison.

### Measurement and hypothetical procedure

The original CSV records `student_id`, `class_group`, `pre_score`, `post_score` and `change_score`. Each row joins one fictional student's pre- and post-score, while `class_group` identifies the intact class. A change score is calculated as post-score minus pre-score from the displayed one-decimal values. The audit corrected 16 original values that did not reconcile with those displayed measurements. All 48 derived scores now do.

In a real investigation, the researcher would need to define the retrieval tasks, their frequency and feedback, the comparison activities, the timing of both assessments and the evidence that the two scores are comparable. The supplied dataset contains none of these implementation or assessment records. Consequently, the numerical scores do not establish how any real biology class learned.

### Research ethics and school records

A real study would require the school permissions and applicable ethics review appropriate to its setting before student information could be used for research. A teacher's access to grades would not by itself establish permission to use those grades as research data. Students would need meaningful opportunities to decline, with the procedures separated from assessment and grading decisions. Researchers would also need to address assent, parental permission where required, privacy of linked score records and any effects on instructional access. No real participants or consent procedures are represented here.

### Data analysis

Begin by summarising pre-scores, post-scores and within-student changes separately for the two classes. The descriptive contrast is the retrieval class's mean change minus the comparison class's mean change. It answers what the synthetic scores show about these two groups.

The original example attached a student-level Welch t-test and 95% confidence interval to this contrast. Such calculations treat individual student changes as independent replications of the instructional condition. That assumption fails here because each condition appears in only one class. The revised `SYNTHETIC_ANALYSIS_OUTPUT.json` therefore reports the descriptive class difference and labels any naïve student-level Welch computation as an **invalid basis for treatment-effect inference**. No valid group-level p-value or treatment-effect confidence interval is available from the design as supplied.

## Results

**All results below are synthetic and descriptive.** The retrieval class includes 24 invented paired records. Its mean score is **69.18** before the routine and **78.90** afterwards, a mean increase of **9.72 points**. The comparison class also contains 24 invented records, with a mean pre-score of **68.66** and a mean post-score of **71.96**, yielding an increase of **3.30 points**.

The difference between these mean changes is **6.43 points** after rounding from an exact descriptive difference of **6.425 points**. Both class means increased in the synthetic data, and the retrieval class's average increase was larger. The pre-score means differ by about **0.51 points**, although this similarity does not demonstrate that the classes were equivalent in other respects.

The corrected dataset includes all 48 original fictional students and preserves their pre- and post-scores. Only the inconsistent derived change values were recalculated. The accompanying analysis file records the group means and descriptive difference. There is no valid 95% confidence interval for the instructional effect, and the example does not report a statistically significant routine benefit.

## Discussion and limitations

The direction of the invented difference is compatible with the educational interest in retrieval practice expressed in the published experimental literature. It does not, however, replicate those findings or independently support their causal conclusions. The present source values were fabricated, and the two-class structure would prevent attributing a real difference to the routine even if the scores had been observed.

Class composition may differ in prior preparation, motivation or attendance. Teachers, schedules, resources and other instructional activities could also affect pre-to-post performance. A pre-score can make one baseline comparison visible, but it does not establish comparability across the full range of relevant characteristics. Nor would a student-level covariate model remove the fact that instructional condition and class identity coincide exactly. Additional independently observed classes, stronger allocation procedures and documented implementation would be needed to support claims about a routine's effect.

The earlier Welch confidence interval illustrated another problem. Its apparently narrow uncertainty was generated by treating students as if their classroom condition had been independently assigned to each of them. Additional students within the same two classes would not provide the missing independent classroom replication. The revised analysis retains the arithmetic only as a clearly cautioned illustration of what a statistical procedure cannot repair about the underlying design.

A final limitation is the absence of real observations. The source does not include an assessment instrument, a score rubric, dates, instructional fidelity records or ethics documentation. No conclusion about the benefits of retrieval practice in an actual school follows from these fictional results.

## Conclusion

The two simulated classes show mean score increases of 9.72 and 3.30 points, with a 6.43-point difference between their descriptive mean changes. These figures demonstrate how paired measurements can be linked and checked. They also show why a comparison must be interpreted in light of the independent units and the allocation of teaching conditions. With one pre-existing class per routine, the numerical difference cannot establish that retrieval practice caused an improvement.

## References

Karpicke, J. D., & Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. *Science, 331*(6018), 772–775. https://doi.org/10.1126/science.1199327

Roediger, H. L., III, & Karpicke, J. D. (2006). Test-enhanced learning: Taking memory tests improves long-term retention. *Psychological Science, 17*(3), 249–255. https://doi.org/10.1111/j.1467-9280.2006.01693.x
