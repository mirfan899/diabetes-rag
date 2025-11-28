#!/usr/bin/env python3
"""
Smoke-test script for the Diabetes RAG backend.

Sends a sample patient payload to POST /patients/recommendations and prints the
JSON response. Run after the FastAPI server is up (default http://localhost:8000).

Usage:
    python backend/tests/test_recommendation_api.py \
        --api-url http://localhost:8000
"""
import argparse
import json
import sys
from typing import Any, Dict

import requests


def build_payload() -> Dict[str, Any]:
    """Create a representative patient request."""
    return {
        "guidelines": "ADA",
        "diabetes_type": "Type 2",
        "hba1cPercent": 8.8,
        "age": 58,
        "gender": "male",
        "weightKg": 92,
        "heightCm": 175,
        "bmi": 30.0,
        "duration": "6 years",
        "currentSymptoms": "Polyuria, polydipsia, fatigue",
        "currentMedications": "Metformin 1000mg BID",
        "kidneyFunction": "eGFR 65",
        "neuropathy": "Mild peripheral neuropathy",
        "bloodPressure": "138/84",
        "bloodGlucoseFastingMgDl": 165,
        "heartFailure": "No",
    }


def main():
    parser = argparse.ArgumentParser(description="Test POST /patients/recommendations")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Backend base URL")
    args = parser.parse_args()

    url = f"{args.api_url.rstrip('/')}/patients/recommendations"
    payload = build_payload()

    try:
        response = requests.post(url, json=payload, timeout=120)
    except requests.RequestException as exc:
        print(f"[FAIL] Request error: {exc}")
        sys.exit(1)

    if response.status_code != 200:
        print(f"[FAIL] HTTP {response.status_code}: {response.text}")
        sys.exit(1)

    print("[PASS] Backend responded successfully")
    print(json.dumps(response.json(), indent=2))


if __name__ == "__main__":
    main()


