"""Train and evaluate the BrainEcho tabular risk-classification model."""

from __future__ import annotations

import json
import pickle
import shutil
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import shap
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from model_config import (
    ALL_FEATURES,
    CATEGORICAL_FEATURES,
    DIAGNOSIS_PROXIMAL_FEATURES,
    NUMERICAL_FEATURES,
    SCREENING_FEATURES,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "alzheimers_disease_data.csv"
MODEL_DIR = PROJECT_ROOT / "models"
REPORT_DIR = PROJECT_ROOT / "reports" / "model_evaluation"
RANDOM_STATE = 42


def logit(probabilities: np.ndarray) -> np.ndarray:
    clipped = np.clip(np.asarray(probabilities, dtype=float), 1e-6, 1 - 1e-6)
    return np.log(clipped / (1 - clipped)).reshape(-1, 1)


def bootstrap_interval(
    y_true: pd.Series,
    probabilities: np.ndarray,
    metric,
    iterations: int = 500,
) -> list[float]:
    rng = np.random.default_rng(RANDOM_STATE)
    y_array = np.asarray(y_true)
    values = []
    for _ in range(iterations):
        indices = rng.integers(0, len(y_array), len(y_array))
        sampled_y = y_array[indices]
        if len(np.unique(sampled_y)) < 2:
            continue
        values.append(float(metric(sampled_y, probabilities[indices])))
    return [
        float(np.quantile(values, 0.025)),
        float(np.quantile(values, 0.975)),
    ]


def calibration_table(
    y_true: pd.Series,
    probabilities: np.ndarray,
) -> pd.DataFrame:
    frame = pd.DataFrame({
        "observed": np.asarray(y_true),
        "probability": probabilities,
    })
    frame["bin"] = pd.cut(
        frame["probability"],
        bins=np.linspace(0, 1, 11),
        include_lowest=True,
    )
    return (
        frame.groupby("bin", observed=False)
        .agg(
            sample_count=("observed", "size"),
            mean_predicted_probability=("probability", "mean"),
            observed_positive_rate=("observed", "mean"),
        )
        .reset_index()
        .assign(bin=lambda value: value["bin"].astype(str))
    )


def subgroup_table(
    x_test: pd.DataFrame,
    y_test: pd.Series,
    probabilities: np.ndarray,
    threshold: float,
) -> pd.DataFrame:
    evaluation = x_test.copy()
    evaluation["Diagnosis"] = np.asarray(y_test)
    evaluation["probability"] = probabilities
    evaluation["AgeGroup"] = pd.cut(
        evaluation["Age"],
        bins=[59, 69, 79, 100],
        labels=["60-69", "70-79", "80-100"],
    )
    groupings = {
        "AgeGroup": "AgeGroup",
        "Gender": "Gender",
        "EducationLevel": "EducationLevel",
        "Ethnicity": "Ethnicity",
    }
    rows = []
    for dimension, column in groupings.items():
        for group, subset in evaluation.groupby(column, observed=False):
            if subset.empty:
                continue
            predicted = (subset["probability"] >= threshold).astype(int)
            has_both_classes = subset["Diagnosis"].nunique() == 2
            rows.append({
                "dimension": dimension,
                "group": str(group),
                "sample_count": int(len(subset)),
                "positive_count": int(subset["Diagnosis"].sum()),
                "roc_auc": (
                    float(roc_auc_score(subset["Diagnosis"], subset["probability"]))
                    if has_both_classes else None
                ),
                "brier": float(
                    brier_score_loss(subset["Diagnosis"], subset["probability"])
                ),
                "sensitivity": float(
                    recall_score(subset["Diagnosis"], predicted, zero_division=0)
                ),
                "specificity": specificity_score(subset["Diagnosis"], predicted),
            })
    return pd.DataFrame(rows)


def specificity_score(y_true, y_pred) -> float:
    tn, fp, _, _ = confusion_matrix(y_true, y_pred, labels=[0, 1]).ravel()
    return float(tn / (tn + fp)) if tn + fp else 0.0


def validate_data(frame: pd.DataFrame) -> dict:
    required = set(ALL_FEATURES + ["Diagnosis", "PatientID", "DoctorInCharge"])
    missing_columns = sorted(required.difference(frame.columns))
    if missing_columns:
        raise ValueError(f"Missing required columns: {missing_columns}")

    feature_frame = frame[ALL_FEATURES]
    if feature_frame.isna().any().any():
        missing = feature_frame.isna().sum()
        raise ValueError(f"Unexpected missing values: {missing[missing > 0].to_dict()}")

    if not set(frame["Diagnosis"].unique()).issubset({0, 1}):
        raise ValueError("Diagnosis must be binary and coded as 0/1.")

    return {
        "rows": int(len(frame)),
        "columns": int(len(frame.columns)),
        "duplicate_patient_ids": int(frame["PatientID"].duplicated().sum()),
        "missing_cells": int(frame.isna().sum().sum()),
        "constant_columns": [
            column for column in frame.columns if frame[column].nunique(dropna=False) <= 1
        ],
        "class_counts": {
            str(key): int(value)
            for key, value in frame["Diagnosis"].value_counts().sort_index().items()
        },
    }


def model_candidates() -> dict:
    return {
        "LogisticRegression": LogisticRegression(
            max_iter=2000,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=400,
            max_depth=10,
            min_samples_leaf=4,
            class_weight="balanced_subsample",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=300,
            max_depth=4,
            learning_rate=0.04,
            subsample=0.85,
            colsample_bytree=0.85,
            eval_metric="logloss",
            random_state=RANDOM_STATE,
            n_jobs=-1,
        ),
    }


def preprocessing_pipeline(features: list[str], model) -> Pipeline:
    numerical = [feature for feature in features if feature in NUMERICAL_FEATURES]
    preprocessor = ColumnTransformer(
        [("numerical", StandardScaler(), numerical)],
        remainder="passthrough",
        verbose_feature_names_out=False,
    )
    return Pipeline([("preprocessor", preprocessor), ("model", model)])


def evaluate_candidate(
    name: str,
    model,
    feature_set_name: str,
    features: list[str],
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    y_test: pd.Series,
) -> dict:
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    pipeline = preprocessing_pipeline(features, clone(model))
    scoring = {
        "accuracy": "accuracy",
        "balanced_accuracy": "balanced_accuracy",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
        "roc_auc": "roc_auc",
    }
    scores = cross_validate(
        pipeline,
        x_train[features],
        y_train,
        cv=cv,
        scoring=scoring,
        n_jobs=-1,
        return_train_score=False,
    )

    pipeline.fit(x_train[features], y_train)
    predictions = pipeline.predict(x_test[features])
    probabilities = pipeline.predict_proba(x_test[features])[:, 1]

    result = {
        "feature_set": feature_set_name,
        "feature_count": len(features),
        "model": name,
        "cv_accuracy_mean": float(scores["test_accuracy"].mean()),
        "cv_accuracy_std": float(scores["test_accuracy"].std()),
        "cv_balanced_accuracy_mean": float(scores["test_balanced_accuracy"].mean()),
        "cv_precision_mean": float(scores["test_precision"].mean()),
        "cv_recall_mean": float(scores["test_recall"].mean()),
        "cv_f1_mean": float(scores["test_f1"].mean()),
        "cv_f1_std": float(scores["test_f1"].std()),
        "cv_roc_auc_mean": float(scores["test_roc_auc"].mean()),
        "holdout_accuracy": float(accuracy_score(y_test, predictions)),
        "holdout_balanced_accuracy": float(
            balanced_accuracy_score(y_test, predictions)
        ),
        "holdout_precision": float(precision_score(y_test, predictions)),
        "holdout_recall": float(recall_score(y_test, predictions)),
        "holdout_specificity": specificity_score(y_test, predictions),
        "holdout_f1": float(f1_score(y_test, predictions)),
        "holdout_roc_auc": float(roc_auc_score(y_test, probabilities)),
        "holdout_pr_auc": float(average_precision_score(y_test, probabilities)),
        "holdout_brier": float(brier_score_loss(y_test, probabilities)),
    }
    return result


def fit_deployment_artifacts(
    model_name: str,
    model,
    x_train: pd.DataFrame,
    y_train: pd.Series,
    x_test: pd.DataFrame,
    y_test: pd.Series,
) -> tuple:
    feature_names = list(ALL_FEATURES)
    numerical = [feature for feature in feature_names if feature in NUMERICAL_FEATURES]

    x_fit, x_calibration, y_fit, y_calibration = train_test_split(
        x_train,
        y_train,
        test_size=0.25,
        stratify=y_train,
        random_state=RANDOM_STATE,
    )

    scaler = StandardScaler()
    transformed = x_fit[feature_names].copy()
    transformed[numerical] = scaler.fit_transform(transformed[numerical])

    fitted_model = clone(model)
    fitted_model.fit(transformed, y_fit)

    calibration_frame = x_calibration[feature_names].copy()
    calibration_frame[numerical] = scaler.transform(calibration_frame[numerical])
    raw_calibration_probabilities = fitted_model.predict_proba(calibration_frame)[:, 1]
    probability_calibrator = LogisticRegression(random_state=RANDOM_STATE)
    probability_calibrator.fit(logit(raw_calibration_probabilities), y_calibration)
    calibrated_probabilities = probability_calibrator.predict_proba(
        logit(raw_calibration_probabilities)
    )[:, 1]

    candidate_thresholds = np.linspace(0.01, 0.99, 99)
    low_candidates = []
    high_candidates = []
    for threshold in candidate_thresholds:
        predicted = (calibrated_probabilities >= threshold).astype(int)
        sensitivity = recall_score(y_calibration, predicted, zero_division=0)
        specificity = specificity_score(y_calibration, predicted)
        if sensitivity >= 0.90:
            low_candidates.append(float(threshold))
        if specificity >= 0.90:
            high_candidates.append(float(threshold))

    lower_threshold = max(low_candidates) if low_candidates else 0.30
    upper_threshold = min(high_candidates) if high_candidates else 0.70
    if lower_threshold >= upper_threshold:
        lower_threshold = float(np.quantile(calibrated_probabilities, 0.35))
        upper_threshold = float(np.quantile(calibrated_probabilities, 0.65))

    test_frame = x_test[feature_names].copy()
    test_frame[numerical] = scaler.transform(test_frame[numerical])
    raw_test_probabilities = fitted_model.predict_proba(test_frame)[:, 1]
    calibrated_test_probabilities = probability_calibrator.predict_proba(
        logit(raw_test_probabilities)
    )[:, 1]
    calibrated_predictions = (
        calibrated_test_probabilities >= upper_threshold
    ).astype(int)
    calibration_metrics = {
        "method": "Platt scaling on an internal calibration split",
        "fit_rows": int(len(x_fit)),
        "calibration_rows": int(len(x_calibration)),
        "holdout_brier_calibrated": float(
            brier_score_loss(y_test, calibrated_test_probabilities)
        ),
        "holdout_roc_auc_calibrated": float(
            roc_auc_score(y_test, calibrated_test_probabilities)
        ),
        "holdout_pr_auc_calibrated": float(
            average_precision_score(y_test, calibrated_test_probabilities)
        ),
        "holdout_roc_auc_95ci": bootstrap_interval(
            y_test,
            calibrated_test_probabilities,
            roc_auc_score,
        ),
        "holdout_brier_95ci": bootstrap_interval(
            y_test,
            calibrated_test_probabilities,
            brier_score_loss,
        ),
        "holdout_sensitivity_at_upper_threshold": float(
            recall_score(y_test, calibrated_predictions, zero_division=0)
        ),
        "holdout_specificity_at_upper_threshold": specificity_score(
            y_test, calibrated_predictions
        ),
        "calibrator_intercept": float(probability_calibrator.intercept_[0]),
        "calibrator_slope": float(probability_calibrator.coef_[0][0]),
    }
    risk_thresholds = {
        "lower": round(lower_threshold, 4),
        "upper": round(upper_threshold, 4),
        "method": (
            "Internal calibration split: lower boundary targets at least 90% "
            "sensitivity; upper boundary targets at least 90% specificity."
        ),
    }

    if model_name == "LogisticRegression":
        explainer = shap.LinearExplainer(fitted_model, transformed)
    else:
        explainer = shap.TreeExplainer(fitted_model)

    return (
        fitted_model,
        scaler,
        feature_names,
        explainer,
        probability_calibrator,
        calibration_metrics,
        risk_thresholds,
        calibrated_test_probabilities,
    )


def write_reports(
    results: pd.DataFrame,
    audit: dict,
    selected: dict,
    calibration_metrics: dict,
    risk_thresholds: dict,
    calibration_bins: pd.DataFrame,
    subgroup_results: pd.DataFrame,
) -> None:
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    results.to_csv(REPORT_DIR / "model_comparison.csv", index=False)
    (REPORT_DIR / "data_audit.json").write_text(
        json.dumps(audit, indent=2), encoding="utf-8"
    )
    calibration_bins.to_csv(REPORT_DIR / "calibration_bins.csv", index=False)
    subgroup_results.to_csv(REPORT_DIR / "subgroup_performance.csv", index=False)

    lines = [
        "# BrainEcho model evaluation",
        "",
        "Model selection uses mean five-fold cross-validation F1 on the training split. "
        "The held-out test split is used once for final reporting.",
        "",
        "The screening feature set excludes MMSE, functional assessment, ADL, memory "
        "complaints, behavioural problems, and symptom variables. Its performance is "
        "reported as a sensitivity analysis, not as a replacement for the deployed model.",
        "",
        f"Selected deployment model: **{selected['model']}**",
        "",
        "The displayed probability is calibrated with Platt scaling using a held-out "
        "calibration subset of the training data. It estimates membership of the "
        "dataset's Alzheimer diagnosis class conditional on the questionnaire inputs; "
        "it is not a forecast of future disease onset.",
        "",
        f"Calibrated holdout Brier score: "
        f"**{calibration_metrics['holdout_brier_calibrated']:.3f}**",
        "",
        f"Calibrated holdout ROC-AUC: "
        f"**{calibration_metrics['holdout_roc_auc_calibrated']:.3f}** "
        f"(bootstrap 95% CI "
        f"{calibration_metrics['holdout_roc_auc_95ci'][0]:.3f}-"
        f"{calibration_metrics['holdout_roc_auc_95ci'][1]:.3f}).",
        "",
        f"Calibrated holdout PR-AUC: "
        f"**{calibration_metrics['holdout_pr_auc_calibrated']:.3f}**.",
        "",
        f"Model-score boundaries: lower probability < **{risk_thresholds['lower']:.2f}**, "
        f"indeterminate < **{risk_thresholds['upper']:.2f}**, higher probability otherwise.",
        "",
        risk_thresholds["method"],
        "",
        "| Feature set | Model | CV F1 | CV ROC-AUC | Holdout F1 | Holdout ROC-AUC | Specificity | Brier |",
        "|---|---|---:|---:|---:|---:|---:|---:|",
    ]
    for _, row in results.iterrows():
        lines.append(
            f"| {row['feature_set']} | {row['model']} | {row['cv_f1_mean']:.3f} | "
            f"{row['cv_roc_auc_mean']:.3f} | {row['holdout_f1']:.3f} | "
            f"{row['holdout_roc_auc']:.3f} | {row['holdout_specificity']:.3f} | "
            f"{row['holdout_brier']:.3f} |"
        )
    lines.extend(
        [
            "",
            "A large performance difference between the full and screening feature sets "
            "indicates that diagnosis-proximal cognitive and functional variables dominate "
            "classification. This must not be presented as evidence of prospective prediction.",
            "",
            "Calibration-bin results are saved in `calibration_bins.csv`. Age, gender, "
            "education and ethnicity subgroup results are saved in "
            "`subgroup_performance.csv`. Small subgroups must be interpreted cautiously.",
        ]
    )
    (REPORT_DIR / "README.md").write_text("\n".join(lines), encoding="utf-8")


def save_artifacts(
    model,
    scaler,
    feature_names,
    explainer,
    probability_calibrator,
    metadata: dict,
) -> None:
    temporary = MODEL_DIR / ".training_output"
    if temporary.exists():
        shutil.rmtree(temporary)
    temporary.mkdir(parents=True)

    objects = {
        "alzheimers_model.pkl": model,
        "scaler.pkl": scaler,
        "feature_names.pkl": feature_names,
        "shap_explainer.pkl": explainer,
        "probability_calibrator.pkl": probability_calibrator,
    }
    for filename, value in objects.items():
        with (temporary / filename).open("wb") as handle:
            pickle.dump(value, handle)
    (temporary / "model_metadata.json").write_text(
        json.dumps(metadata, indent=2), encoding="utf-8"
    )

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for source in temporary.iterdir():
        source.replace(MODEL_DIR / source.name)
    temporary.rmdir()


def main() -> None:
    frame = pd.read_csv(DATA_PATH)
    audit = validate_data(frame)
    x = frame[ALL_FEATURES].copy()
    y = frame["Diagnosis"].astype(int)

    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )

    feature_sets = {
        "full_questionnaire": list(ALL_FEATURES),
        "screening_risk_factors": list(SCREENING_FEATURES),
    }
    candidates = model_candidates()
    rows = []
    for feature_set_name, features in feature_sets.items():
        for model_name, model in candidates.items():
            result = evaluate_candidate(
                model_name,
                model,
                feature_set_name,
                features,
                x_train,
                y_train,
                x_test,
                y_test,
            )
            rows.append(result)
            print(
                f"{feature_set_name:24s} {model_name:20s} "
                f"CV F1={result['cv_f1_mean']:.3f} "
                f"holdout ROC-AUC={result['holdout_roc_auc']:.3f}"
            )

    results = pd.DataFrame(rows).sort_values(
        ["feature_set", "cv_f1_mean"], ascending=[True, False]
    )
    full_results = results[results["feature_set"] == "full_questionnaire"]
    selected = full_results.sort_values("cv_f1_mean", ascending=False).iloc[0].to_dict()
    selected_name = selected["model"]

    (
        fitted_model,
        scaler,
        feature_names,
        explainer,
        probability_calibrator,
        calibration_metrics,
        risk_thresholds,
        calibrated_test_probabilities,
    ) = fit_deployment_artifacts(
        selected_name,
        candidates[selected_name],
        x_train,
        y_train,
        x_test,
        y_test,
    )
    metadata = {
        "trained_at_utc": datetime.now(timezone.utc).isoformat(),
        "model_name": selected_name,
        "selection_metric": "five_fold_cv_f1_on_training_split",
        "feature_set": "full_questionnaire",
        "feature_count": len(feature_names),
        "training_rows": int(len(x_train)),
        "holdout_rows": int(len(x_test)),
        "diagnosis_proximal_features": DIAGNOSIS_PROXIMAL_FEATURES,
        "probability_definition": (
            "Internally calibrated probability of membership in the dataset's "
            "Alzheimer diagnosis class conditional on the submitted questionnaire."
        ),
        "probability_calibration": calibration_metrics,
        "risk_thresholds": risk_thresholds,
        "feature_reference_ranges": {
            feature: {
                "q25": float(x_train[feature].quantile(0.25)),
                "q50": float(x_train[feature].quantile(0.50)),
                "q75": float(x_train[feature].quantile(0.75)),
            }
            for feature in NUMERICAL_FEATURES
        },
        "imputation": {
            "fit_scope": "training_split_only",
            "numerical_strategy": "median",
            "categorical_strategy": "mode",
            "values": {
                **{
                    feature: float(x_train[feature].median())
                    for feature in NUMERICAL_FEATURES
                },
                **{
                    feature: int(x_train[feature].mode(dropna=True).iloc[0])
                    for feature in CATEGORICAL_FEATURES
                },
            },
        },
        "feature_bounds": {
            feature: {
                "min": float(x_train[feature].min()),
                "max": float(x_train[feature].max()),
            }
            for feature in ALL_FEATURES
        },
        "random_state": RANDOM_STATE,
        "data_audit": audit,
        "selected_metrics": {
            key: value
            for key, value in selected.items()
            if key.startswith("cv_") or key.startswith("holdout_")
        },
    }

    calibration_bins = calibration_table(y_test, calibrated_test_probabilities)
    subgroup_results = subgroup_table(
        x_test,
        y_test,
        calibrated_test_probabilities,
        risk_thresholds["upper"],
    )
    write_reports(
        results,
        audit,
        selected,
        calibration_metrics,
        risk_thresholds,
        calibration_bins,
        subgroup_results,
    )
    save_artifacts(
        fitted_model,
        scaler,
        feature_names,
        explainer,
        probability_calibrator,
        metadata,
    )
    print(f"Selected deployment model: {selected_name}")
    print(f"Reports: {REPORT_DIR}")
    print(f"Artifacts: {MODEL_DIR}")


if __name__ == "__main__":
    main()
