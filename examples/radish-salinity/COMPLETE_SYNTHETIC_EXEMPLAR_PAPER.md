# Synthetic Teaching Exemplar

## Assigned Sodium Chloride Concentration and Early Radicle Growth in Radish Seeds

> **Instructional status.** This paper demonstrates how a research project can remain aligned from question through conclusion. The literature citations below are real and verified. The procedure details, dataset, statistical results, and findings are synthetic teaching material. They do not document an actual conducted experiment and should not be cited as empirical evidence. This 72-hour radicle-length study is a separate illustration from the Day 7 shoot-length examples elsewhere in the Studio.

## Abstract

This synthetic instructional exemplar follows a randomised design for comparing early radicle development in radish seeds across assigned sodium chloride (NaCl) conditions. Eighteen independently treated Petri dishes received 0, 50 or 100 mM NaCl, with five seed subsamples per dish. The primary outcome was the dish-level mean radicle length among germinated seeds after 72 hours. The synthetic group means declined across increasing concentrations, and a Welch one-way analysis of variance indicated differences among the dish-level means, *F*(2, 9.97) = 342.91, *p* < .001. The prespecified 0 versus 100 mM comparison yielded a mean difference of 18.13 mm, 95% CI [16.63, 19.64]. Because germination proportions also varied by treatment, the conditional length outcome does not distinguish effects on germination from differences in elongation among all planted seeds. These invented data illustrate experimental-unit reasoning and careful inference; they provide no empirical evidence about radish salinity tolerance.

**Keywords** salinity, radish, *Raphanus sativus*, radicle growth, experimental design, synthetic teaching data

## Introduction

Salinity can constrain plant growth through osmotic and ionic stress, although the magnitude and mechanisms of tolerance vary among species, developmental stages, and environmental conditions (Munns & Tester, 2008). Broader crop research likewise treats salinity as an important limitation on growth and yield while emphasising that tolerance involves biological costs and context-dependent adaptations (Munns & Gilliham, 2015). These claims justify studying salinity as a biologically meaningful stressor without implying that one short experiment can represent all crop responses.

Species-relevant research also provides a more specific basis for an early radish-growth study. Toscano et al. (2025) experimentally examined temperature and saline water-potential conditions during rocket and radish germination and reported that radish germination and radicle growth varied with salinity-related conditions. Their design and treatment scale differ from the simplified classroom protocol used in this exemplar, so their findings provide background and comparison rather than an expected numerical result for the present dataset.

The instructional design is a local extension of established salinity research, with a simpler protocol and different treatment conditions rather than a direct replication of an earlier study. Under standardised germination conditions, how does mean radicle length among germinated radish (*Raphanus sativus*) seeds after 72 hours differ across dishes independently assigned to 0, 50 or 100 mM NaCl?

## Method

### Design

The exemplar uses a completely randomised experimental design. Eighteen Petri dishes serve as independent experimental units. Six dishes are assigned to each of three NaCl concentrations, 0, 50, and 100 mM. Five seeds are placed within each dish. Because the treatment is assigned to the dish, the five seeds are subsamples and do not count as five independent treatment replicates.

### Sample and materials

The synthetic protocol assumes 90 radish seeds from one accessible commercial seed lot. This convenience biological sample does not support generalisation to all radish cultivars or field conditions. Materials include 18 labelled Petri dishes, germination substrate, prepared NaCl solutions, distilled water, a consistent solution volume, labels, and a millimetre measurement scale.

### Variables and measurement

Assigned NaCl concentration is the manipulated independent variable. At 72 hours, the radicle of each germinated seed is measured from its emergence point at the seed coat to the tip. The primary outcome is the mean of those lengths within each independently treated dish. Ungerminated seeds have no radicle length, so the raw dataset records a blank value rather than assigning them a length of zero. Germination proportion is retained for every dish as a separate descriptive outcome. Because the length mean is conditional on germination, it cannot by itself distinguish a treatment-related difference in germination from a difference in elongation among all planted seeds.

### Procedure

