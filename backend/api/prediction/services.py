from datetime import datetime, timedelta
import uuid
from typing import Dict, Any, List

# Simulated models configurations
MODELS_DB = [
    {"name": "XGBoost Classifier", "framework": "XGBoost", "is_active": True},
    {"name": "Prophet Regressor", "framework": "Prophet", "is_active": False},
    {"name": "LSTM Neural Net", "framework": "LSTM", "is_active": False}
]

# Simulated active alert feeds
ALERTS_DB = [
    {"id": "pa1", "alert_type": "New Scam Campaign", "description": "High volume of 'Digital Arrest' scams reported in NCR.", "severity": "HIGH", "created_at": datetime.utcnow()},
    {"id": "pa2", "alert_type": "High Risk Region", "description": "District coordinates in Mewat region indicate clustering of transaction accounts.", "severity": "MEDIUM", "created_at": datetime.utcnow()}
]

PREDICTIONS_DB = []

def run_prediction(category: str, model_name: str = "XGBoost") -> Dict[str, Any]:
    # Mocking time-series predictions based on categories
    probability = 0.82 if category.lower() == "upi" else 0.65
    regions = ["New Delhi", "Gurugram"] if category.lower() == "upi" else ["Mumbai"]
    
    prediction = {
        "id": str(uuid.uuid4()),
        "category": category,
        "predicted_threat": f"High Volume {category} Scam Wave",
        "confidence": 0.88,
        "probability": probability,
        "affected_regions": regions,
        "expected_time_window": "Next 72 Hours",
        "severity": "HIGH" if probability > 0.7 else "MEDIUM",
        "recommended_preventive_actions": [
            "Issue public warning through SMS templates.",
            "Instruct partner banks to monitor transaction velocities."
        ],
        "created_at": datetime.utcnow().isoformat()
    }
    PREDICTIONS_DB.append(prediction)
    return prediction

def get_current_predictions() -> List[Dict[str, Any]]:
    # Seed default if empty
    if not PREDICTIONS_DB:
        run_prediction("UPI")
        run_prediction("Voice")
    return PREDICTIONS_DB

def get_models() -> List[Dict[str, Any]]:
    return MODELS_DB

def get_alerts() -> List[Dict[str, Any]]:
    return ALERTS_DB
