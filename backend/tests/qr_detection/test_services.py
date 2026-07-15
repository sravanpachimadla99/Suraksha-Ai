# ─────────────────────────────────────────────────────────────────────────────
# backend/tests/qr_detection/test_services.py
# ─────────────────────────────────────────────────────────────────────────────
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

import pytest
from api.qr_detection.services import _classify_qr_type, _analyze_upi

class TestQRClassification:
    def test_classify_upi(self):
        assert _classify_qr_type("upi://pay?pa=test@okbank") == "UPI Payment"
        
    def test_classify_url(self):
        assert _classify_qr_type("https://google.com") == "Website URL"
        assert _classify_qr_type("http://example.com") == "Website URL"
        
    def test_classify_wifi(self):
        assert _classify_qr_type("WIFI:S:MyNet;T:WPA;P:pass;;") == "WiFi"
        
    def test_classify_sms(self):
        assert _classify_qr_type("smsto:+1234567890:Hello") == "SMS"
        
    def test_classify_text(self):
        assert _classify_qr_type("Just some random text") == "Text"

class TestUPIAnalysis:
    def test_valid_upi(self):
        prediction, confidence, risk_level, threats, merchant, upi = _analyze_upi("upi://pay?pa=valid@bank&pn=John%20Doe")
        assert prediction == "Safe"
        assert upi == "valid@bank"
        assert merchant == "John Doe"
        assert risk_level == "Low"
        assert len(threats) == 0

    def test_invalid_upi_format(self):
        prediction, confidence, risk_level, threats, merchant, upi = _analyze_upi("upi://pay?pn=NoAddress")
        assert prediction == "Suspicious"
        assert risk_level == "High"
        assert any(t.name == "Invalid UPI Format" for t in threats)

    def test_blacklisted_upi(self):
        prediction, confidence, risk_level, threats, merchant, upi = _analyze_upi("upi://pay?pa=scammer@ybl")
        assert prediction == "Malicious"
        assert risk_level == "Critical"
        assert any(t.name == "Blacklisted Payee" for t in threats)

    def test_suspicious_merchant_name(self):
        prediction, confidence, risk_level, threats, merchant, upi = _analyze_upi("upi://pay?pa=test@bank&pn=Customer%20Support")
        assert prediction == "Suspicious"
        assert risk_level == "Medium"
        assert any(t.name == "Suspicious Merchant Name" for t in threats)