Dishes are labelled with neutral IDs and randomly assigned to 0, 50, or 100 mM NaCl. Five seeds are placed in each dish. The same substrate, solution volume, incubation duration, temperature range, lighting conditions, and measurement procedure are used across treatments. At 72 hours, germination status is recorded for each seed and radicle length for those that germinated. The raw seed-level file retains `seed_id` and `dish_id`. A second analysis table contains one row per dish, including treatment concentration, germination proportion, and the mean length among germinated seeds. A dish in which no seed germinates would have an undefined conditional mean and would require handling according to a rule specified before analysing the data. No such dish occurs in the synthetic dataset.

### Analysis

The primary analysis compares the mean dish-level radicle length among germinated seeds across the three NaCl concentrations. Welch one-way analysis of variance is used for this numerical outcome across independent dishes without assuming equal group variances. A prespecified secondary Welch comparison contrasts 0 and 100 mM, reporting a raw difference in millimetres and its uncertainty. The analysis uses 18 dish-level observations rather than treating 90 nested seed records as independent treatment replicates. Six dishes per group provide limited information for checking model assumptions, and the conditional outcome should be interpreted alongside treatment differences in germination.

## Results

All values in this section are synthetic. Mean dish-level radicle length was 34.70 mm (SD = 1.21) at 0 mM NaCl, 26.78 mm (SD = 1.30) at 50 mM, and 16.57 mm (SD = 1.13) at 100 mM. Welch one-way analysis of variance indicated differences among condition means, *F*(2, 9.97) = 342.91, *p* < .001.

The prespecified 0 versus 100 mM contrast produced a raw mean difference of 18.13 mm, 95% CI [16.63, 19.64]. Mean dish-level germination proportions were 1.00, 0.93 and 0.73 at 0, 50 and 100 mM, respectively. Ten of the 90 planted seeds did not germinate in the synthetic records, two at 50 mM and eight at 100 mM. Their radicle lengths are inapplicable rather than measured as zero. Germination proportion is reported descriptively, and all 18 dishes have a defined conditional radicle-length mean.

## Discussion

Across the synthetic dish-level records, mean radicle length among germinated seeds was lower in the higher-NaCl groups. That direction is compatible with published research on salinity and radish germination, although the example was deliberately constructed and supplies no independent evidence of a biological effect (Munns & Tester, 2008; Toscano et al., 2025). Osmotic and ionic stress are possible mechanisms suggested by the literature. Neither was measured by these synthetic length observations.

The definition of the primary outcome creates an additional interpretive boundary. Lengths are averaged only for seeds that germinated, even though the proportion germinating differs across groups. Such a comparison does not isolate changes in radicle elongation independently of germination. The design also uses one seed lot, six independent dishes per treatment, a short observation window and simplified environmental conditions. A real experiment would need to examine uncertainty, measurement error and the effects of any departures from the planned conditions. Here, every numerical observation is invented for instruction and cannot estimate a biological effect in radish.

The example illustrates how an experimental question leads to choices about measurement and analysis. Assigning treatment to dishes establishes the independent unit, while retaining linked seed measurements permits the dish means to be checked. Reporting germination separately makes the conditional nature of the length outcome visible. The statistical model can then be evaluated against the actual unit structure and the biological question, rather than treating a mathematically reproducible result as sufficient evidence on its own.

## Conclusion

The synthetic comparison illustrates how to connect a research question with treatment assignment, linked measurements and a dish-level statistical analysis. In the invented data, mean radicle length among germinated seeds is lower at higher NaCl concentrations, while germination proportions also differ. The example cannot establish a real biological effect. Its value is in showing why the outcome's definition and the independent unit must remain visible when interpreting results.

## References

Munns, R., & Gilliham, M. (2015). Salinity tolerance of crops – what is the cost? *New Phytologist, 208*(3), 668–673. https://doi.org/10.1111/nph.13519

Munns, R., & Tester, M. (2008). Mechanisms of salinity tolerance. *Annual Review of Plant Biology, 59*, 651–681. https://doi.org/10.1146/annurev.arplant.59.032607.092911

Toscano, S., Romano, D., Cafaro, V., & Patanè, C. (2025). Annual garden rocket and radish as microgreens: Seed germination response to thermal and salt stress. *Agronomy, 15*(2), 361. https://doi.org/10.3390/agronomy15020361
