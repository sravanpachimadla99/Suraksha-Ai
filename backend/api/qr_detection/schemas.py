# ─────────────────────────────────────────────────────────────────────────────
# backend/api/qr_detection/schemas.py
# ─────────────────────────────────────────────────────────────────────────────
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

class ThreatIndicator(BaseModel):
    name: str
    severity: str  # "critical", "high", "medium", "low"
    description: str
    detected: bool

class QRAnalyzeRequest(BaseModel):
    image_base64: str
    filename: Optional[str] = "qr_code.png"

class QRAnalysisResult(BaseModel):
    analysis_id: str
    qr_type: str                  # "UPI Payment", "Website URL", "Text", etc.
    decoded_content: str
    prediction: str               # "Safe", "Suspicious", "Malicious", "Unreadable"
    confidence: float
    risk_level: str               # "Low", "Medium", "High", "Critical"
    merchant_name: Optional[str] = None
    upi_id: Optional[str] = None
    threats: List[ThreatIndicator] = Field(default_factory=list)
    recommendation: str
    processing_time_ms: float

class QRHistoryItem(BaseModel):
    analysis_id: str
    qr_type: str
    prediction: str
    confidence: float
    risk_level: str
    created_at: str

class QRHistoryResponse(BaseModel):
    total: int
    items: List[QRHistoryItem]
