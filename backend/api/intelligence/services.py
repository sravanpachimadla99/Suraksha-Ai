import logging
from typing import Dict, Any, List
from .graph_repository import repository
from .schemas import GraphImportRequest

logger = logging.getLogger(__name__)

async def import_graph_data(request: GraphImportRequest) -> Dict[str, str]:
    nodes = [node.dict() for node in request.nodes]
    links = [link.dict() for link in request.links]
    
    await repository.import_data(nodes, links)
    return {"status": "success", "message": f"Imported {len(nodes)} nodes and {len(links)} links."}

async def get_network_graph() -> Dict[str, List[Any]]:
    return await repository.get_network()

async def get_high_risk_nodes() -> List[Dict[str, Any]]:
    # In a real app, query neo4j for nodes with risk_score > 0.8
    # For now, get all and filter
    net = await repository.get_network()
    high_risk = [n for n in net["nodes"] if n.get("risk_score", 0) > 0.8]
    return high_risk
