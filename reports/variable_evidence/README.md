# BrainEcho variable evidence map

This register links the 32 deployed model fields to the questionnaire implementation.
The primary development dataset is the 2,149-row synthetic Alzheimer's Disease
Dataset published by Rabie El Kharoua on Kaggle in 2024. The dataset author states
that it was generated for educational purposes.

The mapping uses four statuses:

- `Direct`: the website answer follows the source coding.
- `Converted`: raw answers or units are converted before prediction.
- `Project-derived`: BrainEcho created an operational score because the original
  source instrument or scoring rules were not supplied.
- `Formal result`: only an externally obtained formal result is accepted.

Current totals are 20 direct variables, 7 converted variables, 4 project-derived
variables and 1 formal-result variable.

The principal measurement limitations are:

1. `DietQuality`, `SleepQuality`, `FunctionalAssessment` and `ADL` are not
   demonstrably equivalent to the source dataset's unknown scoring instruments.
2. `PhysicalActivity` is aligned to the source unit of weekly hours, but vigorous
   activity receives a BrainEcho intensity weighting.
3. Alcohol is calculated as UK units, while the source data card only says weekly
   units and does not establish an identical unit definition.
4. The diagnosis-proximal cognitive, functional and symptom variables dominate
   classification performance. They must not be used to claim prospective onset
   prediction.
5. The synthetic origin of the primary dataset prevents claims of clinical
   representativeness or external validity.

The complete user-facing table is implemented in
`frontend-react/src/pages/methodology.tsx`, with row data in
`frontend-react/src/lib/variableEvidence.ts`.

Source: https://www.kaggle.com/datasets/rabieelkharoua/alzheimers-disease-dataset
