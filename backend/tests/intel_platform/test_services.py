import pytest
from api.intel_platform.services import report_account, report_upi, report_number, get_accounts, get_numbers, get_alerts, get_dashboard_summary

def test_report_account():
    data = {
        "account_number": "9999999999",
        "bank_name": "Axis Bank",
        "holder_name": "Fake Account Holder",
        "risk_score": 0.95
    }
    res = report_account(data)
    assert res["account_number"] == "9999999999"
    assert res["status"] == "SUSPENDED"
    
    # Verify alert generated for high risk
    alerts = get_alerts()
    assert any("Axis Bank" in a["description"] for a in alerts)

def test_report_number():
    data = {
        "phone_number": "8888888888",
        "country_code": "+91",
        "carrier": "Vi",
        "risk_score": 0.30
    }
    res = report_number(data)
    assert res["phone_number"] == "8888888888"
    assert res["status"] == "ACTIVE"

def test_report_upi():
    data = {
        "upi_id": "malicious@okicici",
        "merchant_name": "Phishing Shop",
        "risk_score": 0.88
    }
    res = report_upi(data)
    assert res["upi_id"] == "malicious@okicici"
    assert res["status"] == "BLOCKED"

def test_get_dashboard_summary():
    summary = get_dashboard_summary()
    assert "top_fraud_banks" in summary
    assert "total_active_alerts" in summary
