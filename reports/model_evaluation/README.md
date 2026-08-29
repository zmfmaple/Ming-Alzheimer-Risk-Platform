# BrainEcho model evaluation

BrainEcho uses a dual-dataset strategy. The Kaggle-style questionnaire dataset
remains the deployed prototype route for the current website. NACC is reported
as supplementary longitudinal validation and as a future upgrade route. These
datasets are not directly merged because the Kaggle route estimates current
diagnosis-class membership, while the NACC public-questionnaire route evaluates
baseline information against later dementia conversion.

Model selection uses mean five-fold cross-validation F1 on the training split. The held-out test split is used once for final reporting.

The screening feature set excludes MMSE, functional assessment, ADL, memory complaints, behavioural problems, and symptom variables. Its performance is reported as a sensitivity analysis, not as a replacement for the deployed model.

Selected deployment model: **XGBoost**

The displayed probability is calibrated with Platt scaling using a held-out calibration subset of the training data. It estimates membership of the dataset's Alzheimer diagnosis class conditional on the questionnaire inputs; it is not a forecast of future disease onset.

Calibrated holdout Brier score: **0.054**

Calibrated holdout ROC-AUC: **0.940** (bootstrap 95% CI 0.907-0.969).

Calibrated holdout PR-AUC: **0.933**.

Model-score boundaries: lower probability < **0.03**, indeterminate < **0.36**, higher probability otherwise.

Internal calibration split: lower boundary targets at least 90% sensitivity; upper boundary targets at least 90% specificity.

| Feature set | Model | CV F1 | CV ROC-AUC | Holdout F1 | Holdout ROC-AUC | Specificity | Brier |
|---|---|---:|---:|---:|---:|---:|---:|
| full_questionnaire | XGBoost | 0.934 | 0.956 | 0.926 | 0.945 | 0.971 | 0.050 |
| full_questionnaire | RandomForest | 0.921 | 0.954 | 0.923 | 0.939 | 0.971 | 0.090 |
| full_questionnaire | LogisticRegression | 0.765 | 0.905 | 0.759 | 0.884 | 0.788 | 0.138 |
| screening_risk_factors | LogisticRegression | 0.452 | 0.534 | 0.416 | 0.518 | 0.493 | 0.253 |
| screening_risk_factors | RandomForest | 0.260 | 0.512 | 0.250 | 0.473 | 0.842 | 0.243 |
| screening_risk_factors | XGBoost | 0.174 | 0.510 | 0.156 | 0.464 | 0.867 | 0.252 |

A large performance difference between the full and screening feature sets indicates that diagnosis-proximal cognitive and functional variables dominate classification. This must not be presented as evidence of prospective prediction.

Calibration-bin results are saved in `calibration_bins.csv`. Age, gender, education and ethnicity subgroup results are saved in `subgroup_performance.csv`. Small subgroups must be interpreted cautiously.

## Supplementary NACC validation

The supplementary NACC public-questionnaire experiment deliberately excludes
`CDRGlobal`, `CDRSum`, `MMSE`, and `MoCA`. This tests whether a public-facing
questionnaire feature set can still support a longitudinal risk-oriented
interpretation without requiring formal clinical ratings.

Selected supplementary model: **XGBoost with Platt calibration**

Target: later dementia conversion from baseline information.

Holdout ROC-AUC: **0.821** (bootstrap 95% CI 0.807-0.834).

Holdout PR-AUC: **0.526**.

Brier Score: **0.118**.

Sensitivity / specificity at the selected threshold: **0.661 / 0.822**.

The strongest TreeSHAP contributors were MemoryComplaints, Age,
FunctionalAssessment, ADL, BMI, and FamilyHistoryAlzheimers. These explanations
describe model output, not causal effects.

The NACC model is not currently deployed in the public prediction endpoint. It
is used to support the dissertation argument that BrainEcho progressed from a
prototype dataset to supplementary longitudinal validation.
