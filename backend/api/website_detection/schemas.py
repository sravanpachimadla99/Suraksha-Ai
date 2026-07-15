# ─────────────────────────────────────────────────────────────────────────────
# backend/api/website_detection/schemas.py
# Pydantic request / response models
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, HttpUrl, field_validator


# ── Requests ──────────────────────────────────────────────────────────────────

class WebsiteAnalyzeRequest(BaseModel):
    url: str
    check_ssl: bool = True
    check_whois: bool = True
    check_dns: bool = True
    check_html: bool = True

    @field_validator("url", mode="before")
    @classmethod
    def normalize_url(cls, v: str) -> str:
        v = v.strip()
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        return v


class BatchAnalyzeRequest(BaseModel):
    urls: List[str]


class ScreenshotAnalyzeRequest(BaseModel):
    """Screenshot sent as base64-encoded string."""
    image_base64: str
    filename: Optional[str] = "screenshot.png"


# ── Sub-response models ────────────────────────────────────────────────────────

class SSLInfo(BaseModel):
    valid: bool
    issuer: Optional[str] = None
    subject: Optional[str] = None
    expires: Optional[str] = None
    days_remaining: Optional[int] = None


class WhoisInfo(BaseModel):
    registrar: Optional[str] = None
    creation_date: Optional[str] = None
    expiration_date: Optional[str] = None
    domain_age_days: Optional[int] = None
    country: Optional[str] = None


class DNSInfo(BaseModel):
    ip_addresses: List[str] = []
    mx_records: List[str] = []
    ns_records: List[str] = []
    uses_ip_directly: bool = False


class ThreatIndicator(BaseModel):
    name: str
    severity: str          # low / medium / high / critical
    description: str
    detected: bool


class FeatureVector(BaseModel):
    url_length: int
    has_https: bool
    has_ip_address: bool
    uses_suspicious_tld: bool
    subdomain_count: int
    special_char_count: int
    has_at_symbol: bool
    has_double_slash: bool
    has_redirect: bool
    suspicious_keyword_count: int
    typosquatting_score: float
    url_entropy: float


class WebsiteAnalysisResult(BaseModel):
    url: str
    domain: str
    prediction: str              # Legitimate / Suspicious / Phishing
    confidence: float
    risk_level: str              # Low / Medium / High / Critical
    risk_score: float            # 0.0 – 1.0
    ssl: SSLInfo
    whois: WhoisInfo
    dns: DNSInfo
    features: FeatureVector
    threats: List[ThreatIndicator]
    detected_keywords: List[str]
    recommendations: List[str]
    processing_time_ms: float
    analysis_id: str


class BatchAnalysisResult(BaseModel):
    total: int
    results: List[WebsiteAnalysisResult]
    summary: Dict[str, Any]


class AnalysisHistoryItem(BaseModel):
    analysis_id: str
    url: str
    domain: str
    prediction: str
    risk_level: str
    confidence: float
    created_at: str


class AnalysisHistoryResponse(BaseModel):
    total: int
    items: List[AnalysisHistoryItem]
