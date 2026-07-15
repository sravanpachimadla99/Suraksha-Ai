# ─────────────────────────────────────────────────────────────────────────────
# backend/api/website_detection/feature_extractor.py
# URL & HTML feature extraction for the phishing detection pipeline
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import math
import re
import socket
import ssl
import urllib.parse
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
import ipaddress

# ── Constants ─────────────────────────────────────────────────────────────────

SUSPICIOUS_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top", "buzz",
    "click", "link", "info", "biz", "us", "cc", "pw",
    "ru", "cn", "in", "online", "site", "website",
}

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "secure", "account", "update",
    "bank", "paypal", "amazon", "google", "microsoft", "apple",
    "support", "alert", "confirm", "password", "otp", "kyc",
    "reward", "prize", "lottery", "gift", "free", "urgent",
    "suspended", "blocked", "limited", "action", "required",
    "rbi", "sbi", "hdfc", "icici", "axis", "npci", "upi",
    "aadhaar", "pan", "income-tax",
]

BRAND_KEYWORDS = [
    "paypal", "amazon", "google", "microsoft", "apple", "netflix",
    "facebook", "instagram", "twitter", "whatsapp", "telegram",
    "hdfc", "sbi", "icici", "axis", "kotak", "rbi",
]

# Known-legitimate TLDs less commonly abused
SAFE_TLDS = {"gov", "edu", "mil"}


# ── Helpers ───────────────────────────────────────────────────────────────────

def _url_entropy(url: str) -> float:
    """Shannon entropy of the URL string."""
    if not url:
        return 0.0
    freq = Counter(url)
    total = len(url)
    return -sum((c / total) * math.log2(c / total) for c in freq.values())


def _is_ip_address(host: str) -> bool:
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


def _count_special_chars(url: str) -> int:
    return sum(url.count(c) for c in ["@", "!", "#", "$", "%", "^", "&", "*", "=", "+", "~"])


def _count_subdomains(host: str) -> int:
    parts = host.split(".")
    # e.g. www.secure.bank.com → 2 subdomains beyond TLD+SLD
    return max(0, len(parts) - 2)


def _typosquatting_score(domain: str, brands: List[str] = BRAND_KEYWORDS) -> float:
    """
    Returns 0.0-1.0 similarity to any known brand using character overlap.
    Higher score = more suspicious.
    """
    domain_clean = re.sub(r"\.[a-z]{2,}", "", domain.lower())
    max_sim = 0.0
    for brand in brands:
        # Simple bigram overlap
        def bigrams(s: str) -> set:
            return {s[i: i + 2] for i in range(len(s) - 1)}

        b1, b2 = bigrams(domain_clean), bigrams(brand)
        if not b1 or not b2:
            continue
        sim = len(b1 & b2) / len(b1 | b2)
        if domain_clean != brand and sim > max_sim:
            max_sim = sim
    return round(max_sim, 3)


# ── Main Extractor ────────────────────────────────────────────────────────────

class URLFeatureExtractor:
    """
    Extracts a flat feature vector from a URL string alone (no network calls).
    All attributes are deterministic given the same input.
    """

    def __init__(self, url: str) -> None:
        self.url = url
        self._parsed = urllib.parse.urlparse(url)
        self.domain = self._parsed.netloc.lower().split(":")[0]
        self.path = self._parsed.path
        self.tld = self.domain.split(".")[-1] if "." in self.domain else ""
        self._full_url_lower = url.lower()

    # ── Individual features ───────────────────────────────────────────────────

    @property
    def url_length(self) -> int:
        return len(self.url)

    @property
    def has_https(self) -> bool:
        return self._parsed.scheme == "https"

    @property
    def has_ip_address(self) -> bool:
        return _is_ip_address(self.domain)

    @property
    def uses_suspicious_tld(self) -> bool:
        return self.tld in SUSPICIOUS_TLDS

    @property
    def subdomain_count(self) -> int:
        return _count_subdomains(self.domain)

    @property
    def special_char_count(self) -> int:
        return _count_special_chars(self.url)

    @property
    def has_at_symbol(self) -> bool:
        return "@" in self._parsed.netloc

    @property
    def has_double_slash(self) -> bool:
        return "//" in self._parsed.path

    @property
    def has_redirect(self) -> bool:
        return "redirect" in self._full_url_lower or "url=" in self._full_url_lower

    @property
    def suspicious_keyword_count(self) -> int:
        return sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in self._full_url_lower)

    @property
    def detected_keywords(self) -> List[str]:
        return [kw for kw in SUSPICIOUS_KEYWORDS if kw in self._full_url_lower]

    @property
    def typosquatting_score(self) -> float:
        return _typosquatting_score(self.domain)

    @property
    def url_entropy(self) -> float:
        return _url_entropy(self.url)

    # ── Composite risk score (rule-based) ─────────────────────────────────────

    def rule_based_risk_score(self) -> float:
        """
        Returns a 0-1 risk score using a weighted rule engine.
        Used as ML fallback when no trained model is available.
        """
        score = 0.0

        if not self.has_https:
            score += 0.15
        if self.has_ip_address:
            score += 0.20
        if self.uses_suspicious_tld:
            score += 0.15
        if self.subdomain_count >= 3:
            score += 0.10
        if self.url_length > 100:
            score += 0.10
        if self.special_char_count >= 3:
            score += 0.10
        if self.has_at_symbol:
            score += 0.15
        if self.has_double_slash:
            score += 0.05
        if self.has_redirect:
            score += 0.10
        if self.suspicious_keyword_count >= 3:
            score += 0.15
        if self.typosquatting_score >= 0.5:
            score += 0.20

        return min(score, 1.0)

    def to_ml_vector(self) -> List[float]:
        """Flat numeric feature vector for ML models."""
        return [
            float(self.url_length),
            float(self.has_https),
            float(self.has_ip_address),
            float(self.uses_suspicious_tld),
            float(self.subdomain_count),
            float(self.special_char_count),
            float(self.has_at_symbol),
            float(self.has_double_slash),
            float(self.has_redirect),
            float(self.suspicious_keyword_count),
            self.typosquatting_score,
            self.url_entropy,
        ]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url_length": self.url_length,
            "has_https": self.has_https,
            "has_ip_address": self.has_ip_address,
            "uses_suspicious_tld": self.uses_suspicious_tld,
            "subdomain_count": self.subdomain_count,
            "special_char_count": self.special_char_count,
            "has_at_symbol": self.has_at_symbol,
            "has_double_slash": self.has_double_slash,
            "has_redirect": self.has_redirect,
            "suspicious_keyword_count": self.suspicious_keyword_count,
            "typosquatting_score": self.typosquatting_score,
            "url_entropy": self.url_entropy,
        }
