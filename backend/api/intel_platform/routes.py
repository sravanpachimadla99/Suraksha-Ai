from fastapi import APIRouter
from typing import List
from .schemas import AccountReport, AccountResponse, UPIReport, NumberReport, NumberResponse
from . import services

router = APIRouter(prefix="", tags=["Bank & Telecom Intelligence"])

@router.post("/bank/report-account", response_model=AccountResponse, summary="Report fraud bank account")
async def report_account(req: AccountReport):
    return services.report_account(req.dict())

@router.post("/bank/report-upi", summary="Report fraud UPI ID")
async def report_upi(req: UPIReport):
    return services.report_upi(req.dict())

@router.get("/bank/accounts", response_model=List[AccountResponse], summary="Get fraud bank accounts list")
async def get_accounts():
    return services.get_accounts()

@router.get("/bank/alerts", summary="Get bank intelligence alerts")
async def get_bank_alerts():
    return [a for a in services.get_alerts() if "Account" in a["alert_type"]]

@router.post("/telecom/report-number", response_model=NumberResponse, summary="Report scam phone number")
async def report_number(req: NumberReport):
    return services.report_number(req.dict())

@router.get("/telecom/numbers", response_model=List[NumberResponse], summary="Get scam phone numbers list")
async def get_numbers():
    return services.get_numbers()

@router.get("/telecom/alerts", summary="Get telecom alerts")
async def get_telecom_alerts():
    return [a for a in services.get_alerts() if "Number" in a["alert_type"]]

@router.get("/intelligence/dashboard", summary="Get shared intelligence dashboard data")
async def get_dashboard():
    return services.get_dashboard_summary()
