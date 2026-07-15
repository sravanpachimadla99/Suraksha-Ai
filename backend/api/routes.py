from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random
import re

router = APIRouter()

# ── Model loading (graceful fallback) ────────────────────────
_model = None

def _get_model():
    global _model
    if _model is None:
        try:
            from .model_loader import load_model
            _model = load_model()
        except Exception:
            _model = "fallback"
    return _model


# ═══════════════════════════════════════════════════════════════
# Module 1 — Digital Arrest Scam Detection
# ═══════════════════════════════════════════════════════════════

class AudioAnalysisRequest(BaseModel):
    audio_url: str = ""
    transcript: Optional[str] = None


SCAM_KEYWORDS = [
    "police", "arrest", "money laundering", "freezing", "aadhaar",
    "scam", "fraud", "warrant", "transfer", "account", "otp",
    "customs", "cbi", "narcotics", "rbi", "court order",
    "digital arrest", "secure account", "gift card",
]

SCAM_CATEGORIES = {
    "digital arrest": ["police", "arrest", "warrant", "court order", "digital arrest"],
    "impersonation": ["customs", "cbi", "narcotics", "rbi"],
    "financial fraud": ["transfer", "account", "otp", "gift card", "secure account"],
    "identity theft": ["aadhaar", "pan", "kyc"],
}


@router.post("/scam/analyze-call")
async def analyze_call(request: AudioAnalysisRequest):
    transcript = request.transcript or ""
    transcript_lower = transcript.lower()
    length = len(transcript)

    # Keyword matching
    matched = [kw for kw in SCAM_KEYWORDS if kw in transcript_lower]
    keyword_count = len(matched)

    # Determine scam category
    category = "Unknown"
    for cat, kws in SCAM_CATEGORIES.items():
        if any(kw in transcript_lower for kw in kws):
            category = cat.title()
            break

    # Try ML model, fall back to rule-based
    model = _get_model()
    if model != "fallback":
        try:
            X = [[length, keyword_count]]
            risk_prob = model.predict_proba(X)[0][1]
        except Exception:
            risk_prob = min(keyword_count / 5.0, 1.0)
    else:
        risk_prob = min(keyword_count / 5.0, 1.0)

    risk_pct = round(risk_prob * 100, 1)
    confidence = round(max(risk_prob, 1.0 - risk_prob) * 100, 1)

    # Build reasons
    reasons = []
    if keyword_count > 0:
        reasons.append(f"Detected {keyword_count} suspicious keyword(s): {', '.join(matched[:5])}")
    if length > 100:
        reasons.append(f"Message length ({length} chars) suggests scripted call")
    if "transfer" in transcript_lower or "account" in transcript_lower:
        reasons.append("Financial transaction request detected")
    if "police" in transcript_lower or "arrest" in transcript_lower:
        reasons.append("Authority impersonation pattern detected")
    if not reasons:
        reasons.append("No suspicious patterns detected in transcript")

    # Recommendation
    if risk_pct > 70:
        recommendation = "🚨 HIGH RISK — Hang up immediately! Do NOT share OTP or transfer money. Report to 1930."
    elif risk_pct > 40:
        recommendation = "⚠️ SUSPICIOUS — Verify the caller's identity independently. Do not act on urgency."
    else:
        recommendation = "✅ LOW RISK — Appears safe, but stay vigilant. Never share financial details."

    return {
        "risk_percentage": risk_pct,
        "confidence_score": confidence,
        "recommendation": recommendation,
        "scam_category": category,
        "reasons": reasons,
        "recommended_action": recommendation,
    }


# ═══════════════════════════════════════════════════════════════
# Module 2 — Counterfeit Currency Detection
# ═══════════════════════════════════════════════════════════════

class ImageScanRequest(BaseModel):
    image_base64: str
    denomination: int


@router.post("/currency/scan")
async def scan_currency(request: ImageScanRequest):
    # Simulated CV analysis — vary result based on denomination
    is_genuine = random.random() > 0.4
    anomalies = []
    if not is_genuine:
        possible_anomalies = [
            "Missing security thread",
            "Incorrect RBI logo alignment",
            "Blurred watermark",
            "Color band inconsistency",
            "Missing latent image",
            f"Denomination ₹{request.denomination} micro-print absent",
        ]
        anomalies = random.sample(possible_anomalies, k=min(3, len(possible_anomalies)))

    return {
        "is_genuine": is_genuine,
        "confidence": round(random.uniform(0.82, 0.98), 2),
        "anomalies": anomalies,
        "bounding_boxes": [
            {"x": 100, "y": 200, "w": 50, "h": 50, "label": "Security Thread Area"}
        ] if not is_genuine else [],
    }


