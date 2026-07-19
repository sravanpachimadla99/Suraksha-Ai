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
    "click", "link", "info", "biz", "cc", "pw",
    "ru", "cn", "online", "site", "website",
}

# These keywords are suspicious ONLY when they appear in the domain part
# of a URL that does NOT actually belong to the brand itself.
SUSPICIOUS_KEYWORDS = [
    "phish", "phishing", "scam", "fraud", "fake", "signin",
    "verify", "secure", "otp", "kyc", "reward", "prize", "lottery",
    "gift", "urgent", "suspended", "blocked", "login", "account",
    "update", "support", "free", "action", "required", "limited",
]

# Brand names: used for typosquatting detection. A URL is ONLY suspicious
# when a brand keyword is embedded in a domain that ISN'T the real brand.
BRAND_KEYWORDS = [
    "paypal", "amazon", "google", "microsoft", "apple", "netflix",
    "facebook", "instagram", "twitter", "whatsapp", "telegram",
    "hdfc", "sbi", "icici", "axis", "kotak", "rbi",
]

# Known legitimate domains — never flag these
KNOWN_LEGITIMATE_DOMAINS = {
    "google.com", "www.google.com", "google.co.in",
    "youtube.com", "www.youtube.com",
    "amazon.com", "www.amazon.com", "amazon.in", "www.amazon.in",
    "microsoft.com", "www.microsoft.com", "login.microsoftonline.com",
    "apple.com", "www.apple.com",
    "facebook.com", "www.facebook.com",
    "instagram.com", "www.instagram.com",
    "twitter.com", "www.twitter.com", "x.com",
    "github.com", "www.github.com",
    "linkedin.com", "www.linkedin.com",
    "wikipedia.org", "en.wikipedia.org",
    "reddit.com", "www.reddit.com",
    "netflix.com", "www.netflix.com",
    "whatsapp.com", "www.whatsapp.com",
    "telegram.org", "www.telegram.org",
    "paypal.com", "www.paypal.com",
    "flipkart.com", "www.flipkart.com",
    "stackoverflow.com", "www.stackoverflow.com",
    "medium.com", "www.medium.com",
    "sbi.co.in", "www.sbi.co.in", "onlinesbi.sbi",
    "hdfcbank.com", "www.hdfcbank.com",
    "icicibank.com", "www.icicibank.com",
    "axisbank.com", "www.axisbank.com",
    "rbi.org.in", "www.rbi.org.in",
    "npci.org.in", "www.npci.org.in",
    "cybercrime.gov.in", "www.cybercrime.gov.in",
    "india.gov.in", "www.india.gov.in",
}

# Known-legitimate TLDs less commonly abused
SAFE_TLDS = {"gov", "edu", "mil", "gov.in", "ac.in", "edu.in"}


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


def _extract_base_domain(domain: str) -> str:
    """Extract 'example.com' from 'sub.example.com'. Simple heuristic."""
    parts = domain.lower().split(".")
    # Handle two-part TLDs like .co.in, .gov.in, .ac.uk
    if len(parts) >= 3 and parts[-2] in ("co", "gov", "ac", "org", "net", "edu"):
        return ".".join(parts[-3:])
    if len(parts) >= 2:
        return ".".join(parts[-2:])
    return domain


def _is_known_legitimate(domain: str) -> bool:
    """Check if domain is a known-legitimate site."""
    domain_lower = domain.lower().rstrip(".")
    if domain_lower in KNOWN_LEGITIMATE_DOMAINS:
        return True
    base = _extract_base_domain(domain_lower)
    if base in KNOWN_LEGITIMATE_DOMAINS:
        return True
    # Gov / edu TLDs
    for safe in SAFE_TLDS:
        if domain_lower.endswith("." + safe):
            return True
    return False


