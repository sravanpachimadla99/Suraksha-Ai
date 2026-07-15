# ─────────────────────────────────────────────────────────────────────────────
# backend/tests/currency_detection/test_services.py
# Unit tests for the currency detection service layer
# ─────────────────────────────────────────────────────────────────────────────
import sys, os, base64
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from api.currency_detection.services import analyze_currency, _compute_risk, _recommendation
from api.currency_detection.schemas import SECURITY_FEATURES, SUPPORTED_DENOMINATIONS


# ── Fixture: minimal 1x1 white JPEG base64 ────────────────────────────────────
TINY_IMG_B64 = (
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U"
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgN"
    "DRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIy"
    "MjL/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAA"
    "AAAAAAAAAAAAAP/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA"
    "/9oADAMBAAIRAxEAPwCwABmX/9k="
)


class TestComputeRisk:
    def test_no_failures_is_genuine(self):
        pred, risk, conf = _compute_risk(0, 0, 0)
        assert pred == "Genuine"
        assert risk == "Low"
        assert conf > 70

    def test_two_critical_failures_is_counterfeit_critical(self):
        pred, risk, conf = _compute_risk(2, 0, 0)
        assert pred == "Counterfeit"
        assert risk == "Critical"

    def test_one_critical_failure_is_counterfeit_high(self):
        pred, risk, conf = _compute_risk(1, 0, 0)
        assert pred == "Counterfeit"
        assert risk == "High"

    def test_three_high_failures_is_counterfeit(self):
        pred, risk, conf = _compute_risk(0, 3, 0)
        assert pred == "Counterfeit"

    def test_two_high_failures_is_suspicious(self):
        pred, risk, conf = _compute_risk(0, 2, 0)
        assert pred == "Suspicious"

    def test_one_high_failure_is_suspicious(self):
        pred, risk, conf = _compute_risk(0, 1, 0)
        assert pred == "Suspicious"

    def test_many_medium_failures_is_suspicious(self):
        pred, risk, conf = _compute_risk(0, 0, 4)
        assert pred == "Suspicious"

    def test_confidence_is_bounded(self):
        _, _, conf = _compute_risk(3, 5, 5)
        assert 0 <= conf <= 100


class TestRecommendation:
    def test_counterfeit_recommendation_contains_1930(self):
        rec = _recommendation("Counterfeit")
        assert "1930" in rec

    def test_suspicious_recommendation_contains_rbi(self):
        rec = _recommendation("Suspicious")
        assert "RBI" in rec.upper() or "bank" in rec.lower()

    def test_genuine_recommendation_contains_genuine(self):
        rec = _recommendation("Genuine")
        assert "genuine" in rec.lower()


class TestAnalyzeCurrency:
    """Integration-style tests using a tiny image (no real CV)."""

    def test_returns_result_object(self):
        result = analyze_currency(TINY_IMG_B64)
        assert result is not None

    def test_analysis_id_format(self):
        result = analyze_currency(TINY_IMG_B64)
        assert result.analysis_id.startswith("CA-")
        assert len(result.analysis_id) > 4

    def test_prediction_is_valid(self):
        result = analyze_currency(TINY_IMG_B64)
        assert result.prediction in ("Genuine", "Counterfeit", "Suspicious", "Inconclusive")

    def test_confidence_in_range(self):
        result = analyze_currency(TINY_IMG_B64)
        assert 0 <= result.confidence <= 100

    def test_feature_count(self):
        result = analyze_currency(TINY_IMG_B64)
        assert result.total_features == len(SECURITY_FEATURES)
        assert result.features_passed + result.features_failed == result.total_features

    def test_security_features_list(self):
        result = analyze_currency(TINY_IMG_B64)
        feature_keys = {f.feature_key for f in result.security_features}
        for key in SECURITY_FEATURES:
            assert key in feature_keys, f"Missing feature: {key}"

    def test_explanation_is_nonempty(self):
        result = analyze_currency(TINY_IMG_B64)
        assert len(result.explanation) > 20

    def test_recommendation_is_nonempty(self):
        result = analyze_currency(TINY_IMG_B64)
        assert len(result.recommendation) > 10

    def test_denomination_override(self):
        result = analyze_currency(TINY_IMG_B64, denomination=500)
        assert result.denomination == 500
        assert result.denomination_confidence == 100.0

    def test_processing_time_is_positive(self):
        result = analyze_currency(TINY_IMG_B64)
        assert result.processing_time_ms > 0

    def test_invalid_denomination_raises(self):
        from pydantic import ValidationError
        from api.currency_detection.schemas import CurrencyAnalyzeRequest
        with pytest.raises(ValidationError):
            CurrencyAnalyzeRequest(image_base64="abc", denomination=9999)

    def test_supported_denominations(self):
        assert 500 in SUPPORTED_DENOMINATIONS
        assert 2000 in SUPPORTED_DENOMINATIONS
        assert 9999 not in SUPPORTED_DENOMINATIONS


class TestAPIRoutes:
    """FastAPI route integration tests."""

    def test_analyze_endpoint(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        resp = client.post("/api/v1/currency/analyze", json={
            "image_base64": TINY_IMG_B64,
            "denomination": None,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data
        assert "confidence" in data
        assert "security_features" in data
        assert len(data["security_features"]) == 14

    def test_analyze_with_denomination(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        resp = client.post("/api/v1/currency/analyze", json={
            "image_base64": TINY_IMG_B64,
            "denomination": 500,
        })
        assert resp.status_code == 200
        assert resp.json()["denomination"] == 500

    def test_invalid_denomination_422(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        resp = client.post("/api/v1/currency/analyze", json={
            "image_base64": TINY_IMG_B64,
            "denomination": 9999,
        })
        assert resp.status_code == 422

    def test_history_endpoint(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        # Create a record
        client.post("/api/v1/currency/analyze", json={"image_base64": TINY_IMG_B64})
        resp = client.get("/api/v1/currency/history")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data

    def test_denominations_endpoint(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        resp = client.get("/api/v1/currency/denominations")
        assert resp.status_code == 200
        data = resp.json()
        assert 500 in data["supported"]
        assert 2000 in data["supported"]

    def test_delete_nonexistent_404(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        resp = client.delete("/api/v1/currency/CA-DOESNOTEXIST")
        assert resp.status_code == 404

    def test_health_includes_currency_detection(self):
        from starlette.testclient import TestClient
        from main import app
        client = TestClient(app, raise_server_exceptions=True)
        resp = client.get("/health")
        assert resp.status_code == 200
        assert "currency_detection" in resp.json()["modules"]
