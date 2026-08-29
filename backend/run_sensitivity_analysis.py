"""Run diagnosis-adjacent feature ablation and calibration reporting."""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.base import clone
from sklearn.compose import ColumnTransformer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    f1_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier

from model_config import (
    ALL_FEATURES,
    DIAGNOSIS_PROXIMAL_FEATURES,
    NUMERICAL_FEATURES,
    SCREENING_FEATURES,
)


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = PROJECT_ROOT / "data" / "raw" / "alzheimers_disease_data.csv"
REPORT_DIR = PROJECT_ROOT / "reports" / "model_evaluation"
METADATA_PATH = PROJECT_ROOT / "models" / "model_metadata.json"
RANDOM_STATE = 42


def logit(probabilities):
    clipped = np.clip(np.asarray(probabilities, dtype=float), 1e-6, 1 - 1e-6)
    return np.log(clipped / (1 - clipped)).reshape(-1, 1)


def model():
    return XGBClassifier(
        n_estimators=300,
        max_depth=4,
        learning_rate=0.04,
        subsample=0.85,
        colsample_bytree=0.85,
        eval_metric="logloss",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )


def pipeline(features):
    numerical = [feature for feature in features if feature in NUMERICAL_FEATURES]
    preprocessor = ColumnTransformer(
        [("numerical", StandardScaler(), numerical)],
        remainder="passthrough",
        verbose_feature_names_out=False,
    )
    return Pipeline(
        [("preprocessor", preprocessor), ("model", clone(model()))]
    )


def evaluate_variant(name, features, x_train, y_train, x_test, y_test):
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    cv_model = pipeline(features)
    cv_scores = cross_validate(
        cv_model,
        x_train[features],
        y_train,
        cv=cv,
        scoring={"f1": "f1", "roc_auc": "roc_auc"},
        n_jobs=1,
    )

    x_fit, x_calibration, y_fit, y_calibration = train_test_split(
        x_train[features],
        y_train,
        test_size=0.25,
        stratify=y_train,
        random_state=RANDOM_STATE,
    )
    fitted = pipeline(features)
    fitted.fit(x_fit, y_fit)

    raw_calibration = fitted.predict_proba(x_calibration)[:, 1]
    calibrator = LogisticRegression(random_state=RANDOM_STATE)
    calibrator.fit(logit(raw_calibration), y_calibration)

    raw_test = fitted.predict_proba(x_test[features])[:, 1]
    calibrated_test = calibrator.predict_proba(logit(raw_test))[:, 1]
    predicted = (calibrated_test >= 0.5).astype(int)
    return {
        "variant": name,
        "feature_count": len(features),
        "removed_features": ", ".join(
            feature for feature in ALL_FEATURES if feature not in features
        ),
        "cv_f1_mean": float(cv_scores["test_f1"].mean()),
        "cv_f1_std": float(cv_scores["test_f1"].std()),
        "cv_roc_auc_mean": float(cv_scores["test_roc_auc"].mean()),
        "cv_roc_auc_std": float(cv_scores["test_roc_auc"].std()),
        "holdout_accuracy_at_0_5": float(accuracy_score(y_test, predicted)),
        "holdout_f1_at_0_5": float(f1_score(y_test, predicted)),
        "holdout_roc_auc_calibrated": float(
            roc_auc_score(y_test, calibrated_test)
        ),
        "holdout_pr_auc_calibrated": float(
            average_precision_score(y_test, calibrated_test)
        ),
        "holdout_brier_calibrated": float(
            brier_score_loss(y_test, calibrated_test)
        ),
    }


