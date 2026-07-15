from typing import Dict, Any
from fastapi import APIRouter, HTTPException

from .schemas import GraphImportRequest, GraphNetworkResponse
from .services import import_graph_data, get_network_graph, get_high_risk_nodes
from .neo4j_client import client

router = APIRouter(prefix="/graph", tags=["Intelligence"])

@router.on_event("startup")
async def startup_event():
    await client.connect()

@router.on_event("shutdown")
async def shutdown_event():
    await client.close()

@router.post("/import", summary="Import nodes and relationships")
async def import_data(request: GraphImportRequest) -> Dict[str, str]:
    return await import_graph_data(request)

@router.get("/network", response_model=GraphNetworkResponse, summary="Get full network graph")
async def get_network():
    return await get_network_graph()

@router.get("/high-risk", summary="Get high risk nodes")
async def get_high_risk():
    return await get_high_risk_nodes()

# Dummy endpoints for unimplemented features
@router.get("/node/{id}")
async def get_node(id: str):
    return {"id": id, "type": "Person", "properties": {}}

@router.get("/path")
async def get_path(source: str, target: str):
    return {"path": []}

@router.get("/clusters")
async def get_clusters():
    return []

@router.get("/search")
async def search_graph(q: str):
    return []

@router.delete("/node/{id}")
async def delete_node(id: str):
    return {"status": "deleted"}
