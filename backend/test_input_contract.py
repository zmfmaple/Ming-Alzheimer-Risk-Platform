"""Regression checks for the model input and missing-value contract."""

import json
import pickle
import unittest
from pathlib import Path

from model_config import ALL_FEATURES, CATEGORICAL_FEATURES


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "models"


class InputContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.metadata = json.loads(
            (MODEL_DIR / "model_metadata.json").read_text(encoding="utf-8")
        )
        with (MODEL_DIR / "feature_names.pkl").open("rb") as stream:
            cls.feature_names = pickle.load(stream)

    def test_feature_order_matches_training_contract(self):
        self.assertEqual(list(self.feature_names), list(ALL_FEATURES))

    def test_every_model_feature_has_an_imputation_value(self):
        values = self.metadata["imputation"]["values"]
        self.assertEqual(set(values), set(ALL_FEATURES))

    def test_categorical_imputation_uses_observed_codes(self):
        values = self.metadata["imputation"]["values"]
        bounds = self.metadata["feature_bounds"]
        for feature in CATEGORICAL_FEATURES:
            self.assertGreaterEqual(values[feature], bounds[feature]["min"])
            self.assertLessEqual(values[feature], bounds[feature]["max"])

    def test_identifiers_are_not_model_features(self):
        self.assertNotIn("PatientID", self.feature_names)
        self.assertNotIn("DoctorInCharge", self.feature_names)
        self.assertNotIn("Diagnosis", self.feature_names)


if __name__ == "__main__":
    unittest.main()
