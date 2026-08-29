# Chapter 3: Methodology and Experimental Design

## 3.1 Chapter purpose

This chapter describes how BrainEcho converts questionnaire responses into a reproducible machine-learning experiment. The chapter separates data preparation, model development, probability calibration, explanation and system implementation. This separation is necessary because a technically functioning website does not by itself demonstrate that the displayed probability is valid.

## 3.2 Dataset strategy

The primary modelling dataset is the structured Alzheimer disease dataset obtained through Kaggle. It contains demographic, lifestyle, medical, physiological, cognitive, functional and symptom variables. `Diagnosis` is used as the binary target. `PatientID` and `DoctorInCharge` are excluded because they identify records or administrative responsibility rather than patient risk.

OASIS-1 is retained as a documented dataset-selection case. Its missingness and imaging-oriented structure limit direct use in the questionnaire model. OASIS-2 is treated as a supplementary longitudinal dataset. Repeated visits are identified by subject, MRI identifier and visit number. OASIS-2 is not merged row by row with the primary dataset because the cohorts, variables, measurement procedures and outcome definitions differ.

## 3.3 Data audit and preprocessing

The data audit checks required columns, duplicate records, missing values, target coding and class distribution. The dataset is divided using an 80/20 stratified split with random seed 42. The test split remains independent of model selection and probability calibration.

Continuous variables are standardised within each training procedure. Missing questionnaire values are not interpreted as normal responses. Numerical variables are replaced by medians calculated from the training split. Categorical variables are replaced by training-split modes. The system records the original missing state, the substituted model value and the source of that value.

## 3.4 Feature groups

The 32 model inputs are organised into demographic, lifestyle, medical history, physiological, cognitive, functional and symptom groups. MMSE, ADL, functional assessment, memory complaints, behavioural problems and symptom variables are treated as diagnosis-adjacent variables. They may support cross-sectional classification but can overstate the apparent ability to identify future disease risk.

## 3.5 Model development

Logistic Regression provides an interpretable baseline. Random Forest represents a nonlinear ensemble model. XGBoost represents a boosted-tree model that can learn interactions without a deep-learning architecture. Candidate models are compared using five-fold stratified cross-validation within the training split. The principal selection measure is mean F1 score. ROC-AUC, precision, recall, specificity and balanced accuracy provide supporting evidence.

## 3.6 Probability calibration

The selected XGBoost model is fitted on a subset of the training data. Platt scaling is then fitted on a separate calibration subset. Calibration is assessed on the untouched test split using the Brier Score and a reliability plot. The displayed Alzheimer’s Risk Probability is therefore an internally calibrated probability of membership in the dataset diagnosis class. It is not an estimate of disease incidence over a future period.

## 3.7 Sensitivity analysis

Feature-ablation experiments retrain XGBoost after removing MMSE, ADL, both variables, all three cognitive and functional scores, and all diagnosis-adjacent variables. The same random seed and holdout split are retained. Changes in ROC-AUC, PR-AUC and Brier Score measure the model’s dependence on these variables.

The comparison between the full questionnaire and the screening-only model is central to interpretation. A substantial reduction in discrimination indicates that high full-model performance comes mainly from variables that describe current cognitive or functional impairment. This result limits claims about early or prospective risk prediction.

## 3.8 Explainability

SHAP is used for local explanations. Positive values raise the model output relative to its baseline, while negative values lower it. Each explanation reports whether the value was supplied, derived or imputed. SHAP describes the fitted model’s associations. It does not show that changing a variable would cause a change in Alzheimer disease risk.

## 3.9 System integration

The React questionnaire sends validated values and missing-state metadata to the FastAPI service. The service applies the saved preprocessing contract, returns raw and calibrated probabilities, computes a missing-information sensitivity range and produces local SHAP explanations. Authenticated assessments store the raw questionnaire separately from the values supplied to the model.

## 3.10 Evaluation boundaries

The study uses internal validation on one public dataset. It does not include external clinical validation, prospective follow-up or evaluation across healthcare settings. BrainEcho is therefore evaluated as a proof-of-concept classification and explanation system. Claims are limited to reproducibility, internal discrimination, internal calibration and transparent communication of uncertainty.
