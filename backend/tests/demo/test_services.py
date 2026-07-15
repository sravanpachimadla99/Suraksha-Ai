import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_demo_seed():
    response = client.post("/api/v1/demo/seed")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_demo_reset():
    response = client.post("/api/v1/demo/reset")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_demo_health():
    response = client.get("/api/v1/demo/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_demo_metrics():
    response = client.get("/api/v1/demo/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.json()
