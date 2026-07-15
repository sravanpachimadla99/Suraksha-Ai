# ─────────────────────────────────────────────────────────────────────────────
# backend/api/website_detection/routes.py
# FastAPI router — all /website/* endpoints
# ─────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import asyncio
import base64
import io
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from fastapi.concurrency import run_in_threadpool

from .schemas import (
    AnalysisHistoryItem,
    AnalysisHistoryResponse,
    BatchAnalysisResult,
    BatchAnalyzeRequest,
    ScreenshotAnalyzeRequest,
    WebsiteAnalysisResult,
    WebsiteAnalyzeRequest,
)
from .services import analyze_website

router = APIRouter(prefix="/website", tags=["Website Detection"])

# ── In-memory history store (replace with DB in production) ──────────────────
_HISTORY: List[Dict[str, Any]] = []
_MAX_HISTORY = 500


def _save_to_history(result: WebsiteAnalysisResult) -> None:
    """Persist a lightweight copy of the result for the history endpoint."""
    _HISTORY.append({
        "analysis_id": result.analysis_id,
        "url": result.url,
        "domain": result.domain,
        "prediction": result.prediction,
        "risk_level": result.risk_level,
        "confidence": result.confidence,
        "created_at": datetime.utcnow().isoformat() + "Z",
    })
    # Keep list bounded
    if len(_HISTORY) > _MAX_HISTORY:
        _HISTORY.pop(0)


# ── POST /website/analyze ─────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=WebsiteAnalysisResult,
    summary="Analyze a URL for phishing / fake website indicators",
)
async def analyze_url(request: WebsiteAnalyzeRequest) -> WebsiteAnalysisResult:
    """
    Run the full AI + rule-based analysis pipeline on a submitted URL.

    - Normalizes the URL
    - Extracts URL-level features
    - Checks SSL certificate validity
    - Performs WHOIS lookup (domain age, registrar)
    - Resolves DNS records
    - Fetches and parses the HTML page
    - Runs ML risk scoring
    - Returns structured report with threats, recommendations and confidence
    """
    try:
        result = await run_in_threadpool(
            analyze_website,
            request.url,
            request.check_ssl,
            request.check_whois,
            request.check_dns,
            request.check_html,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(exc)}",
        )

    _save_to_history(result)
    return result


# ── POST /website/batch ────────────────────────────────────────────────────────

@router.post(
    "/batch",
    response_model=BatchAnalysisResult,
    summary="Batch-analyze multiple URLs",
)
async def analyze_batch(request: BatchAnalyzeRequest) -> BatchAnalysisResult:
    """
    Analyze up to 20 URLs concurrently.
    Returns individual results plus a summary breakdown.
    """
    if len(request.urls) > 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Maximum 20 URLs per batch request.",
        )

    async def _analyze_one(url: str) -> WebsiteAnalysisResult:
        return await run_in_threadpool(
            analyze_website, url,
            # Disable slow checks for batch to keep latency reasonable
            False, False, True, False,
        )

    results = await asyncio.gather(*[_analyze_one(u) for u in request.urls])

    # Save to history
    for r in results:
        _save_to_history(r)

    # Summary
    prediction_counts: Dict[str, int] = {}
    for r in results:
        prediction_counts[r.prediction] = prediction_counts.get(r.prediction, 0) + 1

    return BatchAnalysisResult(
        total=len(results),
        results=list(results),
        summary={
            "predictions": prediction_counts,
            "avg_risk_score": round(
                sum(r.risk_score for r in results) / len(results), 4
            ) if results else 0,
        },
    )


# ── POST /website/screenshot ───────────────────────────────────────────────────

@router.post(
    "/screenshot",
    response_model=WebsiteAnalysisResult,
    summary="Extract URL from screenshot and analyze",
)
async def analyze_screenshot(request: ScreenshotAnalyzeRequest) -> WebsiteAnalysisResult:
    """
    Accepts a base64-encoded screenshot image.
    Attempts OCR to extract any URL visible in the image, then runs
    the standard website analysis pipeline on that URL.

    Requires Pillow and EasyOCR (or Tesseract) to be installed.
    Falls back to a generic phishing-site analysis if no URL is found.
    """
    # Decode image
    try:
        image_bytes = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid base64 image data.",
        )

    extracted_url: str | None = None

    # ── OCR → URL extraction ──────────────────────────────────────────────────
    try:
        from PIL import Image  # type: ignore
        import re

        image = Image.open(io.BytesIO(image_bytes))

        # Try EasyOCR first
        try:
            import easyocr  # type: ignore
            reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            ocr_results = reader.readtext(image_bytes, detail=0)
            all_text = " ".join(ocr_results)
        except ImportError:
            # Fallback: pytesseract
            import pytesseract  # type: ignore
            all_text = pytesseract.image_to_string(image)

        # Extract URL from OCR text
        url_pattern = re.compile(
            r"https?://[^\s\"'<>]+"
            r"|(?:www\.)[^\s\"'<>]+",
            re.IGNORECASE,
        )
        found = url_pattern.findall(all_text)
        if found:
            extracted_url = found[0].strip()
            if not extracted_url.startswith("http"):
                extracted_url = "https://" + extracted_url
    except Exception:
        pass

    if not extracted_url:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Could not extract a URL from the screenshot. "
                "Please submit the URL directly using POST /website/analyze."
            ),
        )

    result = await run_in_threadpool(
        analyze_website, extracted_url, True, True, True, True
    )
    _save_to_history(result)
    return result


# ── GET /website/history ───────────────────────────────────────────────────────

@router.get(
    "/history",
    response_model=AnalysisHistoryResponse,
    summary="Retrieve analysis history",
)
async def get_history(limit: int = 50, offset: int = 0) -> AnalysisHistoryResponse:
    """Return a paginated list of past website analyses."""
    sliced = list(reversed(_HISTORY))[offset: offset + limit]
    items = [AnalysisHistoryItem(**item) for item in sliced]
    return AnalysisHistoryResponse(total=len(_HISTORY), items=items)


# ── GET /website/report/{id} ────────────────────────────────────────────────────

@router.get(
    "/report/{analysis_id}",
    response_model=AnalysisHistoryItem,
    summary="Retrieve a specific analysis report summary",
)
async def get_report(analysis_id: str) -> AnalysisHistoryItem:
    """Return the history record matching the given analysis ID."""
    for item in reversed(_HISTORY):
        if item["analysis_id"] == analysis_id:
            return AnalysisHistoryItem(**item)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Report {analysis_id} not found.",
    )


# ── DELETE /website/{id} ───────────────────────────────────────────────────────

@router.delete(
    "/{analysis_id}",
    summary="Delete an analysis record",
)
async def delete_analysis(analysis_id: str) -> Dict[str, str]:
    """Remove an analysis record from the history store."""
    global _HISTORY
    before = len(_HISTORY)
    _HISTORY = [h for h in _HISTORY if h["analysis_id"] != analysis_id]
    if len(_HISTORY) == before:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis {analysis_id} not found.",
        )
    return {"status": "deleted", "analysis_id": analysis_id}
