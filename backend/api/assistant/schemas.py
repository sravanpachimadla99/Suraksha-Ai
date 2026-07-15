from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    language: Optional[str] = "en"
    context: Optional[dict] = None

class MessageResponse(BaseModel):
    session_id: str
    message: str
    risk_assessment: Optional[str] = None
    recommended_actions: Optional[List[str]] = None
    related_resources: Optional[List[str]] = None
    module_used: Optional[str] = None

class UploadRequest(BaseModel):
    session_id: str
    file_name: str
    file_type: str
    content: str  # Base64 encoded content
