from sqlalchemy import Column, String, DateTime, Float, Integer
from datetime import datetime
import uuid
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class FraudAccount(Base):
    __tablename__ = "fraud_accounts"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    account_number = Column(String, unique=True, index=True)
    bank_name = Column(String)
    holder_name = Column(String)
    risk_score = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE")
    last_seen = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

class FraudPhoneNumber(Base):
    __tablename__ = "fraud_phone_numbers"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    phone_number = Column(String, unique=True, index=True)
    country_code = Column(String)
    carrier = Column(String)
    risk_score = Column(Float, default=0.0)
    spam_reports = Column(Integer, default=0)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class FraudUPI(Base):
    __tablename__ = "fraud_upi"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    upi_id = Column(String, unique=True, index=True)
    merchant_name = Column(String)
    risk_score = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE")
    created_at = Column(DateTime, default=datetime.utcnow)

class FraudMerchant(Base):
    __tablename__ = "fraud_merchants"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    merchant_id = Column(String, unique=True)
    name = Column(String)
    risk_score = Column(Float, default=0.0)

class FraudAlert(Base):
    __tablename__ = "fraud_alerts"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    alert_type = Column(String) # High Risk Account, Repeated Scam Number, etc.
    description = Column(String)
    risk_level = Column(String) # HIGH, MEDIUM, LOW
    created_at = Column(DateTime, default=datetime.utcnow)

class AgencyNotification(Base):
    __tablename__ = "agency_notifications"
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    agency_name = Column(String)
    alert_id = Column(String)
    sent_at = Column(DateTime, default=datetime.utcnow)
