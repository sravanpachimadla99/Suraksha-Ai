# ─────────────────────────────────────────────────────────────────────────────
# backend/api/website_detection/services.py
# Core analysis pipeline: SSL, WHOIS, DNS, HTML, ML prediction
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import hashlib
import socket
import ssl
import time
import urllib.parse
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import httpx

from .feature_extractor import URLFeatureExtractor, SUSPICIOUS_KEYWORDS
from .schemas import (
    DNSInfo,
    FeatureVector,
    SSLInfo,
    ThreatIndicator,
    WebsiteAnalysisResult,
    WhoisInfo,
)

# ── Timeout settings ──────────────────────────────────────────────────────────
_HTTP_TIMEOUT = 8.0   # seconds
_DNS_TIMEOUT = 4.0
_SSL_TIMEOUT = 5.0


# ── SSL Inspection ─────────────────────────────────────────────────────────────

def _check_ssl(domain: str) -> SSLInfo:
    """Attempt to retrieve the SSL certificate for the given domain."""
    try:
        ctx = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=_SSL_TIMEOUT) as sock:
            with ctx.wrap_socket(sock, server_hostname=domain) as ssock:
                cert = ssock.getpeercert()

        # Parse expiry
        not_after_str = cert.get("notAfter", "")
        not_after: Optional[datetime] = None
        if not_after_str:
            try:
                not_after = datetime.strptime(not_after_str, "%b %d %H:%M:%S %Y %Z")
            except ValueError:
                not_after = None

        days_remaining: Optional[int] = None
        if not_after:
            days_remaining = (not_after.replace(tzinfo=timezone.utc) - datetime.now(timezone.utc)).days

        # Issuer & subject
        issuer_fields = dict(x[0] for x in cert.get("issuer", []))
        subject_fields = dict(x[0] for x in cert.get("subject", []))

        return SSLInfo(
            valid=True,
            issuer=issuer_fields.get("organizationName") or issuer_fields.get("O"),
            subject=subject_fields.get("commonName") or subject_fields.get("CN"),
            expires=not_after.isoformat() if not_after else None,
            days_remaining=days_remaining,
        )
    except Exception:
        return SSLInfo(valid=False)


# ── WHOIS Lookup ───────────────────────────────────────────────────────────────

def _check_whois(domain: str) -> WhoisInfo:
    """Retrieve WHOIS registration data. Gracefully degrades if library absent."""
    try:
        import whois  # python-whois
        w = whois.whois(domain)

        creation_date = w.creation_date
        expiration_date = w.expiration_date

        # whois can return list or single datetime
        if isinstance(creation_date, list):
            creation_date = creation_date[0]
        if isinstance(expiration_date, list):
            expiration_date = expiration_date[0]

        domain_age_days: Optional[int] = None
        if creation_date and isinstance(creation_date, datetime):
            domain_age_days = (datetime.now() - creation_date).days

        return WhoisInfo(
            registrar=w.registrar,
            creation_date=creation_date.isoformat() if creation_date else None,
            expiration_date=expiration_date.isoformat() if expiration_date else None,
            domain_age_days=domain_age_days,
            country=w.country,
        )
    except Exception:
        return WhoisInfo()


# ── DNS Lookup ─────────────────────────────────────────────────────────────────

def _check_dns(domain: str) -> DNSInfo:
    """Resolve IP addresses and check for MX / NS records."""
    ips: List[str] = []
    mx: List[str] = []
    ns: List[str] = []
    uses_ip = False

    try:
        import ipaddress
        # Detect if host is already an IP
        try:
            ipaddress.ip_address(domain)
            uses_ip = True
            ips = [domain]
        except ValueError:
            pass

        if not uses_ip:
            addr_infos = socket.getaddrinfo(domain, None)
            ips = list({info[4][0] for info in addr_infos})

        # Try dnspython for MX/NS
        try:
            import dns.resolver  # type: ignore
            try:
                mx = [str(r.exchange) for r in dns.resolver.resolve(domain, "MX", lifetime=_DNS_TIMEOUT)]
            except Exception:
                pass
            try:
                ns = [str(r) for r in dns.resolver.resolve(domain, "NS", lifetime=_DNS_TIMEOUT)]
            except Exception:
                pass
        except ImportError:
            pass

    except Exception:
        pass

    return DNSInfo(ip_addresses=ips, mx_records=mx, ns_records=ns, uses_ip_directly=uses_ip)


# ── HTML Analysis ──────────────────────────────────────────────────────────────

_PHISHING_PAGE_PATTERNS = [
    "enter your password",
    "verify your account",
    "confirm your identity",
    "your account has been suspended",
    "update your kyc",
    "otp",
    "submit your details",
]


