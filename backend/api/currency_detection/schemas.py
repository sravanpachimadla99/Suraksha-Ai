# ─────────────────────────────────────────────────────────────────────────────
# backend/api/currency_detection/schemas.py
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations
from typing import Dict, List, Optional
from pydantic import BaseModel, Field, field_validator

SUPPORTED_DENOMINATIONS = [10, 20, 50, 100, 200, 500, 2000]

SECURITY_FEATURES = [
    "security_thread", "watermark", "latent_image", "micro_lettering",
    "color_shift_ink", "serial_number", "see_through_register", "rbi_logo",
    "governor_signature", "ashoka_pillar", "optically_variable_ink",
    "alignment_marks", "correct_dimensions", "texture_pattern",
]

SECURITY_FEATURE_LABELS: Dict[str, str] = {
    "security_thread":        "Security Thread",
    "watermark":              "Mahatma Gandhi Watermark",
    "latent_image":           "Latent Image",
    "micro_lettering":        "Micro Lettering",
    "color_shift_ink":        "Color Shift Ink",
    "serial_number":          "Serial Number",
    "see_through_register":   "See-Through Register",
    "rbi_logo":               "RBI Logo",
    "governor_signature":     "Governor's Signature",
    "ashoka_pillar":          "Ashoka Pillar Emblem",
    "optically_variable_ink": "Optically Variable Ink (OVI)",
    "alignment_marks":        "Alignment Marks",
    "correct_dimensions":     "Correct Dimensions",
    "texture_pattern":        "Texture / Intaglio Print",
}


class CurrencyAnalyzeRequest(BaseModel):
    image_base64: str
    denomination: Optional[int] = None
    filename: Optional[str] = "note.jpg"

    @field_validator("denomination")
    @classmethod
    def validate_denomination(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v not in SUPPORTED_DENOMINATIONS:
            raise ValueError(f"Unsupported denomination ₹{v}. Supported: {SUPPORTED_DENOMINATIONS}")
        return v


class SecurityFeatureResult(BaseModel):
    feature_key: str
    feature_label: str
    detected: bool
    confidence: float = Field(ge=0.0, le=1.0)
    severity: str
    description: str


class ImageQualityInfo(BaseModel):
    resolution: str
    is_blurry: bool
    brightness_ok: bool
    rotation_corrected: bool
    enhancement_applied: bool


class BoundingBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    label: str
    confidence: float


class CurrencyAnalysisResult(BaseModel):
    analysis_id: str
    prediction: str
    confidence: float
    risk_level: str
    denomination: Optional[int] = None
    denomination_confidence: float = 0.0
    security_features: List[SecurityFeatureResult]
    detected_features: List[str]
    missing_features: List[str]
    features_passed: int
    features_failed: int
    total_features: int
    image_quality: ImageQualityInfo
    bounding_boxes: List[BoundingBox]
    explanation: str
    recommendation: str
    processing_time_ms: float


class CurrencyHistoryItem(BaseModel):
    analysis_id: str
    denomination: Optional[int]
    prediction: str
    confidence: float
    risk_level: str
    features_passed: int
    features_failed: int
    created_at: str


class CurrencyHistoryResponse(BaseModel):
    total: int
    items: List[CurrencyHistoryItem]
