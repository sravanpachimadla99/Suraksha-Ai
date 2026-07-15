from sqlalchemy import Column, String, DateTime, Float, Integer, JSON
from datetime import datetime
import uuid
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ThreatPrediction(Base):
    __tablename__ = "threat_predictions"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    category = Column(String)
    predicted_threat = Column(String)
    confidence = Column(Float)
    probability = Column(Float)
    affected_regions = Column(JSON) # List of regions
    expected_time_window = Column(String)
    severity = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class ThreatAlert(Base):
    __tablename__ = "threat_alerts"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    alert_type = Column(String)
    description = Column(String)
    severity = Column(String) # HIGH, MEDIUM, LOW
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionHistory(Base):
    __tablename__ = "prediction_history"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    prediction_id = Column(String)
    model_used = Column(String)
    actual_outcome = Column(String, nullable=True)
    accuracy_score = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class PredictionModel(Base):
    __tablename__ = "prediction_models"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True)
    framework = Column(String) # XGBoost, LightGBM, LSTM, GRU, Prophet
    is_active = Column(Integer, default=1)
