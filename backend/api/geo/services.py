import numpy as np
from sklearn.cluster import DBSCAN
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

# In-memory store for simulation since we don't have a real DB connection configured for this module yet.
# In production, this would use SQLAlchemy with the GeoIncident model.
MOCK_INCIDENTS = [
    {"id": "1", "user_id": "u1", "latitude": 28.6139, "longitude": 77.2090, "city": "New Delhi", "risk_level": "HIGH", "category": "Phishing"},
    {"id": "2", "user_id": "u2", "latitude": 28.6239, "longitude": 77.2190, "city": "New Delhi", "risk_level": "HIGH", "category": "Phishing"},
    {"id": "3", "user_id": "u3", "latitude": 19.0760, "longitude": 72.8777, "city": "Mumbai", "risk_level": "MEDIUM", "category": "Mule"},
    {"id": "4", "user_id": "u4", "latitude": 19.0860, "longitude": 72.8877, "city": "Mumbai", "risk_level": "HIGH", "category": "Counterfeit"},
]

def get_incidents(filters: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Simple filtering
    result = MOCK_INCIDENTS
    if filters.get("city"):
        result = [i for i in result if i["city"].lower() == filters["city"].lower()]
    if filters.get("risk_level"):
        result = [i for i in result if i["risk_level"] == filters["risk_level"]]
    return result

def add_incident(incident: Dict[str, Any]) -> Dict[str, Any]:
    import uuid
    from datetime import datetime
    new_inc = incident.copy()
    new_inc["id"] = str(uuid.uuid4())
    new_inc["created_at"] = datetime.utcnow().isoformat()
    MOCK_INCIDENTS.append(new_inc)
    return new_inc

def calculate_clusters() -> List[Dict[str, Any]]:
    if not MOCK_INCIDENTS:
        return []
        
    coords = np.array([[inc["latitude"], inc["longitude"]] for inc in MOCK_INCIDENTS])
    
    # DBSCAN: epsilon in radians (e.g., 5km / 6371km radius of earth), min_samples=2
    kms_per_radian = 6371.0088
    epsilon = 10 / kms_per_radian
    
    db = DBSCAN(eps=epsilon, min_samples=2, algorithm='ball_tree', metric='haversine')
    # Convert to radians for haversine
    db.fit(np.radians(coords))
    
    clusters = []
    labels = db.labels_
    
    unique_labels = set(labels)
    for k in unique_labels:
        if k == -1:
            continue # Noise
            
        class_member_mask = (labels == k)
        cluster_points = coords[class_member_mask]
        
        center_lat = np.mean(cluster_points[:, 0])
        center_lng = np.mean(cluster_points[:, 1])
        
        clusters.append({
            "cluster_id": int(k),
            "center_lat": float(center_lat),
            "center_lng": float(center_lng),
            "incident_count": len(cluster_points),
            "risk_score": 0.8 # Mock calculation
        })
        
    return clusters