def svg_text(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def write_ablation_svg(results):
    width, height = 980, 510
    left, right, top, bottom = 270, 60, 70, 65
    plot_width = width - left - right
    row_height = (height - top - bottom) / len(results)
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#fffdf8"/>',
        '<style>text{font-family:Arial,sans-serif;fill:#3f3632}.title{font-size:22px;font-weight:700}.label{font-size:14px}.value{font-size:13px;font-weight:700}.axis{font-size:12px;fill:#71645e}</style>',
        '<text x="30" y="35" class="title">Diagnosis-adjacent feature sensitivity</text>',
        '<text x="30" y="57" class="axis">Calibrated holdout ROC-AUC after retraining each XGBoost variant</text>',
    ]
    for tick in np.linspace(0.4, 1.0, 7):
        x = left + (tick - 0.4) / 0.6 * plot_width
        parts.append(
            f'<line x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{height-bottom}" stroke="#ded6cb" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{x:.1f}" y="{height-35}" text-anchor="middle" class="axis">{tick:.1f}</text>'
        )
    full_auc = float(results.iloc[0]["holdout_roc_auc_calibrated"])
    full_x = left + (full_auc - 0.4) / 0.6 * plot_width
    parts.append(
        f'<line x1="{full_x:.1f}" y1="{top-8}" x2="{full_x:.1f}" y2="{height-bottom}" stroke="#8c9d79" stroke-width="2" stroke-dasharray="5 5"/>'
    )
    for index, row in results.iterrows():
        y = top + index * row_height + 8
        auc = float(row["holdout_roc_auc_calibrated"])
        bar_width = max(0, (auc - 0.4) / 0.6 * plot_width)
        color = "#78956b" if index == 0 else "#c08372"
        parts.append(
            f'<text x="{left-15}" y="{y+17:.1f}" text-anchor="end" class="label">{svg_text(row["variant"])}</text>'
        )
        parts.append(
            f'<rect x="{left}" y="{y:.1f}" width="{bar_width:.1f}" height="25" rx="3" fill="{color}"/>'
        )
        parts.append(
            f'<text x="{left+bar_width+8:.1f}" y="{y+18:.1f}" class="value">{auc:.3f}</text>'
        )
    parts.append("</svg>")
    (REPORT_DIR / "diagnosis_adjacent_sensitivity.svg").write_text(
        "\n".join(parts), encoding="utf-8"
    )


def write_calibration_svg(calibration):
    width, height = 620, 590
    left, right, top, bottom = 80, 40, 75, 80
    plot_width = width - left - right
    plot_height = height - top - bottom
    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        '<rect width="100%" height="100%" fill="#fffdf8"/>',
        '<style>text{font-family:Arial,sans-serif;fill:#3f3632}.title{font-size:22px;font-weight:700}.axis{font-size:13px;fill:#71645e}.note{font-size:12px;fill:#71645e}</style>',
        '<text x="30" y="35" class="title">Calibration reliability plot</text>',
        '<text x="30" y="58" class="note">Internally Platt-calibrated XGBoost on the independent holdout split</text>',
    ]
    for tick in np.linspace(0, 1, 6):
        x = left + tick * plot_width
        y = top + (1 - tick) * plot_height
        parts.extend(
            [
                f'<line x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{top+plot_height}" stroke="#ded6cb"/>',
                f'<line x1="{left}" y1="{y:.1f}" x2="{left+plot_width}" y2="{y:.1f}" stroke="#ded6cb"/>',
                f'<text x="{x:.1f}" y="{height-48}" text-anchor="middle" class="axis">{tick:.1f}</text>',
                f'<text x="{left-15}" y="{y+4:.1f}" text-anchor="end" class="axis">{tick:.1f}</text>',
            ]
        )
    parts.append(
        f'<line x1="{left}" y1="{top+plot_height}" x2="{left+plot_width}" y2="{top}" stroke="#7b706a" stroke-width="2" stroke-dasharray="6 5"/>'
    )
    points = []
    for _, row in calibration.iterrows():
        predicted = float(row["mean_predicted_probability"])
        observed = float(row["observed_positive_rate"])
        count = int(row["sample_count"])
        x = left + predicted * plot_width
        y = top + (1 - observed) * plot_height
        radius = 4 + min(10, np.sqrt(count) / 2)
        points.append((x, y))
        parts.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{radius:.1f}" fill="#78956b" fill-opacity="0.82" stroke="#42533b"/>'
        )
        parts.append(
            f'<text x="{x+10:.1f}" y="{y-8:.1f}" class="note">n={count}</text>'
        )
    if points:
        path = " ".join(
            ("M" if index == 0 else "L") + f" {x:.1f} {y:.1f}"
            for index, (x, y) in enumerate(points)
        )
        parts.append(
            f'<path d="{path}" fill="none" stroke="#78956b" stroke-width="2"/>'
        )
    parts.extend(
        [
            f'<text x="{left+plot_width/2:.1f}" y="{height-15}" text-anchor="middle" class="axis">Mean predicted probability</text>',
            f'<text x="20" y="{top+plot_height/2:.1f}" text-anchor="middle" class="axis" transform="rotate(-90 20 {top+plot_height/2:.1f})">Observed positive proportion</text>',
            "</svg>",
        ]
    )
    (REPORT_DIR / "calibration_reliability.svg").write_text(
        "\n".join(parts), encoding="utf-8"
    )


