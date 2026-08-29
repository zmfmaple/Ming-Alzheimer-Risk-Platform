"""Run aggregate HCAP classification experiments without exporting row-level data."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import make_scorer
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


RANDOM_STATE = 42


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--summary", type=Path, required=True)
    parser.add_argument("--respondent", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, required=True)
    return parser.parse_args()


def recode_yes_no(series: pd.Series) -> pd.Series:
    return series.map({1: 1.0, 5: 0.0})


def build_analysis_frame(summary_path: Path, respondent_path: Path) -> pd.DataFrame:
    summary = pd.read_stata(summary_path, convert_categoricals=False)
    respondent = pd.read_stata(respondent_path, convert_categoricals=False)

    respondent_fields = respondent[
        ["hhid", "pn", "r1rage_dx", "r1depres", "r1sleep", "r1smell_smoke"]
    ].copy()
    respondent_fields["depressed_mood"] = recode_yes_no(
        respondent_fields.pop("r1depres")
    )
    respondent_fields["restless_sleep"] = recode_yes_no(
        respondent_fields.pop("r1sleep")
    )
    respondent_fields["current_smoker"] = recode_yes_no(
        respondent_fields.pop("r1smell_smoke")
    )
    respondent_fields = respondent_fields.rename(columns={"r1rage_dx": "age"})

    selected_summary = summary[
        [
            "hhid",
            "pn",
            "vs1hcapdx_eap",
            "vs3self_concerns",
            "vs3informant_concerns",
            "vs3informant_impairment",
            "vs3jormsc",
            "vs3blessedsc",
            "vs2memsc",
            "vs2exfsc",
            "vs2lflsc",
            "vs2vissc",
            "vs2vdori1",
        ]
    ].copy()
    frame = selected_summary.merge(
        respondent_fields,
        on=["hhid", "pn"],
        how="inner",
        validate="one_to_one",
    )
    frame = frame.drop(columns=["hhid", "pn"])
    frame["target"] = frame.pop("vs1hcapdx_eap").astype(int) - 1
    return frame


def model_candidates():
    return {
        "LogisticRegression": LogisticRegression(
            max_iter=2500,
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
    }


def main():
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    frame = build_analysis_frame(args.summary, args.respondent)

    feature_sets = {
        "questionnaire_proxy": [
            "age",
            "depressed_mood",
            "restless_sleep",
            "current_smoker",
            "vs3self_concerns",
        ],
        "questionnaire_plus_informant": [
            "age",
            "depressed_mood",
            "restless_sleep",
            "current_smoker",
            "vs3self_concerns",
            "vs3informant_concerns",
            "vs3informant_impairment",
            "vs3jormsc",
            "vs3blessedsc",
        ],
        "cognitive_domain_benchmark": [
            "age",
            "vs2memsc",
            "vs2exfsc",
            "vs2lflsc",
            "vs2vissc",
            "vs2vdori1",
        ],
        "combined_diagnosis_proximal": [
            "age",
            "vs3self_concerns",
            "vs3informant_concerns",
            "vs3informant_impairment",
            "vs3jormsc",
            "vs3blessedsc",
            "vs2memsc",
            "vs2exfsc",
            "vs2lflsc",
            "vs2vissc",
            "vs2vdori1",
        ],
    }
    leakage_notes = {
        "questionnaire_proxy": "Lower leakage, but still cross-sectional classification.",
        "questionnaire_plus_informant": "Moderate-to-high leakage because functional impairment contributes to HCAP classification.",
        "cognitive_domain_benchmark": "High leakage: cognitive domains contribute directly to the HCAP algorithm.",
        "combined_diagnosis_proximal": "Very high leakage; diagnostic-classification benchmark only.",
    }

    scoring = {
        "accuracy": "accuracy",
        "balanced_accuracy": "balanced_accuracy",
        "macro_f1": "f1_macro",
        "weighted_f1": "f1_weighted",
        "roc_auc_ovr_weighted": "roc_auc_ovr_weighted",
    }
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    rows = []
    for feature_set_name, features in feature_sets.items():
        for model_name, model in model_candidates().items():
            pipeline = Pipeline(
                [
                    ("imputer", SimpleImputer(strategy="median", add_indicator=True)),
                    ("scaler", StandardScaler()),
                    ("model", model),
                ]
            )
            scores = cross_validate(
                pipeline,
                frame[features],
                frame["target"],
                cv=cv,
                scoring=scoring,
                n_jobs=-1,
            )
            row = {
                "feature_set": feature_set_name,
                "model": model_name,
                "feature_count": len(features),
                "leakage_note": leakage_notes[feature_set_name],
            }
            for metric in scoring:
                row[f"cv_{metric}_mean"] = float(scores[f"test_{metric}"].mean())
                row[f"cv_{metric}_std"] = float(scores[f"test_{metric}"].std())
            rows.append(row)
            print(
                f"{feature_set_name:32s} {model_name:20s} "
                f"macro F1={row['cv_macro_f1_mean']:.3f}"
            )

    results = pd.DataFrame(rows).sort_values(
        ["feature_set", "cv_macro_f1_mean"], ascending=[True, False]
    )
    results.to_csv(args.output_dir / "hcap_model_comparison.csv", index=False)

    summary = {
        "rows": int(len(frame)),
        "target_counts": {
            "normal": int((frame["target"] == 0).sum()),
            "mci": int((frame["target"] == 1).sum()),
            "dementia": int((frame["target"] == 2).sum()),
        },
        "row_level_data_exported": False,
        "interpretation": (
            "HCAP results are cross-sectional cognitive-status classification. "
            "They are not prospective Alzheimer disease risk prediction."
        ),
    }
    (args.output_dir / "hcap_run_metadata.json").write_text(
        json.dumps(summary, indent=2), encoding="utf-8"
    )

    lines = [
        "# HCAP supplementary experiments",
        "",
        "No HHID, PN, or row-level HRS data are exported by this script.",
        "",
        "| Feature set | Model | Macro F1 | Balanced accuracy | Weighted OVR ROC-AUC | Interpretation |",
        "|---|---|---:|---:|---:|---|",
    ]
    for _, row in results.iterrows():
        lines.append(
            f"| {row['feature_set']} | {row['model']} | "
            f"{row['cv_macro_f1_mean']:.3f} | "
            f"{row['cv_balanced_accuracy_mean']:.3f} | "
            f"{row['cv_roc_auc_ovr_weighted_mean']:.3f} | "
            f"{row['leakage_note']} |"
        )
    lines.extend(
        [
            "",
            "The questionnaire-proxy experiment is the closest to BrainEcho's user-input setting. "
            "The cognitive-domain and combined experiments are diagnostic benchmarks used to "
            "demonstrate how performance changes when diagnosis-proximal measures are included.",
        ]
    )
    (args.output_dir / "README.md").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()

