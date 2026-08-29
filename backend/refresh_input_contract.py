"""Refresh training-split input statistics stored with the deployed model."""

import json
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split

from model_config import ALL_FEATURES, CATEGORICAL_FEATURES, NUMERICAL_FEATURES


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "alzheimers_disease_data.csv"
METADATA_PATH = PROJECT_ROOT / "models" / "model_metadata.json"
REPORT_PATH = PROJECT_ROOT / "reports" / "model_evaluation" / "input_contract_audit.json"
RANDOM_STATE = 42


def main():
    frame = pd.read_csv(DATA_PATH)
    missing_columns = sorted(set(ALL_FEATURES + ["Diagnosis"]) - set(frame.columns))
    if missing_columns:
        raise ValueError(f"Dataset is missing required columns: {missing_columns}")

    x_train, _, _, _ = train_test_split(
        frame[ALL_FEATURES],
        frame["Diagnosis"].astype(int),
        test_size=0.20,
        stratify=frame["Diagnosis"].astype(int),
        random_state=RANDOM_STATE,
    )

    numerical_values = {
        feature: float(x_train[feature].median())
        for feature in NUMERICAL_FEATURES
    }
    categorical_values = {
        feature: int(x_train[feature].mode(dropna=True).iloc[0])
        for feature in CATEGORICAL_FEATURES
    }
    bounds = {
        feature: {
            "min": float(x_train[feature].min()),
            "max": float(x_train[feature].max()),
        }
        for feature in ALL_FEATURES
    }

    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    metadata["imputation"] = {
        "fit_scope": "training_split_only",
        "numerical_strategy": "median",
        "categorical_strategy": "mode",
        "values": {**numerical_values, **categorical_values},
    }
    metadata["feature_bounds"] = bounds
    metadata["random_state"] = RANDOM_STATE
    METADATA_PATH.write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    identifiers = [
        column
        for column in ("PatientID", "DoctorInCharge")
        if column in frame.columns
    ]
    report = {
        "status": "pass",
        "dataset_rows": int(len(frame)),
        "training_rows": int(len(x_train)),
        "model_feature_count": len(ALL_FEATURES),
        "target": "Diagnosis",
        "excluded_identifier_columns": identifiers,
        "imputation_fit_scope": "training_split_only",
        "missing_imputation_values": sorted(
            set(ALL_FEATURES) - set(metadata["imputation"]["values"])
        ),
    }
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
