# ─────────────────────────────────────────────────────────────────────────────
# backend/tests/website_detection/test_routes.py
# FastAPI integration tests for website detection endpoints
# ─────────────────────────────────────────────────────────────────────────────
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from starlette.testclient import TestClient
from main import app

# httpx >= 0.20 requires transport; use starlette's TestClient which handles this
client = TestClient(app, raise_server_exceptions=True)


class TestWebsiteAnalyzeEndpoint:

    def test_analyze_legitimate_url(self):
        resp = client.post("/api/v1/website/analyze", json={
            "url": "https://www.google.com",
            "check_ssl": False,
            "check_whois": False,
            "check_dns": False,
            "check_html": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "prediction" in data
        assert data["prediction"] in ("Legitimate", "Suspicious", "Phishing")
        assert "confidence" in data
        assert "risk_level" in data
        assert "analysis_id" in data
        assert data["analysis_id"].startswith("WA-")

    def test_analyze_suspicious_url(self):
        resp = client.post("/api/v1/website/analyze", json={
            "url": "http://192.168.0.1/bank/login?otp=verify",
            "check_ssl": False,
            "check_whois": False,
            "check_dns": False,
            "check_html": False,
        })
        assert resp.status_code == 200
        data = resp.json()
        # IP + no HTTPS + suspicious keywords → should NOT be Legitimate
        assert data["prediction"] in ("Suspicious", "Phishing")

    def test_analyze_auto_normalizes_url(self):
        """URL without scheme should be normalized."""
        resp = client.post("/api/v1/website/analyze", json={
            "url": "evil-bank-update.xyz",
            "check_ssl": False,
            "check_whois": False,
            "check_dns": False,
            "check_html": False,
        })
        assert resp.status_code == 200

    def test_response_schema(self):
        resp = client.post("/api/v1/website/analyze", json={
            "url": "https://example.com",
            "check_ssl": False,
            "check_whois": False,
            "check_dns": False,
            "check_html": False,
        })
        data = resp.json()
        required_keys = [
            "url", "domain", "prediction", "confidence", "risk_level",
            "risk_score", "ssl", "whois", "dns", "features", "threats",
            "detected_keywords", "recommendations", "processing_time_ms", "analysis_id",
        ]
        for key in required_keys:
            assert key in data, f"Missing key in response: {key}"

    def test_features_schema(self):
        resp = client.post("/api/v1/website/analyze", json={
            "url": "https://example.com",
            "check_ssl": False,
            "check_whois": False,
            "check_dns": False,
            "check_html": False,
        })
        features = resp.json()["features"]
        assert isinstance(features["url_length"], int)
        assert isinstance(features["has_https"], bool)
        assert isinstance(features["typosquatting_score"], float)


class TestBatchEndpoint:

    def test_batch_analyze(self):
        resp = client.post("/api/v1/website/batch", json={
            "urls": ["https://google.com", "http://evil.tk/login"]
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["results"]) == 2
        assert "summary" in data

    def test_batch_limit_exceeded(self):
        resp = client.post("/api/v1/website/batch", json={
            "urls": [f"https://site{i}.com" for i in range(25)]
        })
        assert resp.status_code == 422


class TestHistoryEndpoint:

    def test_history_returns_list(self):
        # First submit an analysis to create a record
        client.post("/api/v1/website/analyze", json={
            "url": "https://example.com",
            "check_ssl": False, "check_whois": False,
            "check_dns": False, "check_html": False,
        })
        resp = client.get("/api/v1/website/history?limit=10")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_history_pagination(self):
        resp = client.get("/api/v1/website/history?limit=5&offset=0")
        assert resp.status_code == 200


class TestDeleteEndpoint:

    def test_delete_existing(self):
        # Create a record
        resp = client.post("/api/v1/website/analyze", json={
            "url": "https://delete-test.com",
            "check_ssl": False, "check_whois": False,
            "check_dns": False, "check_html": False,
        })
        analysis_id = resp.json()["analysis_id"]

        del_resp = client.delete(f"/api/v1/website/{analysis_id}")
        assert del_resp.status_code == 200
        assert del_resp.json()["status"] == "deleted"

    def test_delete_nonexistent(self):
        resp = client.delete("/api/v1/website/WA-DOESNOTEXIST")
        assert resp.status_code == 404


class TestHealthEndpoint:

    def test_health_includes_website_detection(self):
        resp = client.get("/health")
        assert resp.status_code == 200
        modules = resp.json().get("modules", [])
        assert "website_detection" in modules
