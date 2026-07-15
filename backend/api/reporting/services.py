import uuid
import hashlib
from datetime import datetime
from typing import Dict, Any, List
from api.assistant.llm_provider import LLMProvider
from .pdf_generator import generate_evidence_pdf

llm = LLMProvider()

# In-memory store for simulation
MOCK_REPORTS = {}

def extract_entities(text: str) -> Dict[str, Any]:
    # In a real scenario, LLM extracts structured JSON. Mocking it here.
    return {
        "entities": {
            "PHONE": ["+91 9876543210"] if "phone" in text.lower() or any(c.isdigit() for c in text) else [],
            "UPI": ["scammer@ybl"] if "upi" in text.lower() or "@" in text else [],
            "URL": ["http://phishing-site.com"] if "http" in text.lower() or "www" in text.lower() else []
        },
        "timeline": [
            {"time": "10:00 AM", "event": "Initial contact"},
            {"time": "10:15 AM", "event": "Fraudulent link clicked"}
        ],
        "suggested_sections": ["IPC Section 420 (Cheating)", "IT Act Section 66D"],
        "risk_level": "HIGH",
        "summary": f"User reported a potential fraud incident. Automated extraction flagged key indicators."
    }

def create_report(user_id: str, fraud_type: str, description: str, location_data: dict = None) -> Dict[str, Any]:
    report_id = str(uuid.uuid4())
    
    # AI Pipeline extraction
    extraction = extract_entities(description)
    
    report = {
        "id": report_id,
        "user_id": user_id,
        "fraud_type": fraud_type,
        "description": description,
        "location_data": location_data,
        "created_at": datetime.utcnow().isoformat(),
        "status": "GENERATED",
        **extraction
    }
    
    MOCK_REPORTS[report_id] = report
    return report

def handle_evidence_upload(report_id: str, file_name: str, file_content_bytes: bytes) -> Dict[str, Any]:
    file_hash = hashlib.sha256(file_content_bytes).hexdigest()
    # In reality, save bytes to disk. We mock it here.
    return {
        "file_path": f"/uploads/{file_name}",
        "file_hash": file_hash,
        "status": "Secured & Scanned"
    }

def generate_pdf_for_report(report_id: str) -> str:
    report_data = MOCK_REPORTS.get(report_id)
    if not report_data:
        raise ValueError("Report not found")
    
    return generate_evidence_pdf(report_data)
