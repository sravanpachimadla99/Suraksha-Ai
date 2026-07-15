# ─────────────────────────────────────────────────────────────────────────────
# backend/tests/website_detection/test_feature_extractor.py
# Unit tests for URLFeatureExtractor (no network calls)
# ─────────────────────────────────────────────────────────────────────────────
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from api.website_detection.feature_extractor import URLFeatureExtractor


# ── Fixture URLs ──────────────────────────────────────────────────────────────

PHISHING_URL = "http://secure-login.hdfc.update-kyc.xyz/verify/account?otp=true"
LEGIT_URL = "https://www.hdfc.com/personal/loans"
IP_URL = "http://192.168.1.1/admin/login"
TYPO_URL = "https://paypa1.com/signin"
LONG_URL = "https://example.com/" + "a" * 200


# ── Tests ─────────────────────────────────────────────────────────────────────

class TestURLFeatureExtractor:

    def test_https_detection_http(self):
        ext = URLFeatureExtractor(PHISHING_URL)
        assert ext.has_https is False

    def test_https_detection_https(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        assert ext.has_https is True

    def test_ip_address_detection(self):
        ext = URLFeatureExtractor(IP_URL)
        assert ext.has_ip_address is True

    def test_no_ip_on_legit_url(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        assert ext.has_ip_address is False

    def test_suspicious_tld_xyz(self):
        ext = URLFeatureExtractor(PHISHING_URL)
        assert ext.uses_suspicious_tld is True

    def test_legit_tld_com(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        assert ext.uses_suspicious_tld is False

    def test_subdomain_count_high(self):
        ext = URLFeatureExtractor(PHISHING_URL)
        # secure-login.hdfc.update-kyc.xyz → ≥ 3 parts beyond TLD+SLD
        assert ext.subdomain_count >= 2

    def test_subdomain_count_low(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        assert ext.subdomain_count <= 1

    def test_url_length_long(self):
        ext = URLFeatureExtractor(LONG_URL)
        assert ext.url_length > 100

    def test_url_length_short(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        assert ext.url_length < 100

    def test_suspicious_keywords_present(self):
        ext = URLFeatureExtractor(PHISHING_URL)
        assert ext.suspicious_keyword_count >= 2

    def test_suspicious_keywords_absent(self):
        # Use a URL that contains no phishing-related keywords
        ext = URLFeatureExtractor("https://www.wikipedia.org/wiki/Python")
        assert ext.suspicious_keyword_count == 0

    def test_typosquatting_paypal(self):
        ext = URLFeatureExtractor(TYPO_URL)
        # paypa1 should score > 0 similarity to paypal
        assert ext.typosquatting_score > 0

    def test_entropy_is_float(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        assert isinstance(ext.url_entropy, float)
        assert ext.url_entropy > 0

    def test_risk_score_high_for_phishing(self):
        ext = URLFeatureExtractor(PHISHING_URL)
        score = ext.rule_based_risk_score()
        assert score >= 0.4

    def test_risk_score_low_for_legit(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        score = ext.rule_based_risk_score()
        assert score < 0.5

    def test_ml_vector_length(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        vec = ext.to_ml_vector()
        assert len(vec) == 12

    def test_to_dict_keys(self):
        ext = URLFeatureExtractor(LEGIT_URL)
        d = ext.to_dict()
        required_keys = [
            "url_length", "has_https", "has_ip_address", "uses_suspicious_tld",
            "subdomain_count", "special_char_count", "has_at_symbol",
            "has_double_slash", "has_redirect", "suspicious_keyword_count",
            "typosquatting_score", "url_entropy",
        ]
        for key in required_keys:
            assert key in d, f"Missing key: {key}"

    def test_at_symbol_detection(self):
        url = "http://attacker.com@victim.com/"
        ext = URLFeatureExtractor(url)
        assert ext.has_at_symbol is True

    def test_redirect_detection(self):
        url = "https://evil.com/redirect?url=https://bank.com"
        ext = URLFeatureExtractor(url)
        assert ext.has_redirect is True


class TestPredictionLogic:
    """Test the prediction label mapping from services."""

    def test_high_risk_is_phishing(self):
        from api.website_detection.services import _predict
        pred, conf = _predict(0.80)
        assert pred == "Phishing"

    def test_medium_risk_is_suspicious(self):
        from api.website_detection.services import _predict
        pred, conf = _predict(0.50)
        assert pred == "Suspicious"

    def test_low_risk_is_legitimate(self):
        from api.website_detection.services import _predict
        pred, conf = _predict(0.10)
        assert pred == "Legitimate"

    def test_risk_level_critical(self):
        from api.website_detection.services import _risk_level
        assert _risk_level(0.80) == "Critical"

    def test_risk_level_low(self):
        from api.website_detection.services import _risk_level
        assert _risk_level(0.10) == "Low"
