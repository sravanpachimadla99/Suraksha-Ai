from fastapi import APIRouter, File, UploadFile
from fastapi.responses import FileResponse
from .schemas import ReportCreate, ReportResponse, ExtractResult
from . import services
import os

router = APIRouter(prefix="/report", tags=["Emergency Reporting"])

@router.post("/emergency", response_model=ReportResponse, summary="Create a new emergency report")
async def create_report(request: ReportCreate):
    report_data = services.create_report(request.user_id, request.fraud_type, request.description, request.location_data)
    # Map back to schema
    extract = ExtractResult(
        entities=report_data["entities"],
        timeline=report_data["timeline"],
        suggested_sections=report_data["suggested_sections"],
        risk_level=report_data["risk_level"],
        summary=report_data["summary"]
    )
    return ReportResponse(
        id=report_data["id"],
        status=report_data["status"],
        fraud_type=report_data["fraud_type"],
        created_at=report_data["created_at"],
        extracts=extract
    )

@router.post("/upload", summary="Upload evidence for a report")
async def upload_evidence(report_id: str, file: UploadFile = File(...)):
    content = await file.read()
    return services.handle_evidence_upload(report_id, file.filename, content)

@router.post("/generate", summary="Generate final PDF evidence package")
async def generate_pdf(report_id: str):
    path = services.generate_pdf_for_report(report_id)
    return {"message": "PDF generated", "file_path": path}

@router.get("/{id}", response_model=ReportResponse, summary="Get report details")
async def get_report(id: str):
    report_data = services.MOCK_REPORTS.get(id)
    if not report_data:
        return {"error": "Not found"}
    extract = ExtractResult(
        entities=report_data["entities"],
        timeline=report_data["timeline"],
        suggested_sections=report_data["suggested_sections"],
        risk_level=report_data["risk_level"],
        summary=report_data["summary"]
    )
    return ReportResponse(
        id=report_data["id"],
        status=report_data["status"],
        fraud_type=report_data["fraud_type"],
        created_at=report_data["created_at"],
        extracts=extract
    )

@router.get("/download/{id}", summary="Download PDF evidence package")
async def download_report(id: str):
    # Just generating it on the fly if it exists for the mock demo
    path = services.generate_pdf_for_report(id)
    if os.path.exists(path):
        return FileResponse(path, media_type='application/pdf', filename=f"evidence_{id}.pdf")
    return {"error": "File not found"}
