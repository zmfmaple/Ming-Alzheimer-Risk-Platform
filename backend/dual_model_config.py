"""Configuration for BrainEcho dual-source Kaggle + NACC model evidence."""

SHARED_DUAL_MODEL_FEATURES = [
    "ADL",
    "Age",
    "BMI",
    "BehavioralProblems",
    "Depression",
    "Diabetes",
    "DiastolicBP",
    "DifficultyCompletingTasks",
    "Disorientation",
    "EducationLevel",
    "Ethnicity",
    "FamilyHistoryAlzheimers",
    "FunctionalAssessment",
    "Gender",
    "Hypertension",
    "MemoryComplaints",
    "Smoking",
    "SystolicBP",
]

NACC_ONLY_OPTIONAL_FEATURES = [
    "Apathy",
    "DepressiveSymptoms",
    "Hypercholesterolemia",
    "PsychoticSymptoms",
    "SleepAppetiteSymptoms",
]

NACC_REQUIRED_FEATURES = SHARED_DUAL_MODEL_FEATURES + NACC_ONLY_OPTIONAL_FEATURES

SOURCE_SEPARATION_NOTE = (
    "Kaggle and NACC outputs are source-specific model evidence. They use "
    "different targets, cohorts and temporal meanings, so BrainEcho reports "
    "them separately rather than fusing them into a single clinical probability."
)
