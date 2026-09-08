# Synthetic Teaching Exemplar

## Assigned Sodium Chloride Concentration and Early Radicle Growth in Radish Seeds

> **Instructional status.** This paper demonstrates how a research project can remain aligned from question through conclusion. The literature citations below are real and verified. The procedure details, dataset, statistical results, and findings are synthetic teaching material. They do not document an actual conducted experiment and should not be cited as empirical evidence.

## Abstract

This synthetic instructional exemplar demonstrates an experimental research workflow using radish seed germination. Eighteen Petri dishes were assigned to 0, 50, or 100 mM sodium chloride (NaCl), with five seed subsamples per dish. The primary outcome was mean radicle length per dish after 72 hours. In the synthetic dataset, mean radicle length declined across increasing NaCl conditions, and Welch one-way analysis of variance indicated differences among treatment means, *F*(2, 9.97) = 342.91, *p* < .001. The prespecified 0 versus 100 mM raw mean difference was 18.13 mm, 95% CI [16.63, 19.64]. These invented data illustrate how treatment assignment, experimental-unit reasoning, analysis, and claim boundaries connect. They are not empirical evidence about radish salinity tolerance.

**Keywords** salinity, radish, *Raphanus sativus*, radicle growth, experimental design, synthetic teaching data

## Introduction

Salinity can constrain plant growth through osmotic and ionic stress, although the magnitude and mechanisms of tolerance vary among species, developmental stages, and environmental conditions (Munns & Tester, 2008). Broader crop research likewise treats salinity as an important limitation on growth and yield while emphasizing that tolerance involves biological costs and context-dependent adaptations (Munns & Gilliham, 2015). These claims justify studying salinity as a biologically meaningful stressor without implying that one short experiment can represent all crop responses.

Species-relevant research also provides a more specific basis for an early radish-growth study. Toscano et al. (2025) experimentally examined temperature and saline water-potential conditions during rocket and radish germination and reported that radish germination and radicle growth varied with salinity-related conditions. Their design and treatment scale differ from the simplified classroom protocol used in this exemplar, so their findings provide background and comparison rather than an expected numerical result for the present dataset.

The instructional study therefore uses a replication/extension rationale. It asks how one controlled set of assigned NaCl conditions would relate to early radicle growth in a defined seed batch under a standardized short-term protocol. The research question is: Under standardized germination conditions, how does assigned NaCl concentration (0, 50, or 100 mM) affect mean radicle length per dish after 72 hours in radish (*Raphanus sativus*) seeds?

## Method

### Design

The exemplar uses a completely randomized experimental design. Eighteen Petri dishes serve as independent experimental units. Six dishes are assigned to each of three NaCl concentrations, 0, 50, and 100 mM. Five seeds are placed within each dish. Because the treatment is assigned to the dish, the five seeds are subsamples and do not count as five independent treatment replicates.

### Sample and materials

The synthetic protocol assumes 90 radish seeds from one accessible commercial seed lot. This convenience biological sample does not support generalization to all radish cultivars or field conditions. Materials include 18 labeled Petri dishes, germination substrate, prepared NaCl solutions, distilled water, a consistent solution volume, labels, and a millimeter measurement scale.

### Variables and measurement

Assigned NaCl concentration is the manipulated independent variable. The primary outcome is mean radicle length per dish after 72 hours. Each germinated seed is measured from the point at which the radicle emerges from the seed coat to the radicle tip. The mean of the germinated-seed measurements within each dish produces one dish-level primary outcome. Germination proportion per dish is retained as a secondary descriptive outcome.

### Procedure

Dishes are labeled with neutral IDs and randomly assigned to 0, 50, or 100 mM NaCl. Five seeds are placed in each dish. The same substrate, solution volume, incubation duration, temperature range, lighting conditions, and measurement procedure are used across treatments. At 72 hours, germination status and radicle length are recorded for each seed. The raw seed-level file retains `seed_id` and `dish_id`. A second analysis table contains one row per dish, including treatment concentration, germination proportion, and mean radicle length.

### Analysis

The primary estimand is the difference in mean dish-level radicle length among the three assigned NaCl concentrations. Welch one-way analysis of variance is used because the outcome is numerical and the three treatment groups contain different independent dishes. A prespecified secondary Welch comparison contrasts 0 and 100 mM to provide a directly interpretable raw difference in millimeters. The analysis uses the 18 dish-level observations rather than treating 90 seed subsamples as independent treatment replicates.

## Results

All values in this section are synthetic. Mean dish-level radicle length was 34.70 mm (SD = 1.21) at 0 mM NaCl, 26.78 mm (SD = 1.30) at 50 mM, and 16.57 mm (SD = 1.13) at 100 mM. Welch one-way analysis of variance indicated differences among condition means, *F*(2, 9.97) = 342.91, *p* < .001.

The prespecified 0 versus 100 mM contrast produced a raw mean difference of 18.13 mm, 95% CI [16.63, 19.64]. Mean dish-level germination proportions were 1.00, 0.93, and 0.73 at 0, 50, and 100 mM, respectively. Germination proportion is reported descriptively in this exemplar.

## Discussion

Within the synthetic teaching dataset, assigned NaCl concentration corresponded to progressively lower mean radicle length per dish. The direction is consistent with literature describing salinity as a constraint on plant growth and with species-relevant work showing that radish germination and radicle development respond to saline germination conditions (Munns & Tester, 2008; Toscano et al., 2025). Osmotic and ionic stress provide biologically plausible explanations for such a pattern, although neither mechanism is measured directly in this exemplar.

Several limits constrain interpretation even if the data had been collected. The assumed sample comes from one commercial seed lot, the outcome covers only 72 hours of early germination, and the environmental conditions are simplified laboratory conditions. Dish-to-dish environmental variation and measurement error could still contribute to observed variation. Most importantly, the numerical observations are invented for instruction. The estimates therefore cannot be used as empirical evidence of the size of a salinity effect in radish.

The educational value of the example lies in the alignment of the reasoning chain. Treatment is assigned at the dish level, so the dish remains the experimental unit in the analysis. The raw seed measurements are retained without inflating the independent sample size. The statistical method follows the unit structure and outcome type, and the final claim remains limited to the design represented in the exemplar.

## Conclusion

This synthetic exemplar demonstrates how a controlled plant-growth question can be translated into an experimental design, unit-aware dataset, statistical analysis, and calibrated conclusion. The invented results display lower mean radicle length at higher assigned NaCl concentrations, but they are teaching data and cannot establish a real biological effect size. The main methodological lesson is that the research question, treatment assignment, experimental unit, data table, analysis, and conclusion must remain consistent with one another.

## References

Munns, R., & Gilliham, M. (2015). Salinity tolerance of crops – what is the cost? *New Phytologist, 208*(3), 668–673. https://doi.org/10.1111/nph.13519

Munns, R., & Tester, M. (2008). Mechanisms of salinity tolerance. *Annual Review of Plant Biology, 59*, 651–681. https://doi.org/10.1146/annurev.arplant.59.032607.092911

Toscano, S., Romano, D., Cafaro, V., & Patanè, C. (2025). Annual Garden Rocket and Radish as microgreens: Seed germination response to thermal and salt stress. *Agronomy, 15*(2), 361. https://doi.org/10.3390/agronomy15020361
