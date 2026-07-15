from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class RunPredictionRequest(BaseModel):
    category: str # UPI, Voice, QR, etc.
    model_name: Optional[str] = "XGBoost"

class PredictionResponse(BaseModel):
    category: str
    predicted_threat: str
    confidence: float
    probability: float
    affected_regions: List[str]
    expected_time_window: str
    severity: str
    recommended_preventive_actions: List[str]

class AlertResponse(BaseModel):
    id: str
    alert_type: str
    description: str
    severity: str
    created_at: datetime
