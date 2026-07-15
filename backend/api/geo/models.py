from sqlalchemy import Column, String, Float, DateTime
from datetime import datetime
import uuid
# Assuming there is a Base class available. In an existing FastAPI app, it usually comes from a common database module.
# For isolation, we'll create a standalone Base here if needed, or import from common.
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class GeoIncident(Base):
    __tablename__ = "geo_incidents"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    city = Column(String, index=True, nullable=True)
    district = Column(String, index=True, nullable=True)
    state = Column(String, index=True, nullable=True)
    country = Column(String, default="India")
    risk_level = Column(String, index=True) # HIGH, MEDIUM, LOW
    category = Column(String, index=True)   # Phishing, Mule, Counterfeit, etc.
    prediction_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