def _analyze_html(url: str) -> Dict[str, Any]:
    """Fetch the page and look for phishing indicators in the HTML."""
    result: Dict[str, Any] = {
        "has_login_form": False,
        "external_resources_count": 0,
        "suspicious_text_count": 0,
        "page_title": None,
        "has_obfuscated_js": False,
        "redirect_count": 0,
    }
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 Chrome/120.0 Safari/537.36"
            )
        }
        with httpx.Client(timeout=_HTTP_TIMEOUT, follow_redirects=True) as client:
            resp = client.get(url, headers=headers)
            result["redirect_count"] = len(resp.history)

        try:
            from bs4 import BeautifulSoup  # type: ignore

            soup = BeautifulSoup(resp.text, "lxml")

            # Page title
            title_tag = soup.find("title")
            result["page_title"] = title_tag.get_text(strip=True) if title_tag else None

            # Login form detection
            forms = soup.find_all("form")
            for form in forms:
                inputs = form.find_all("input", {"type": ["password", "text", "email"]})
                if inputs:
                    result["has_login_form"] = True
                    break

            # External resource count
            parsed_domain = urllib.parse.urlparse(url).netloc
            external = [
                tag
                for tag in soup.find_all(["script", "img", "link", "iframe"])
                if tag.get("src") and parsed_domain not in str(tag.get("src", ""))
                   and str(tag.get("src", "")).startswith("http")
            ]
            result["external_resources_count"] = len(external)

            # Suspicious text in page body
            body_text = soup.get_text().lower()
            result["suspicious_text_count"] = sum(
                1 for p in _PHISHING_PAGE_PATTERNS if p in body_text
            )

            # JS obfuscation heuristic – look for eval(atob(... or base64 blobs
            scripts = [s.string or "" for s in soup.find_all("script")]
            js_text = " ".join(scripts)
            if re.search(r"eval\s*\(|atob\s*\(|unescape\s*\(|fromCharCode", js_text):
                result["has_obfuscated_js"] = True

        except ImportError:
            pass  # bs4 not installed; skip HTML analysis

    except Exception:
        pass

    return result


# ── Threat Indicator Builder ───────────────────────────────────────────────────

def _build_threats(
    extractor: URLFeatureExtractor,
    ssl_info: SSLInfo,
    whois_info: WhoisInfo,
    html_info: Dict[str, Any],
) -> List[ThreatIndicator]:
    threats: List[ThreatIndicator] = []

    threats.append(ThreatIndicator(
        name="HTTPS Not Used",
        severity="high",
        description="Site does not use HTTPS — traffic can be intercepted.",
        detected=not extractor.has_https,
    ))
    threats.append(ThreatIndicator(
        name="Invalid SSL Certificate",
        severity="high",
        description="SSL certificate is invalid or expired.",
        detected=not ssl_info.valid,
    ))
    if ssl_info.valid and ssl_info.days_remaining is not None:
        threats.append(ThreatIndicator(
            name="SSL Expiring Soon",
            severity="medium",
            description=f"Certificate expires in {ssl_info.days_remaining} days.",
            detected=ssl_info.days_remaining < 30,
        ))
    threats.append(ThreatIndicator(
        name="IP Address in URL",
        severity="critical",
        description="URL uses a raw IP address instead of a domain name.",
        detected=extractor.has_ip_address,
    ))
    threats.append(ThreatIndicator(
        name="Suspicious TLD",
        severity="medium",
        description=f"Domain uses a TLD often associated with phishing: .{extractor.tld}",
        detected=extractor.uses_suspicious_tld,
    ))
    threats.append(ThreatIndicator(
        name="Excessive Subdomains",
        severity="medium",
        description=f"{extractor.subdomain_count} subdomains detected — phishing sites often use subdomain tricks.",
        detected=extractor.subdomain_count >= 3,
    ))
    threats.append(ThreatIndicator(
        name="New Domain",
        severity="high",
        description="Domain was registered very recently (< 90 days) — common phishing tactic.",
        detected=(
            whois_info.domain_age_days is not None
            and whois_info.domain_age_days < 90
        ),
    ))
    threats.append(ThreatIndicator(
        name="Typosquatting",
        severity="high",
        description="Domain is very similar to a known brand — possible typosquatting.",
        detected=extractor.typosquatting_score >= 0.5,
    ))
    threats.append(ThreatIndicator(
        name="Suspicious Keywords in URL",
        severity="medium",
        description=f"URL contains {extractor.suspicious_keyword_count} phishing-related keyword(s).",
        detected=extractor.suspicious_keyword_count >= 2,
    ))
    threats.append(ThreatIndicator(
        name="Login Form Detected",
        severity="medium",
        description="Page contains a login or credential form.",
        detected=html_info.get("has_login_form", False),
    ))
    threats.append(ThreatIndicator(
        name="JavaScript Obfuscation",
        severity="high",
        description="Page uses obfuscated JavaScript — common in phishing and malware.",
        detected=html_info.get("has_obfuscated_js", False),
    ))
    threats.append(ThreatIndicator(
        name="Suspicious Page Text",
        severity="medium",
        description="Page body contains phrases typical of phishing pages.",
        detected=html_info.get("suspicious_text_count", 0) >= 2,
    ))
    threats.append(ThreatIndicator(
        name="Multiple Redirects",
        severity="medium",
        description=f"Page redirected {html_info.get('redirect_count', 0)} time(s) before loading.",
        detected=html_info.get("redirect_count", 0) >= 3,
    ))

    return threats


