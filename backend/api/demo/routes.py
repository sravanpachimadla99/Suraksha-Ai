from fastapi import APIRouter
import logging
from api.intel_platform.services import ACCOUNTS_DB, NUMBERS_DB, UPI_DB, ALERTS_DB
from api.prediction.services import PREDICTIONS_DB

router = APIRouter(prefix="/demo", tags=["Demo & Monitoring Mode"])
logger = logging.getLogger(__name__)

@router.post("/seed", summary="Seed demo data for all modules")
async def seed_demo_data():
    # Clear existing
    ACCOUNTS_DB.clear()
    NUMBERS_DB.clear()
    UPI_DB.clear()
    ALERTS_DB.clear()
    PREDICTIONS_DB.clear()

    # Seed
    ACCOUNTS_DB.extend([
        {"id": "a1", "account_number": "1234567890", "bank_name": "State Bank of India", "holder_name": "Ravi Kumar", "risk_score": 0.85, "status": "SUSPENDED"},
        {"id": "a2", "account_number": "0987654321", "bank_name": "HDFC Bank", "holder_name": "Aisha Sharma", "risk_score": 0.20, "status": "ACTIVE"}
    ])
    NUMBERS_DB.extend([
        {"id": "n1", "phone_number": "9876543210", "country_code": "+91", "carrier": "Jio", "risk_score": 0.90, "spam_reports": 15, "status": "BLOCKED"},
        {"id": "n2", "phone_number": "9998887776", "country_code": "+91", "carrier": "Airtel", "risk_score": 0.15, "spam_reports": 1, "status": "ACTIVE"}
    ])
    UPI_DB.append({"id": "u1", "upi_id": "scammer@ybl", "merchant_name": "Fake Store LLC", "risk_score": 0.95, "status": "BLOCKED"})
    ALERTS_DB.extend([
        {"id": "al1", "alert_type": "High Risk Account", "description": "SBI Account flagged with risk score 0.85.", "risk_level": "HIGH"},
        {"id": "al2", "alert_type": "Repeated Scam Number", "description": "Phone number 9876543210 reported by multiple users.", "risk_level": "HIGH"}
    ])
    PREDICTIONS_DB.extend([
        {"id": "p1", "category": "UPI", "predicted_threat": "High Volume UPI Scam Wave", "confidence": 0.88, "probability": 0.82, "affected_regions": ["NCR Delhi"], "expected_time_window": "Next 72 Hours", "severity": "HIGH", "recommended_preventive_actions": ["SMS alerts"]}
    ])
    
    logger.info("Demo data seeded successfully.")
    return {"status": "ok", "message": "Demo datasets successfully seeded across all platforms"}

@router.post("/reset", summary="Clear and reset demo databases")
async def reset_demo_data():
    ACCOUNTS_DB.clear()
    NUMBERS_DB.clear()
    UPI_DB.clear()
    ALERTS_DB.clear()
    PREDICTIONS_DB.clear()
    logger.info("Database reset.")
    return {"status": "ok", "message": "Demo data wiped and reset"}

@router.get("/health", summary="Detailed health metrics")
async def health_check():
    return {
        "status": "healthy",
        "uptime": "100%",
        "database_connected": True,
        "neo4j_connected": True,
        "redis_connected": True
    }

@router.get("/metrics", summary="Prometheus exporter metrics stub")
async def metrics():
    return {
        "http_requests_total": 425,
        "api_execution_latency_seconds_avg": 0.04,
        "active_ws_connections": 1
    }
