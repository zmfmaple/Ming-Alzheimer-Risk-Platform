"""Supplementary validation metadata for model-progress reporting."""

from __future__ import annotations

import json
import os
from copy import deepcopy
from typing import Any


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(BASE_DIR)
REPORT_PATH = os.path.join(
    PROJECT_ROOT,
    "reports",
    "model_evaluation",
    "supplementary_validation.json",
)


def load_supplementary_validation_report() -> dict[str, Any]:
    """Load dual-dataset route metadata for the model-progress page."""
    with open(REPORT_PATH, "r", encoding="utf-8") as stream:
        return deepcopy(json.load(stream))
