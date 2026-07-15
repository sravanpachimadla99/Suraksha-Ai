from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class IncidentCreate(BaseModel):
    user_id: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = "India"
    risk_level: str
    category: str
    prediction_id: Optional[str] = None

class IncidentResponse(IncidentCreate):
    id: str
    created_at: datetime

class GeoFilter(BaseModel):
    state: Optional[str] = None
    district: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    risk_level: Optional[str] = None

class ClusterResponse(BaseModel):
    cluster_id: int
    center_lat: float
    center_lng: float
    incident_count: int
    risk_score: float
