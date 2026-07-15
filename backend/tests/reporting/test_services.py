import pytest
import os
from api.reporting.services import create_report, handle_evidence_upload, generate_pdf_for_report
from api.reporting.pdf_generator import generate_evidence_pdf

def test_create_report():
    report = create_report("u1", "UPI Fraud", "I lost money to phone 9876543210 via scammer@ybl")
    assert report["fraud_type"] == "UPI Fraud"
    assert "9876543210" in report["entities"]["PHONE"][0]
    assert "scammer@ybl" in report["entities"]["UPI"][0]

def test_handle_evidence_upload():
    res = handle_evidence_upload("r1", "test.png", b"fake_bytes")
    assert res["file_path"] == "/uploads/test.png"
    assert res["file_hash"] is not None

def test_generate_pdf():
    report = create_report("u2", "Voice Scam", "Scam call received")
    path = generate_pdf_for_report(report["id"])
    assert os.path.exists(path)
    assert path.endswith(".pdf")
    
    # cleanup
    if os.path.exists(path):
        os.remove(path)
