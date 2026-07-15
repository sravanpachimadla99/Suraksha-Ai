import pytest
from api.prediction.services import run_prediction, get_current_predictions, get_models, get_alerts

def test_run_prediction():
    res = run_prediction("QR")
    assert res["category"] == "QR"
    assert "QR" in res["predicted_threat"]
    assert res["probability"] == 0.65
    assert len(res["affected_regions"]) == 1

def test_get_current_predictions():
    from api.prediction.services import PREDICTIONS_DB
    PREDICTIONS_DB.clear()
    preds = get_current_predictions()
    assert len(preds) >= 2
    assert preds[0]["category"] == "UPI"

def test_get_models():
    models = get_models()
    assert len(models) == 3
    assert models[0]["framework"] == "XGBoost"

def test_get_alerts():
    alerts = get_alerts()
    assert len(alerts) >= 2
    assert alerts[0]["alert_type"] == "New Scam Campaign"
