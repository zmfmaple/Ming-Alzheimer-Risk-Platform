# Alzheimer Risk Prediction Platform

## Project Overview

A web-based platform for predicting Alzheimer's disease risk using machine learning.

## Tech Stack

- **Backend**: FastAPI (Python 3.10+)
- **Frontend**: Streamlit
- **ML Libraries**: scikit-learn, XGBoost, SHAP
- **Data Processing**: pandas, matplotlib
- **PDF Reports**: reportlab

## Project Structure

```
Alzheimer-Risk-Platform/
├── CLAUDE.md
├── requirements.txt
├── data/
│   └── alzheimers_disease_data.csv
├── backend/
│   └── main.py
└── frontend/
    └── app.py
```

## Data Features

### Demographics
- Age, Gender, Ethnicity, EducationLevel

### Lifestyle
- BMI, Smoking, AlcoholConsumption, PhysicalActivity, DietQuality, SleepQuality

### Medical History
- FamilyHistoryAlzheimers, CardiovascularDisease, Diabetes, Depression, HeadInjury, Hypertension

### Physiological
- Blood Pressure (SystolicBP, DiastolicBP)
- Cholesterol (Total, LDL, HDL, Triglycerides)

### Cognitive Assessment
- **MMSE** (Mini-Mental State Examination): Primary cognitive score (0-30)
- FunctionalAssessment, MemoryComplaints, BehavioralProblems, ADL

### Symptoms
- Confusion, Disorientation, PersonalityChanges, DifficultyCompletingTasks, Forgetfulness

### Target
- Diagnosis (0/1)
