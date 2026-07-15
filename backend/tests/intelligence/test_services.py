import pytest
from unittest.mock import AsyncMock, patch
from api.intelligence.schemas import GraphImportRequest, GraphNode, GraphLink
from api.intelligence.services import import_graph_data, get_network_graph, get_high_risk_nodes

@pytest.mark.asyncio
async def test_import_graph_data():
    request = GraphImportRequest(
        nodes=[GraphNode(id="n1", type="Person", label="Test", properties={}, risk_score=0.5)],
        links=[GraphLink(source="n1", target="n2", type="KNOWS", properties={})]
    )
    
    with patch("api.intelligence.services.repository.import_data", new_callable=AsyncMock) as mock_import:
        response = await import_graph_data(request)
        assert response["status"] == "success"
        mock_import.assert_called_once()

@pytest.mark.asyncio
async def test_get_network_graph():
    with patch("api.intelligence.services.repository.get_network", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = {"nodes": [], "links": []}
        response = await get_network_graph()
        assert "nodes" in response
        assert "links" in response

@pytest.mark.asyncio
async def test_get_high_risk_nodes():
    mock_network = {
        "nodes": [
            {"id": "n1", "risk_score": 0.5},
            {"id": "n2", "risk_score": 0.9}
        ],
        "links": []
    }
    with patch("api.intelligence.services.repository.get_network", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_network
        high_risk = await get_high_risk_nodes()
        assert len(high_risk) == 1
        assert high_risk[0]["id"] == "n2"