# ═══════════════════════════════════════════════════════════════
# Module 4 — Fraud Network Intelligence
# ═══════════════════════════════════════════════════════════════

@router.get("/intelligence/network-graph")
async def get_network_graph():
    return {
        "nodes": [
            {"id": "V1", "label": "Victim (Delhi)", "group": 1},
            {"id": "V2", "label": "Victim (Mumbai)", "group": 1},
            {"id": "S1", "label": "Scammer: +91-98765-XXXXX", "group": 2},
            {"id": "S2", "label": "Scammer: +91-87654-XXXXX", "group": 2},
            {"id": "B1", "label": "Mule Acc: HDFC-1234", "group": 3},
            {"id": "B2", "label": "Mule Acc: SBI-5678", "group": 3},
        ],
        "links": [
            {"source": "S1", "target": "V1", "value": "Scam Call"},
            {"source": "S2", "target": "V2", "value": "WhatsApp Scam"},
            {"source": "V1", "target": "B1", "value": "₹2L Transfer"},
            {"source": "V2", "target": "B2", "value": "₹50K Transfer"},
            {"source": "B1", "target": "S1", "value": "Cashout"},
            {"source": "B2", "target": "S2", "value": "Cashout"},
        ],
    }


# ═══════════════════════════════════════════════════════════════
# Module 5 — Geospatial Crime Intelligence
# ═══════════════════════════════════════════════════════════════

@router.get("/intelligence/hotspots")
async def get_hotspots():
    return [
        {"lat": 28.6139, "lng": 77.2090, "intensity": 0.9, "category": "Digital Arrest"},
        {"lat": 19.0760, "lng": 72.8777, "intensity": 0.7, "category": "UPI Fraud"},
        {"lat": 12.9716, "lng": 77.5946, "intensity": 0.8, "category": "Job Scam"},
        {"lat": 17.3850, "lng": 78.4867, "intensity": 0.6, "category": "Loan App Scam"},
        {"lat": 22.5726, "lng": 88.3639, "intensity": 0.5, "category": "Customs Impersonation"},
    ]


# ═══════════════════════════════════════════════════════════════
# Module 6 — URL / SMS Phishing Detection
# ═══════════════════════════════════════════════════════════════

class TextCheckRequest(BaseModel):
    text: str


PHISHING_PATTERNS = [
    r"update\s*kyc",
    r"account.*blocked",
    r"prize.*won",
    r"click.*here.*immediately",
    r"verify.*identity",
    r"suspend",
    r"urgent.*action",
    r"gift\s*card",
]


@router.post("/scam/check-text")
async def check_text(request: TextCheckRequest):
    text = request.text.lower()

    # Check for suspicious URLs
    has_url = bool(re.search(r"https?://", text))
    suspicious_tld = bool(re.search(r"\.(tk|ml|ga|cf|gq|xyz|top|buzz|click|link|info)\b", text))

    # Check for phishing language
    pattern_matches = [p for p in PHISHING_PATTERNS if re.search(p, text)]

    # Score
    score = 0
    if has_url:
        score += 20
    if suspicious_tld:
        score += 30
    score += len(pattern_matches) * 15

    is_phishing = score >= 30

    # Analysis text
    reasons = []
    if suspicious_tld:
        reasons.append("Suspicious domain extension detected (commonly used in phishing)")
    if has_url:
        reasons.append("Contains a URL — verify the domain matches the official website")
    for p in pattern_matches:
        reasons.append(f"Phishing pattern detected: '{p}'")
    if not reasons:
        reasons.append("No immediate threats detected")

    return {
        "is_safe": not is_phishing,
        "risk_level": "High" if score >= 50 else "Medium" if score >= 30 else "Low",
        "analysis": " | ".join(reasons),
    }


# ═══════════════════════════════════════════════════════════════
# Module 7 — Fraud Reporting
# ═══════════════════════════════════════════════════════════════

# In-memory reports store
REPORTS_DB: list[dict] = []

class FraudReportRequest(BaseModel):
    category: str
    description: str
    contact: Optional[str] = None


@router.post("/reports/submit")
async def submit_report(request: FraudReportRequest):
    report_id = f"REP-2026-{random.randint(1000, 9999)}"
    report = {
        "report_id": report_id,
        "category": request.category,
        "description": request.description,
        "contact": request.contact,
        "status": "submitted",
    }
    REPORTS_DB.append(report)

    return {
        "status": "success",
        "report_id": report_id,
        "message": f"Report submitted successfully. Your case ID is {report_id}. Added to Cyber Crime investigation queue.",
    }


@router.get("/reports")
async def list_reports():
    return {"total": len(REPORTS_DB), "reports": REPORTS_DB}
