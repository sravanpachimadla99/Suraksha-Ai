import pytest
from api.assistant.services import classify_intent, process_chat
from api.assistant.rag_engine import rag_engine

def test_classify_intent():
    assert classify_intent("http://google.com") == "website_detection"
    assert classify_intent("scan this qr code") == "qr_detection"
    assert classify_intent("i got a voice call asking for otp") == "voice_analysis"
    assert classify_intent("is this 500 rupee note fake?") == "currency_detection"
    assert classify_intent("what should I do if my debit card is stolen?") == "knowledge_base"

def test_rag_retrieval():
    # Should retrieve RBI guidelines for unauthorized transactions
    result = rag_engine.retrieve("unauthorized transaction")
    assert "RBI" in result or "bank" in result.lower()
    
def test_process_chat():
    res = process_chat("http://phishing.com", session_id="test_sess")
    assert res["session_id"] == "test_sess"
    assert res["module_used"] == "website_detection"
    
    res_kb = process_chat("I shared my OTP")
    assert res_kb["session_id"] is not None
    assert res_kb["module_used"] == "knowledge_base"
