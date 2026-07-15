from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from .schemas import IncidentCreate, IncidentResponse, ClusterResponse
from . import services

router = APIRouter(prefix="/geo", tags=["Geospatial Intelligence"])

@router.post("/report", response_model=IncidentResponse, summary="Report a localized incident")
async def report_incident(incident: IncidentCreate):
    return services.add_incident(incident.dict())

@router.get("/incidents", summary="Get incidents by filter")
async def get_incidents(
    city: Optional[str] = None,
    state: Optional[str] = None,
    risk_level: Optional[str] = None
):
    filters = {"city": city, "state": state, "risk_level": risk_level}
    return services.get_incidents(filters)

@router.get("/heatmap", summary="Get heatmap data")
async def get_heatmap():
    # Return lat/lng and intensity
    incidents = services.get_incidents({})
    return [{"lat": i["latitude"], "lng": i["longitude"], "intensity": 1.0 if i["risk_level"]=="HIGH" else 0.5} for i in incidents]

@router.get("/clusters", response_model=List[ClusterResponse], summary="Get crime clusters (DBSCAN)")
async def get_clusters():
    return services.calculate_clusters()

@router.get("/trends", summary="Get temporal trends")
async def get_trends():
    return {"daily": [12, 15, 8, 22], "weekly": [100, 120, 110]}

@router.get("/hotspots", summary="Get top risk areas")
async def get_hotspots():
    clusters = services.calculate_clusters()
    return sorted(clusters, key=lambda x: x["risk_score"], reverse=True)[:5]
