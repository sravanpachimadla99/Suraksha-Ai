from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ReportCreate(BaseModel):
    user_id: str
    fraud_type: str
    description: str
    location_data: Optional[Dict[str, Any]] = None

class ExtractResult(BaseModel):
    entities: Dict[str, List[str]]
    timeline: List[Dict[str, Any]]
    suggested_sections: List[str]
    risk_level: str
    summary: str

class ReportResponse(BaseModel):
    id: str
    status: str
    fraud_type: str
    created_at: datetime
    extracts: Optional[ExtractResult] = None
