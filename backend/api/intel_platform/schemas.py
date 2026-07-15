from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AccountReport(BaseModel):
    account_number: str
    bank_name: str
    holder_name: str
    risk_score: float

class UPIReport(BaseModel):
    upi_id: str
    merchant_name: str
    risk_score: float

class NumberReport(BaseModel):
    phone_number: str
    country_code: str
    carrier: str
    risk_score: float

class AccountResponse(BaseModel):
    id: str
    account_number: str
    bank_name: str
    holder_name: str
    risk_score: float
    status: str
    created_at: datetime

class NumberResponse(BaseModel):
    id: str
    phone_number: str
    carrier: str
    risk_score: float
    spam_reports: int
    status: str
    created_at: datetime