# ── Recommendation Builder ─────────────────────────────────────────────────────

def _build_recommendations(
    prediction: str, ssl_info: SSLInfo, whois_info: WhoisInfo, threats: List[ThreatIndicator]
) -> List[str]:
    recs: List[str] = []
    active = [t.name for t in threats if t.detected]

    if prediction == "Phishing":
        recs.append("🚨 DO NOT enter any personal information on this website.")
        recs.append("🚫 Do not click any links or download files from this site.")
        recs.append("📞 Report this URL to cybercrime.gov.in or call 1930.")
    elif prediction == "Suspicious":
        recs.append("⚠️ Exercise extreme caution — this site shows multiple red flags.")
        recs.append("🔍 Verify the URL matches the official website before proceeding.")

    if "HTTPS Not Used" in active:
        recs.append("🔒 Never submit passwords or payment data on non-HTTPS sites.")
    if "Invalid SSL Certificate" in active:
        recs.append("⚠️ The security certificate is invalid — your connection may be compromised.")
    if "Typosquatting" in active:
        recs.append("✅ Always type the official website URL directly; do not use links from messages.")
    if not recs:
        recs.append("✅ Site appears legitimate. Always stay cautious while browsing.")

    return recs


# ── Prediction Engine ──────────────────────────────────────────────────────────

def _predict(risk_score: float) -> Tuple[str, float]:
    """Map a 0-1 risk score to a prediction label and confidence."""
    if risk_score >= 0.65:
        return "Phishing", round(risk_score, 3)
    elif risk_score >= 0.35:
        return "Suspicious", round(0.5 + risk_score * 0.3, 3)
    else:
        return "Legitimate", round(1.0 - risk_score, 3)


def _risk_level(risk_score: float) -> str:
    if risk_score >= 0.75:
        return "Critical"
    elif risk_score >= 0.55:
        return "High"
    elif risk_score >= 0.35:
        return "Medium"
    return "Low"


# ── Public API ─────────────────────────────────────────────────────────────────

def analyze_website(
    url: str,
    check_ssl: bool = True,
    check_whois: bool = True,
    check_dns: bool = True,
    check_html: bool = True,
) -> WebsiteAnalysisResult:
    """
    Full analysis pipeline.  Returns a structured WebsiteAnalysisResult.
    All expensive network calls are gated by boolean flags so callers can
    disable them for speed or testing.
    """
    t_start = time.perf_counter()

    extractor = URLFeatureExtractor(url)

    ssl_info = _check_ssl(extractor.domain) if check_ssl else SSLInfo(valid=False)
    whois_info = _check_whois(extractor.domain) if check_whois else WhoisInfo()
    dns_info = _check_dns(extractor.domain) if check_dns else DNSInfo()
    html_info = _analyze_html(url) if check_html else {}

    # --- Risk scoring ---------------------------------------------------------
    rule_score = extractor.rule_based_risk_score()

    # Boost from network / HTML signals
    bonus = 0.0
    if not ssl_info.valid:
        bonus += 0.10
    if whois_info.domain_age_days is not None and whois_info.domain_age_days < 90:
        bonus += 0.10
    if html_info.get("has_obfuscated_js"):
        bonus += 0.15
    if html_info.get("suspicious_text_count", 0) >= 2:
        bonus += 0.10

    risk_score = min(rule_score + bonus, 1.0)
    prediction, confidence = _predict(risk_score)

    threats = _build_threats(extractor, ssl_info, whois_info, html_info)
    recommendations = _build_recommendations(prediction, ssl_info, whois_info, threats)

    feature_dict = extractor.to_dict()
    features = FeatureVector(**feature_dict)

    # Stable analysis ID from URL hash
    analysis_id = "WA-" + hashlib.sha1(url.encode()).hexdigest()[:12].upper()

    elapsed_ms = (time.perf_counter() - t_start) * 1000

    return WebsiteAnalysisResult(
        url=url,
        domain=extractor.domain,
        prediction=prediction,
        confidence=round(confidence * 100, 2),
        risk_level=_risk_level(risk_score),
        risk_score=round(risk_score, 4),
        ssl=ssl_info,
        whois=whois_info,
        dns=dns_info,
        features=features,
        threats=threats,
        detected_keywords=extractor.detected_keywords,
        recommendations=recommendations,
        processing_time_ms=round(elapsed_ms, 2),
        analysis_id=analysis_id,
    )
