# Aquarium Water-Condition Description

> **Synthetic teaching exemplar.** The two government water-science pages cited below are genuine sources. All aquarium measurements and protocol details in this instructional example are invented. The records do not describe water quality in any real school aquarium.

## Research question

Across seven school days, what distributions of water temperature and dissolved oxygen are observed in three classroom aquaria?

## Introduction and literature basis

Dissolved oxygen (DO) is the oxygen present in water that can be available to aquatic organisms. Its concentration depends on several environmental and biological processes. The U.S. Geological Survey (2026) explains that temperature affects how much oxygen water can hold. The U.S. Environmental Protection Agency (2026) also treats dissolved oxygen as an indicator of aquatic conditions and describes monitoring with calibrated water-quality probes. These sources support the choice of measurements and the need for careful procedure. Neither source provides observations from the three imagined aquaria.

A short monitoring study could show how these measurements vary across selected tanks and days, provided the limits of its evidence remain visible. The project therefore asks a descriptive question about conditions recorded in three aquaria over seven school days. It does not test whether temperature changes cause oxygen changes or whether a particular aquatic organism is healthy.

## Method

### Design and observation structure

The illustrative study uses a descriptive quantitative design, with three accessible aquaria selected for monitoring. Each aquarium contributes one measurement occasion on each of seven school days, producing 21 aquarium-day observations. Aquarium identity is retained throughout the record. The seven daily measurements from one tank describe the same system over time and must not be counted as seven independently sampled aquaria.

### Measurements and procedure

Water temperature is recorded in degrees Celsius (°C), and dissolved oxygen concentration in milligrams per litre (mg/L). A real study would require an appropriate thermometer and dissolved-oxygen meter, documented calibration or instrument checks, and an agreed observation schedule. Consistent depth, timing and probe handling would help make the recorded values comparable. No equipment records or calibration logs accompany the synthetic dataset, so these procedures are proposed safeguards rather than verified actions.

The source file `SYNTHETIC_AQUARIUM_MONITORING.csv` contains four columns, `aquarium`, `day`, `temperature_C` and `dissolved_oxygen_mg_L`. It has one unique row for every combination of aquarium A, B or C and numbered day 1 through 7. The values were constructed for instruction; the day numbers are a sequence in the example rather than documented calendar dates.

### Analysis plan

Describe the available values using the number of records, mean and observed range for each variable. Report these summaries across all 21 aquarium-day entries and separately for each aquarium. Line plots can retain the connection between measurements from the same aquarium while showing how the synthetic series vary over the seven days. Because the design uses convenience-selected aquaria and repeated observations, a statistical test treating 21 records as independently sampled aquaria would misrepresent the sampling structure.

## Results

<escape>All values below are synthetic.</escape> The dataset includes 21 aquarium-day records, with seven observations from each of three aquaria. Across all records, mean temperature is **23.93 °C**, with an observed range of **22.5–25.7 °C**. Mean dissolved oxygen is **7.60 mg/L**, ranging from **6.85 to 8.19 mg/L**. The overall means summarise measurements from the three selected tanks and days, with each day contributing one value per aquarium.

The aquarium-level descriptions reveal differences hidden by those pooled means. Average temperatures are **23.03 °C** in aquarium A, **23.93 °C** in B and **24.83 °C** in C. The corresponding mean dissolved-oxygen concentrations are **7.95**, **7.60** and **7.25 mg/L**. In each synthetic series, Day 7 is warmer and has a lower dissolved-oxygen reading than Day 1. These patterns arise within a deliberately constructed dataset and have no standing as observed changes in school aquaria.

The separately stored `SYNTHETIC_SUMMARY.json` records the overall means and ranges. The aquarium-specific values can be reproduced by grouping the source CSV by aquarium. None of the 21 aquarium-day combinations is missing or duplicated in the supplied file.

## Discussion and limitations

The paired direction of temperature and dissolved-oxygen changes may resemble patterns described in water-science guidance, but the example does not establish why dissolved oxygen would vary in a real tank. Oxygen concentration can be influenced by biological activity, aeration and other conditions, none of which is documented here. A shared pattern across the three invented series cannot substitute for a study of the processes involved.

Several features would further constrain a real investigation with this design. Three accessible aquaria would not represent a probability sample of aquatic environments. Seven days would provide a limited observation period, while readings from the same aquarium would remain related to one another. Without calibration records, probe specifications or environmental notes, even a real set of numerical readings would require more care before interpreting changes. These limitations are especially important here because **the observations are entirely invented**.

The instructional value lies in showing how a descriptive question shapes the dataset and the claims drawn from it. Aquarium and day identifiers preserve the measurement structure, separate summaries reveal differences among systems, and the final account remains proportionate to the evidence.

## Conclusion

The synthetic records illustrate the description of temperature and dissolved oxygen across three repeatedly observed aquaria. They demonstrate how to report pooled and aquarium-level patterns without assigning causes or treating repeated observations as independent systems. No claim about the condition of a real classroom aquarium follows from the example.

## References

U.S. Environmental Protection Agency. (2026, February 24). *Indicators: Dissolved oxygen*. https://www.epa.gov/national-aquatic-resource-surveys/indicators-dissolved-oxygen

U.S. Geological Survey. (2026, August 24). *Dissolved oxygen and water*. Water Science School. https://www.usgs.gov/water-science-school/science/dissolved-oxygen-and-water

The dates reflect the official pages' displayed update or page dates at this audit, rather than independently established original-publication dates.
