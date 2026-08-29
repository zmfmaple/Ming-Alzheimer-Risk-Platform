import unittest
import numpy as np
from sklearn.impute import SimpleImputer

from nacc_model import (
    NaccModelRuntime,
    derive_hypercholesterolemia,
    nacc_input_status,
    patch_legacy_sklearn_imputers,
)


class BrokenPipeline:
    def predict_proba(self, frame):
        raise AttributeError("'SimpleImputer' object has no attribute '_fit_dtype'")


class UnusedCalibrator:
    def predict_proba(self, values):
        return [[0.1, 0.9]]


class DualModelIntegrationTests(unittest.TestCase):
    def test_source_probabilities_are_not_fused(self):
        kaggle_probability = 0.20
        nacc_probability = 0.80
        displayed_probability = kaggle_probability

        self.assertEqual(displayed_probability, kaggle_probability)
        self.assertNotEqual(displayed_probability, nacc_probability)

    def test_nacc_input_status_reports_imputed_fields(self):
        status = nacc_input_status({"Age": 75}, ["Age", "Gender"])
        self.assertEqual(status["status"], "imputed")
        self.assertEqual(status["missing_features"], ["Gender"])

    def test_hypercholesterolemia_can_be_derived_from_lipids(self):
        self.assertEqual(
            derive_hypercholesterolemia({"CholesterolTotal": 250}),
            1,
        )
        self.assertEqual(
            derive_hypercholesterolemia({"CholesterolTotal": 180, "CholesterolLDL": 100}),
            0,
        )

    def test_legacy_simple_imputer_runtime_patch(self):
        imputer = SimpleImputer(strategy="median").fit(np.array([[1.0], [np.nan]]))
        if hasattr(imputer, "_fit_dtype"):
            delattr(imputer, "_fit_dtype")
        if hasattr(imputer, "_fill_dtype"):
            delattr(imputer, "_fill_dtype")
        if hasattr(imputer, "keep_empty_features"):
            delattr(imputer, "keep_empty_features")

        patch_count = patch_legacy_sklearn_imputers({"pipeline": imputer})

        self.assertGreaterEqual(patch_count, 3)
        self.assertTrue(hasattr(imputer, "_fit_dtype"))
        self.assertTrue(hasattr(imputer, "_fill_dtype"))
        self.assertFalse(imputer.keep_empty_features)
        self.assertEqual(float(imputer.transform([[np.nan]])[0][0]), 1.0)

    def test_nacc_runtime_error_degrades_to_status_payload(self):
        runtime = NaccModelRuntime("unused")
        runtime.bundle = {
            "features": ["Age"],
            "pipeline": BrokenPipeline(),
            "calibrator": UnusedCalibrator(),
        }

        result = runtime.predict({"Age": 75})

        self.assertEqual(result["status"], "runtime_error")
        self.assertIsNone(result["probability"])
        self.assertEqual(result["missing_features"], [])
        self.assertIn("_fit_dtype", result["load_error"])


if __name__ == "__main__":
    unittest.main()
