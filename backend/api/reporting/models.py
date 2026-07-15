from sqlalchemy import Column, String, DateTime, Integer, Text, JSON, ForeignKey
from datetime import datetime
import uuid
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class EmergencyReport(Base):
    __tablename__ = "emergency_reports"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, index=True)
    status = Column(String, default="DRAFT") # DRAFT, GENERATED, FILED
    fraud_type = Column(String)
    risk_level = Column(String, nullable=True)
    location_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class EvidenceFile(Base):
    __tablename__ = "evidence_files"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, index=True)
    file_path = Column(String)
    file_hash = Column(String)
    file_type = Column(String)

class EntityExtraction(Base):
    __tablename__ = "entity_extractions"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, index=True)
    entity_type = Column(String) # UPI, EMAIL, PHONE, URL
    value = Column(String)

class CaseTimeline(Base):
    __tablename__ = "case_timeline"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, index=True)
    event_time = Column(String)
    event_description = Column(String)

class FIRDraft(Base):
    __tablename__ = "fir_drafts"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    report_id = Column(String, index=True)
    draft_text = Column(Text)
    suggested_sections = Column(JSON)
