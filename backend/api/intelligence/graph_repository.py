import logging
from typing import Dict, List, Any
from .neo4j_client import client

logger = logging.getLogger(__name__)

class GraphRepository:
    async def import_data(self, nodes: List[Dict[str, Any]], links: List[Dict[str, Any]]) -> None:
        driver = client.get_driver()
        if not driver:
            logger.warning("Neo4j driver not available. Skipping import.")
            return

        async with driver.session() as session:
            for node in nodes:
                # Merge node using ID
                query = f"""
                MERGE (n:{node['type']} {{id: $id}})
                SET n += $props, n.label = $label, n.risk_score = $risk_score
                """
                await session.run(
                    query, 
                    id=node["id"], 
                    props=node["properties"], 
                    label=node["label"],
                    risk_score=node["risk_score"]
                )
            
            for link in links:
                # Merge relationship
                query = f"""
                MATCH (a {{id: $source}}), (b {{id: $target}})
                MERGE (a)-[r:{link['type']}]->(b)
                SET r += $props
                """
                await session.run(
                    query,
                    source=link["source"],
                    target=link["target"],
                    props=link["properties"]
                )

    async def get_network(self) -> Dict[str, List[Any]]:
        driver = client.get_driver()
        if not driver:
            # Return dummy data if Neo4j is not connected
            return {
                "nodes": [
                    {"id": "V1", "type": "Person", "label": "Victim", "properties": {}, "risk_score": 0.1},
                    {"id": "S1", "type": "Person", "label": "Scammer", "properties": {}, "risk_score": 0.9}
                ],
                "links": [
                    {"source": "S1", "target": "V1", "type": "TARGETED", "properties": {}}
                ]
            }
        
        async with driver.session() as session:
            result = await session.run("MATCH (n) OPTIONAL MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 100")
            nodes_dict = {}
            links = []
            
            async for record in result:
                n = record["n"]
                if n and n["id"] not in nodes_dict:
                    nodes_dict[n["id"]] = {
                        "id": n["id"],
                        "type": list(n.labels)[0] if n.labels else "Unknown",
                        "label": n.get("label", n["id"]),
                        "properties": dict(n.items()),
                        "risk_score": n.get("risk_score", 0.0)
                    }
                
                m = record["m"]
                if m and m["id"] not in nodes_dict:
                    nodes_dict[m["id"]] = {
                        "id": m["id"],
                        "type": list(m.labels)[0] if m.labels else "Unknown",
                        "label": m.get("label", m["id"]),
                        "properties": dict(m.items()),
                        "risk_score": m.get("risk_score", 0.0)
                    }
                    
                r = record["r"]
                if r:
                    links.append({
                        "source": r.nodes[0]["id"],
                        "target": r.nodes[1]["id"],
                        "type": r.type,
                        "properties": dict(r.items())
                    })
                    
            return {
                "nodes": list(nodes_dict.values()),
                "links": links
            }

repository = GraphRepository()