def _typosquatting_score(domain: str, brands: List[str] = BRAND_KEYWORDS) -> float:
    """
    Returns 0.0-1.0 similarity to any known brand using character overlap.
    Higher score = more suspicious.
    Returns 0 if the domain IS the actual brand site.
    """
    base_domain = _extract_base_domain(domain)
    domain_clean = re.sub(r"\.[a-z.]{2,}$", "", base_domain)

    max_sim = 0.0
    for brand in brands:
        # If this IS the brand's real domain, not typosquatting
        if domain_clean == brand:
            return 0.0

        # If the brand is fully contained in the domain (e.g., google-update.com),
        # this is extremely suspicious.
        if brand in domain_clean:
            return 0.9

        # Calculate Levenshtein distance for very close typos (e.g., goog1e)
        def levenshtein(s1: str, s2: str) -> int:
            if len(s1) < len(s2):
                return levenshtein(s2, s1)
            if len(s2) == 0:
                return len(s1)
            previous_row = range(len(s2) + 1)
            for i, c1 in enumerate(s1):
                current_row = [i + 1]
                for j, c2 in enumerate(s2):
                    insertions = previous_row[j + 1] + 1
                    deletions = current_row[j] + 1
                    substitutions = previous_row[j] + (c1 != c2)
                    current_row.append(min(insertions, deletions, substitutions))
                previous_row = current_row
            return previous_row[-1]

        ld = levenshtein(domain_clean, brand)
        if ld == 1:
            return 0.85
        elif ld == 2:
            sim = 0.6
        else:
            def bigrams(s: str) -> set:
                return {s[i: i + 2] for i in range(len(s) - 1)}

            b1, b2 = bigrams(domain_clean), bigrams(brand)
            if not b1 or not b2:
                continue
            sim = len(b1 & b2) / len(b1 | b2)

        if sim > max_sim:
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
        # Handle case where URL doesn't have scheme
        if not self._parsed.scheme:
            self._parsed = urllib.parse.urlparse("https://" + url)
        self.domain = self._parsed.netloc.lower().split(":")[0]
        self.path = self._parsed.path
        self.tld = self.domain.split(".")[-1] if "." in self.domain else ""
        self._full_url_lower = url.lower()
        self._is_legitimate = _is_known_legitimate(self.domain)

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
        # Known-legitimate domains never get TLD penalty
        if self._is_legitimate:
            return False
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
        """Count suspicious keywords ONLY in the domain part, not in path/query."""
        if self._is_legitimate:
            return 0
        domain_lower = self.domain.lower()
        return sum(1 for kw in SUSPICIOUS_KEYWORDS if kw in domain_lower)

    @property
    def detected_keywords(self) -> List[str]:
        """Only report keywords found in the domain itself."""
        if self._is_legitimate:
            return []
        domain_lower = self.domain.lower()
        return [kw for kw in SUSPICIOUS_KEYWORDS if kw in domain_lower]

    @property
    def typosquatting_score(self) -> float:
        if self._is_legitimate:
            return 0.0
        return _typosquatting_score(self.domain)

    @property
    def url_entropy(self) -> float:
        return _url_entropy(self.url)

    # ── Composite risk score (rule-based) ─────────────────────────────────────

    def rule_based_risk_score(self) -> float:
        """
        Returns a 0-1 risk score using a weighted rule engine.
        Known-legitimate domains get a near-zero score.
        """
        # Fast-path for well-known legitimate sites
        if self._is_legitimate:
            score = 0.0
            # Even legitimate sites get a tiny bump if no HTTPS
            if not self.has_https:
                score += 0.05
            return score

        score = 0.0

        # High-risk keywords in the domain name itself (phish, scam, etc.)
        domain_lower = self.domain.lower()
        if any(kw in domain_lower for kw in ["phish", "scam", "fraud", "evil", "fake"]):
            score += 0.50

        if not self.has_https:
            score += 0.15
        if self.has_ip_address:
            score += 0.35
        if self.uses_suspicious_tld:
            score += 0.20
        if self.subdomain_count >= 3:
            score += 0.15
        if self.url_length > 100:
            score += 0.08
        if self.special_char_count >= 3:
            score += 0.10
        if self.has_at_symbol:
            score += 0.20
        if self.has_double_slash:
            score += 0.10
        if self.has_redirect:
            score += 0.10

        # Only count keywords in the DOMAIN, not the path
        domain_kw_count = self.suspicious_keyword_count
        if domain_kw_count >= 2:
            score += min(0.30, 0.15 * domain_kw_count)
        elif domain_kw_count == 1:
            score += 0.08

        if self.typosquatting_score >= 0.8:
            score += 0.50
        elif self.typosquatting_score >= 0.5:
            score += 0.30
        elif self.typosquatting_score >= 0.4:
            score += 0.15

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
