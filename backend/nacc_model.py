"""Runtime support for the supplementary NACC longitudinal model."""

import json
import math
import os
import pickle
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer

from dual_model_config import NACC_REQUIRED_FEATURES


class NaccModelRuntime:
    """Load and run the NACC public-questionnaire model as a separate route."""

    def __init__(self, model_dir: str):
        self.model_dir = model_dir
        self.bundle: Optional[dict] = None
        self.model_card: Dict[str, Any] = {}
        self.load_error: Optional[str] = None

    def load(self) -> None:
        artifact_path = os.path.join(
            self.model_dir,
            "nacc_public_questionnaire_selected_model.pkl",
        )
        card_path = os.path.join(
            self.model_dir,
            "nacc_public_questionnaire_model_card.json",
        )
        if not os.path.exists(artifact_path):
            self.bundle = None
            self.load_error = "NACC model artifact not found"
            return
        try:
            with open(artifact_path, "rb") as f:
                self.bundle = pickle.load(f)
            patch_count = patch_legacy_sklearn_imputers(self.bundle)
            if os.path.exists(card_path):
                with open(card_path, "r", encoding="utf-8") as f:
                    self.model_card = json.load(f)
            self.model_card["runtime_compatibility_patches"] = {
                "legacy_simple_imputers": patch_count,
            }
            self.load_error = None
        except Exception as exc:
            self.bundle = None
            self.load_error = str(exc)

    @property
    def loaded(self) -> bool:
        return self.bundle is not None

    @property
    def features(self) -> List[str]:
        if not self.bundle:
            return []
        return list(self.bundle["features"])

    def predict(self, feature_dict: Dict[str, Any]) -> Dict[str, Any]:
        if not self.bundle:
            return {
                "status": "not_loaded",
                "probability": None,
                "raw_probability": None,
                "missing_features": NACC_REQUIRED_FEATURES,
                "load_error": self.load_error,
            }

        model_features = self.features
        status = nacc_input_status(feature_dict, model_features)
        nacc_values = derive_nacc_feature_values(feature_dict, model_features)
        frame = pd.DataFrame([nacc_values], columns=model_features)

        try:
            raw_probability = float(self.bundle["pipeline"].predict_proba(frame)[0][1])
            clipped = min(max(raw_probability, 1e-6), 1 - 1e-6)
            log_odds = [[math.log(clipped / (1 - clipped))]]
            calibrated = float(self.bundle["calibrator"].predict_proba(log_odds)[0][1])
        except Exception as exc:
            return {
                "status": "runtime_error",
                "probability": None,
                "raw_probability": None,
                "missing_features": status["missing_features"],
                "load_error": str(exc),
                "model_card": self.model_card,
            }

        return {
            "status": status["status"],
            "probability": calibrated,
            "raw_probability": raw_probability,
            "missing_features": status["missing_features"],
            "model_card": self.model_card,
        }


def patch_legacy_sklearn_imputers(obj: Any, visited: Optional[set] = None) -> int:
    """Patch old pickled SimpleImputer objects for the local sklearn runtime."""
    if visited is None:
        visited = set()
    object_id = id(obj)
    if object_id in visited:
        return 0
    visited.add(object_id)

    patch_count = 0
    if isinstance(obj, SimpleImputer):
        dtype = getattr(getattr(obj, "statistics_", None), "dtype", np.dtype("float64"))
        if not hasattr(obj, "_fit_dtype"):
            obj._fit_dtype = dtype
            patch_count += 1
        if not hasattr(obj, "_fill_dtype"):
            obj._fill_dtype = dtype
            patch_count += 1
        if not hasattr(obj, "keep_empty_features"):
            obj.keep_empty_features = False
            patch_count += 1

    if isinstance(obj, dict):
        for value in obj.values():
            patch_count += patch_legacy_sklearn_imputers(value, visited)
        return patch_count

    if isinstance(obj, (list, tuple, set)):
        for value in obj:
            patch_count += patch_legacy_sklearn_imputers(value, visited)
        return patch_count

    for attr_name in ("steps", "transformers", "transformers_", "estimators"):
        for item in getattr(obj, attr_name, []) or []:
            if isinstance(item, tuple):
                for value in item:
                    patch_count += patch_legacy_sklearn_imputers(value, visited)
            else:
                patch_count += patch_legacy_sklearn_imputers(item, visited)

    return patch_count


def is_missing(value: Any) -> bool:
    return value is None or (isinstance(value, float) and math.isnan(value))


def derive_nacc_feature_values(
    feature_dict: Dict[str, Any],
    features: List[str],
) -> Dict[str, Any]:
    values: Dict[str, Any] = {}
    for feature in features:
        value = feature_dict.get(feature)
        if value is None and feature == "DepressiveSymptoms":
            value = feature_dict.get("Depression")
        if value is None and feature == "Hypercholesterolemia":
            value = derive_hypercholesterolemia(feature_dict)
        values[feature] = np.nan if value is None else value
    return values


def derive_hypercholesterolemia(feature_dict: Dict[str, Any]) -> Optional[int]:
    explicit = feature_dict.get("Hypercholesterolemia")
    if explicit is not None:
        return explicit
    total = feature_dict.get("CholesterolTotal")
    ldl = feature_dict.get("CholesterolLDL")
    if total is None and ldl is None:
        return None
    high_total = total is not None and float(total) >= 240
    high_ldl = ldl is not None and float(ldl) >= 160
    return int(high_total or high_ldl)


def nacc_input_status(
    feature_dict: Dict[str, Any],
    required_features: Optional[List[str]] = None,
) -> Dict[str, Any]:
    required = required_features or NACC_REQUIRED_FEATURES
    derived = derive_nacc_feature_values(feature_dict, required)
    missing = [feature for feature in required if is_missing(derived.get(feature))]
    return {
        "status": "ready" if not missing else "imputed",
        "missing_features": missing,
    }



