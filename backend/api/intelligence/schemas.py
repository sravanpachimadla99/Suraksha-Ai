from typing import Any, Dict, List, Optional
from pydantic import BaseModel

class GraphNode(BaseModel):
    id: str
    type: str
    label: str
    properties: Dict[str, Any]
    risk_score: float

class GraphLink(BaseModel):
    source: str
    target: str
    type: str
    properties: Dict[str, Any]

class GraphNetworkResponse(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

class GraphImportRequest(BaseModel):
    nodes: List[GraphNode]
    links: List[GraphLink]

class ClusterResponse(BaseModel):
    cluster_id: str
    node_ids: List[str]
    risk_level: str
