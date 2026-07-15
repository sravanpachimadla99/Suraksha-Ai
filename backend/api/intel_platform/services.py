import uuid
from datetime import datetime
from typing import List, Dict, Any

# Mock databases for cross-agency intelligence
ACCOUNTS_DB = [
    {"id": "a1", "account_number": "1234567890", "bank_name": "State Bank of India", "holder_name": "Ravi Kumar", "risk_score": 0.85, "status": "SUSPENDED", "created_at": datetime.utcnow()},
    {"id": "a2", "account_number": "0987654321", "bank_name": "HDFC Bank", "holder_name": "Aisha Sharma", "risk_score": 0.20, "status": "ACTIVE", "created_at": datetime.utcnow()},
]

NUMBERS_DB = [
    {"id": "n1", "phone_number": "9876543210", "country_code": "+91", "carrier": "Jio", "risk_score": 0.90, "spam_reports": 15, "status": "BLOCKED", "created_at": datetime.utcnow()},
    {"id": "n2", "phone_number": "9998887776", "country_code": "+91", "carrier": "Airtel", "risk_score": 0.15, "spam_reports": 1, "status": "ACTIVE", "created_at": datetime.utcnow()},
]

UPI_DB = [
    {"id": "u1", "upi_id": "scammer@ybl", "merchant_name": "Fake Store LLC", "risk_score": 0.95, "status": "BLOCKED", "created_at": datetime.utcnow()}
]

ALERTS_DB = [
    {"id": "al1", "alert_type": "High Risk Account", "description": "SBI Account 1234567890 flagged with risk score 0.85.", "risk_level": "HIGH", "created_at": datetime.utcnow()},
    {"id": "al2", "alert_type": "Repeated Scam Number", "description": "Phone number 9876543210 reported by 15 distinct users.", "risk_level": "HIGH", "created_at": datetime.utcnow()}
]

def report_account(data: Dict[str, Any]) -> Dict[str, Any]:
    new_acc = {
        "id": str(uuid.uuid4()),
        "account_number": data["account_number"],
        "bank_name": data["bank_name"],
        "holder_name": data["holder_name"],
        "risk_score": data["risk_score"],
        "status": "ACTIVE" if data["risk_score"] < 0.5 else "SUSPENDED",
        "created_at": datetime.utcnow()
    }
    ACCOUNTS_DB.append(new_acc)
    
    # Trigger alert if risk score is high
    if new_acc["risk_score"] >= 0.7:
        ALERTS_DB.append({
            "id": str(uuid.uuid4()),
            "alert_type": "High Risk Account",
            "description": f"{new_acc['bank_name']} Account {new_acc['account_number']} flagged with risk score {new_acc['risk_score']}.",
            "risk_level": "HIGH",
            "created_at": datetime.utcnow()
        })
    return new_acc

def report_upi(data: Dict[str, Any]) -> Dict[str, Any]:
    new_upi = {
        "id": str(uuid.uuid4()),
        "upi_id": data["upi_id"],
        "merchant_name": data["merchant_name"],
        "risk_score": data["risk_score"],
        "status": "ACTIVE" if data["risk_score"] < 0.5 else "BLOCKED",
        "created_at": datetime.utcnow()
    }
    UPI_DB.append(new_upi)
    return new_upi

def report_number(data: Dict[str, Any]) -> Dict[str, Any]:
    new_num = {
        "id": str(uuid.uuid4()),
        "phone_number": data["phone_number"],
        "country_code": data["country_code"],
        "carrier": data["carrier"],
        "risk_score": data["risk_score"],
        "spam_reports": 1,
        "status": "ACTIVE" if data["risk_score"] < 0.5 else "BLOCKED",
        "created_at": datetime.utcnow()
    }
    NUMBERS_DB.append(new_num)
    return new_num

def get_accounts() -> List[Dict[str, Any]]:
    return ACCOUNTS_DB

def get_numbers() -> List[Dict[str, Any]]:
    return NUMBERS_DB

def get_alerts() -> List[Dict[str, Any]]:
    return ALERTS_DB

def get_dashboard_summary() -> Dict[str, Any]:
    return {
        "top_fraud_banks": [
            {"bank_name": "State Bank of India", "count": 28},
            {"bank_name": "HDFC Bank", "count": 14},
            {"bank_name": "ICICI Bank", "count": 10}
        ],
        "top_scam_numbers": [n["phone_number"] for n in NUMBERS_DB if n["risk_score"] >= 0.7],
        "total_active_alerts": len(ALERTS_DB),
        "telecom_fraud_growth": [5, 12, 18, 25, 30] # growth trend mock data
    }
