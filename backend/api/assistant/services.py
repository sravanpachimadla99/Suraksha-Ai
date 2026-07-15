import uuid
from typing import Dict, Any, Tuple
from .llm_provider import LLMProvider
from .rag_engine import rag_engine

llm = LLMProvider()

def classify_intent(message: str) -> str:
    """Simple rule-based classifier to route to appropriate modules"""
    msg_lower = message.lower()
    if "http" in msg_lower or "www" in msg_lower or ".com" in msg_lower:
        return "website_detection"
    elif "qr" in msg_lower or "scan" in msg_lower:
        return "qr_detection"
    elif "call" in msg_lower or "voice" in msg_lower or "spoke" in msg_lower:
        return "voice_analysis"
    elif "note" in msg_lower or "fake currency" in msg_lower or "rupee" in msg_lower:
        return "currency_detection"
    else:
        return "knowledge_base"

def process_chat(message: str, session_id: str = None) -> Dict[str, Any]:
    if not session_id:
        session_id = str(uuid.uuid4())
        
    module = classify_intent(message)
    context = ""
    
    if module == "knowledge_base":
        context = rag_engine.retrieve(message)
        
    response_text = llm.generate_response(message, context=context)
    
    # Mocking standard response structure for enterprise compliance
    return {
        "session_id": session_id,
        "message": response_text,
        "risk_assessment": "Medium" if "urgent" in message.lower() else "Low",
        "recommended_actions": ["Do not share OTP", "Report to bank"],
        "related_resources": ["cybercrime.gov.in"],
        "module_used": module
    }
