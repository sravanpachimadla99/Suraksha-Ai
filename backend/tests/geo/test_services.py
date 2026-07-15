import pytest
from api.geo.services import get_incidents, add_incident, calculate_clusters

def test_add_incident():
    new_inc = {
        "user_id": "test_user",
        "latitude": 10.0,
        "longitude": 10.0,
        "city": "TestCity",
        "risk_level": "LOW",
        "category": "TestCategory"
    }
    added = add_incident(new_inc)
    assert "id" in added
    assert "created_at" in added

def test_get_incidents():
    incidents = get_incidents({"city": "New Delhi"})
    assert len(incidents) > 0
    for inc in incidents:
        assert inc["city"] == "New Delhi"

def test_calculate_clusters():
    clusters = calculate_clusters()
    assert isinstance(clusters, list)
    # The dummy data has 2 in New Delhi and 2 in Mumbai, so there should be 2 clusters
    assert len(clusters) == 2
