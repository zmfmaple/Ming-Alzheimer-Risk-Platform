"""Regression checks for dual-dataset model-progress reporting."""

import unittest

from supplementary_validation import load_supplementary_validation_report


class SupplementaryValidationTests(unittest.TestCase):
    def test_dual_dataset_routes_are_reported_without_replacing_deployed_model(self):
        report = load_supplementary_validation_report()
        routes = {route["route_id"]: route for route in report["routes"]}

        self.assertIn("kaggle_prototype", routes)
        self.assertIn("nacc_public_questionnaire", routes)
        self.assertTrue(routes["kaggle_prototype"]["deployed"])
        self.assertTrue(routes["nacc_public_questionnaire"]["deployed"])
        self.assertEqual(
            routes["nacc_public_questionnaire"]["role"],
            "supplementary_longitudinal_evidence",
        )
        self.assertIn("reports the two outputs separately", report["summary"])
        self.assertNotIn("combined research score", report["summary"])

    def test_nacc_route_keeps_probability_definition_separate(self):
        report = load_supplementary_validation_report()
        nacc = next(
            route
            for route in report["routes"]
            if route["route_id"] == "nacc_public_questionnaire"
        )

        self.assertIn("later converted to dementia", nacc["probability_definition"])
        self.assertNotIn("diagnosis class", nacc["probability_definition"])


if __name__ == "__main__":
    unittest.main()