def write_summary(results, metadata):
    full = results.iloc[0]
    lines = [
        "# Diagnosis-adjacent feature sensitivity analysis",
        "",
        "This analysis retrains the same XGBoost specification after removing selected cognitive and functional variables. The outer 80/20 stratified holdout split and random seed remain fixed. Platt calibration is fitted only within the training split.",
        "",
        "The analysis tests dependence on variables that are close to the recorded diagnosis. It does not estimate causal effects and does not establish prospective clinical validity.",
        "",
        "| Variant | Features | CV ROC-AUC | Holdout ROC-AUC | PR-AUC | Brier | Delta ROC-AUC |",
        "|---|---:|---:|---:|---:|---:|---:|",
    ]
    for _, row in results.iterrows():
        lines.append(
            f"| {row['variant']} | {int(row['feature_count'])} | "
            f"{row['cv_roc_auc_mean']:.3f} | "
            f"{row['holdout_roc_auc_calibrated']:.3f} | "
            f"{row['holdout_pr_auc_calibrated']:.3f} | "
            f"{row['holdout_brier_calibrated']:.3f} | "
            f"{row['delta_holdout_roc_auc']:+.3f} |"
        )
    lines.extend(
        [
            "",
            "## Interpretation",
            "",
            f"The full model achieved a calibrated holdout ROC-AUC of **{full['holdout_roc_auc_calibrated']:.3f}**. Performance changes after removing MMSE or ADL should be interpreted as evidence of model dependence, not as the independent clinical importance of either measure.",
            "",
            "The screening-only variant removes all diagnosis-adjacent cognitive, functional and symptom variables. A large decrease toward chance-level discrimination indicates that the current system behaves mainly as a cross-sectional classification tool. It should not be described as a model that predicts future Alzheimer disease onset.",
            "",
            "The calibration reliability figure uses the existing independent holdout bins. Sparse middle-probability bins have small sample counts, so visual deviations in those bins are unstable.",
            "",
            f"Reported calibrated holdout Brier score for the deployed model: **{metadata['probability_calibration']['holdout_brier_calibrated']:.3f}**.",
        ]
    )
    (REPORT_DIR / "sensitivity_analysis.md").write_text(
        "\n".join(lines) + "\n", encoding="utf-8"
    )


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    frame = pd.read_csv(DATA_PATH)
    x = frame[ALL_FEATURES].copy()
    y = frame["Diagnosis"].astype(int)
    x_train, x_test, y_train, y_test = train_test_split(
        x,
        y,
        test_size=0.20,
        stratify=y,
        random_state=RANDOM_STATE,
    )
    variants = {
        "Full questionnaire": list(ALL_FEATURES),
        "Without MMSE": [f for f in ALL_FEATURES if f != "MMSE"],
        "Without ADL": [f for f in ALL_FEATURES if f != "ADL"],
        "Without MMSE and ADL": [
            f for f in ALL_FEATURES if f not in {"MMSE", "ADL"}
        ],
        "Without MMSE, ADL and functional assessment": [
            f
            for f in ALL_FEATURES
            if f not in {"MMSE", "ADL", "FunctionalAssessment"}
        ],
        "Screening risk factors only": list(SCREENING_FEATURES),
    }
    rows = [
        evaluate_variant(
            name, features, x_train, y_train, x_test, y_test
        )
        for name, features in variants.items()
    ]
    results = pd.DataFrame(rows)
    baseline_auc = float(results.iloc[0]["holdout_roc_auc_calibrated"])
    results["delta_holdout_roc_auc"] = (
        results["holdout_roc_auc_calibrated"] - baseline_auc
    )
    baseline_brier = float(results.iloc[0]["holdout_brier_calibrated"])
    results["delta_holdout_brier"] = (
        results["holdout_brier_calibrated"] - baseline_brier
    )
    results.to_csv(REPORT_DIR / "diagnosis_adjacent_sensitivity.csv", index=False)

    calibration = pd.read_csv(REPORT_DIR / "calibration_bins.csv")
    metadata = json.loads(METADATA_PATH.read_text(encoding="utf-8"))
    write_ablation_svg(results)
    write_calibration_svg(calibration)
    write_summary(results, metadata)
    print(
        results[
            [
                "variant",
                "holdout_roc_auc_calibrated",
                "holdout_pr_auc_calibrated",
                "holdout_brier_calibrated",
                "delta_holdout_roc_auc",
            ]
        ].to_string(index=False)
    )


if __name__ == "__main__":
    main()
