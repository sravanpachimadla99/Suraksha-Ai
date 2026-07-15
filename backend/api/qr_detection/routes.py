# ─────────────────────────────────────────────────────────────────────────────
# backend/api/qr_detection/routes.py
# ─────────────────────────────────────────────────────────────────────────────
import base64
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from .schemas import (
    QRAnalyzeRequest,
    QRAnalysisResult,
    QRHistoryItem,
    QRHistoryResponse,
)
from .services import analyze_qr_code

router = APIRouter(prefix="/qr", tags=["QR Detection"])

_HISTORY: List[Dict[str, Any]] = []
_MAX_HISTORY = 500
_MAX_UPLOAD_BYTES = 20 * 1024 * 1024   # 20 MB
_ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}

def _save_history(result: QRAnalysisResult) -> None:
    _HISTORY.append({
        "analysis_id":   result.analysis_id,
        "qr_type":       result.qr_type,
        "prediction":    result.prediction,
        "confidence":    result.confidence,
        "risk_level":    result.risk_level,
        "created_at":    datetime.utcnow().isoformat() + "Z",
    })
    if len(_HISTORY) > _MAX_HISTORY:
        _HISTORY.pop(0)

def _check_extension(filename: str) -> None:
    import pathlib
    ext = pathlib.Path(filename).suffix.lower()
    if ext not in _ALLOWED_EXTS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type '{ext}' not supported. Allowed: {sorted(_ALLOWED_EXTS)}",
        )

# ── POST /qr/upload ─────────────────────────────────────────────────────

@router.post("/upload", response_model=QRAnalysisResult, summary="Upload a QR code image")
async def upload_qr_image(
    file: UploadFile = File(..., description="JPG/PNG/WEBP QR code image (max 20 MB)")
) -> QRAnalysisResult:
    _check_extension(file.filename or "qr_code.png")
    raw = await file.read()
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")
    b64 = base64.b64encode(raw).decode()
    try:
        result = await run_in_threadpool(analyze_qr_code, b64, file.filename or "qr_code.png")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    _save_history(result)
    return result

# ── POST /qr/analyze ────────────────────────────────────────────────────

@router.post("/analyze", response_model=QRAnalysisResult, summary="Analyze QR from base64 image")
async def analyze_qr_base64(request: QRAnalyzeRequest) -> QRAnalysisResult:
    try:
        result = await run_in_threadpool(
            analyze_qr_code,
            request.image_base64,
            request.filename or "qr_code.png"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    _save_history(result)
    return result

# ── POST /qr/scan ─────────────────────────────────────────────────────

@router.post("/scan", response_model=QRAnalysisResult, summary="Analyze QR from live camera")
async def analyze_qr_scan(request: QRAnalyzeRequest) -> QRAnalysisResult:
    try:
        result = await run_in_threadpool(
            analyze_qr_code,
            request.image_base64,
            "camera_capture.png"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Camera scan failed: {exc}")
    _save_history(result)
    return result

# ── GET /qr/history ─────────────────────────────────────────────────────

@router.get("/history", response_model=QRHistoryResponse, summary="Get QR analysis history")
async def get_qr_history(limit: int = 50, offset: int = 0) -> QRHistoryResponse:
    sliced = list(reversed(_HISTORY))[offset: offset + limit]
    return QRHistoryResponse(
        total=len(_HISTORY),
        items=[QRHistoryItem(**item) for item in sliced],
    )

# ── GET /qr/report/{id} ─────────────────────────────────────────────────

@router.get("/report/{analysis_id}", response_model=QRHistoryItem, summary="Get a specific QR report")
async def get_qr_report(analysis_id: str) -> QRHistoryItem:
    for item in reversed(_HISTORY):
        if item["analysis_id"] == analysis_id:
            return QRHistoryItem(**item)
    raise HTTPException(status_code=404, detail=f"Report {analysis_id} not found.")

# ── DELETE /qr/{id} ─────────────────────────────────────────────────────

@router.delete("/{analysis_id}", summary="Delete a QR analysis record")
async def delete_qr_analysis(analysis_id: str) -> Dict[str, str]:
    global _HISTORY
    before = len(_HISTORY)
    _HISTORY = [h for h in _HISTORY if h["analysis_id"] != analysis_id]
    if len(_HISTORY) == before:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found.")
    return {"status": "deleted", "analysis_id": analysis_id}
