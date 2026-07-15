# ─────────────────────────────────────────────────────────────────────────────
# backend/api/currency_detection/routes.py
# FastAPI router — all /currency/* endpoints
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import base64
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from .schemas import (
    CurrencyAnalyzeRequest,
    CurrencyAnalysisResult,
    CurrencyHistoryItem,
    CurrencyHistoryResponse,
    SUPPORTED_DENOMINATIONS,
)
from .services import analyze_currency

router = APIRouter(prefix="/currency", tags=["Currency Detection"])

_HISTORY: List[Dict[str, Any]] = []
_MAX_HISTORY = 500
_MAX_UPLOAD_BYTES = 20 * 1024 * 1024   # 20 MB
_ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}


def _save_history(result: CurrencyAnalysisResult) -> None:
    _HISTORY.append({
        "analysis_id":   result.analysis_id,
        "denomination":  result.denomination,
        "prediction":    result.prediction,
        "confidence":    result.confidence,
        "risk_level":    result.risk_level,
        "features_passed": result.features_passed,
        "features_failed": result.features_failed,
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


# ── POST /currency/upload ─────────────────────────────────────────────────────

@router.post("/upload", response_model=CurrencyAnalysisResult,
             summary="Upload a currency note image file for analysis")
async def upload_currency_image(
    file: UploadFile = File(..., description="JPG/PNG/WEBP note image (max 20 MB)"),
    denomination: Optional[int] = Form(None),
) -> CurrencyAnalysisResult:
    _check_extension(file.filename or "note.jpg")
    raw = await file.read()
    if len(raw) > _MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File exceeds 20 MB limit.")
    b64 = base64.b64encode(raw).decode()
    result = await run_in_threadpool(analyze_currency, b64, denomination, file.filename or "note.jpg")
    _save_history(result)
    return result


# ── POST /currency/analyze ────────────────────────────────────────────────────

@router.post("/analyze", response_model=CurrencyAnalysisResult,
             summary="Analyze currency from base64-encoded image JSON body")
async def analyze_currency_base64(request: CurrencyAnalyzeRequest) -> CurrencyAnalysisResult:
    try:
        result = await run_in_threadpool(
            analyze_currency,
            request.image_base64,
            request.denomination,
            request.filename or "note.jpg",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}")
    _save_history(result)
    return result


# ── POST /currency/camera ─────────────────────────────────────────────────────

@router.post("/camera", response_model=CurrencyAnalysisResult,
             summary="Analyze currency from live camera frame")
async def analyze_camera_capture(request: CurrencyAnalyzeRequest) -> CurrencyAnalysisResult:
    """
    Identical pipeline to /currency/analyze.
    Kept as a separate endpoint to allow future camera-specific
    pre-processing (e.g., multi-frame averaging, HDR capture).
    """
    try:
        result = await run_in_threadpool(
            analyze_currency,
            request.image_base64,
            request.denomination,
            "camera_capture.jpg",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Camera analysis failed: {exc}")
    _save_history(result)
    return result


# ── GET /currency/history ─────────────────────────────────────────────────────

@router.get("/history", response_model=CurrencyHistoryResponse,
            summary="Get currency analysis history")
async def get_currency_history(limit: int = 50, offset: int = 0) -> CurrencyHistoryResponse:
    sliced = list(reversed(_HISTORY))[offset: offset + limit]
    return CurrencyHistoryResponse(
        total=len(_HISTORY),
        items=[CurrencyHistoryItem(**item) for item in sliced],
    )


# ── GET /currency/report/{id} ─────────────────────────────────────────────────

@router.get("/report/{analysis_id}", response_model=CurrencyHistoryItem,
            summary="Get a specific currency analysis report")
async def get_currency_report(analysis_id: str) -> CurrencyHistoryItem:
    for item in reversed(_HISTORY):
        if item["analysis_id"] == analysis_id:
            return CurrencyHistoryItem(**item)
    raise HTTPException(status_code=404, detail=f"Report {analysis_id} not found.")


# ── DELETE /currency/{id} ─────────────────────────────────────────────────────

@router.delete("/{analysis_id}", summary="Delete a currency analysis record")
async def delete_currency_analysis(analysis_id: str) -> Dict[str, str]:
    global _HISTORY
    before = len(_HISTORY)
    _HISTORY = [h for h in _HISTORY if h["analysis_id"] != analysis_id]
    if len(_HISTORY) == before:
        raise HTTPException(status_code=404, detail=f"Analysis {analysis_id} not found.")
    return {"status": "deleted", "analysis_id": analysis_id}


# ── GET /currency/denominations ───────────────────────────────────────────────

@router.get("/denominations", summary="List all supported Indian currency denominations")
async def list_denominations() -> Dict[str, Any]:
    return {
        "supported": SUPPORTED_DENOMINATIONS,
        "currency": "INR",
        "issuer": "Reserve Bank of India",
        "note": "Additional denominations supported via model updates.",
    }
