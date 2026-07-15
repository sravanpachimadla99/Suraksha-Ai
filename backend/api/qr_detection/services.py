# ─────────────────────────────────────────────────────────────────────────────
# backend/api/qr_detection/services.py
# ─────────────────────────────────────────────────────────────────────────────
import hashlib
import re
import time
from typing import List, Tuple, Optional
from urllib.parse import urlparse, parse_qs

from .schemas import QRAnalysisResult, ThreatIndicator
from .image_processor import decode_image, enhance_for_qr, decode_qr
from api.website_detection.services import analyze_website # type: ignore

def _classify_qr_type(content: str) -> str:
    content_lower = content.lower()
    if content_lower.startswith("upi://pay"):
        return "UPI Payment"
    if content_lower.startswith(("http://", "https://")):
        return "Website URL"
    if content_lower.startswith("wifi:"):
        return "WiFi"
    if content_lower.startswith("smsto:"):
        return "SMS"
    if content_lower.startswith("mailto:"):
        return "Email"
    if content_lower.startswith("tel:"):
        return "Phone Number"
    if content_lower.startswith("geo:"):
        return "Location"
    if content_lower.startswith("begin:vcard"):
        return "Contact Card"
    return "Text"

def _analyze_upi(content: str) -> Tuple[str, float, str, List[ThreatIndicator], Optional[str], Optional[str]]:
    """Analyzes a UPI payload and checks for fraud indicators."""
    threats = []
    
    # Example format: upi://pay?pa=merchant@okbank&pn=Merchant%20Name&am=100
    try:
        parsed_url = urlparse(content)
        query_params = parse_qs(parsed_url.query)
        
        upi_id = query_params.get("pa", [""])[0]
        merchant_name = query_params.get("pn", [""])[0]
    except Exception:
        upi_id = None
        merchant_name = None
        
    if not upi_id:
        threats.append(ThreatIndicator(
            name="Invalid UPI Format",
            severity="high",
            description="The UPI string is missing the 'pa' (payee address) parameter.",
            detected=True
        ))
        
    # Local mock blacklist for demonstration
    suspicious_ids = ["scammer@ybl", "fraudster@upi", "fake_support@sbi"]
    if upi_id and upi_id.lower() in suspicious_ids:
        threats.append(ThreatIndicator(
            name="Blacklisted Payee",
            severity="critical",
            description=f"The UPI ID ({upi_id}) has been reported for fraudulent activity.",
            detected=True
        ))
        
    # Example check for unverified generic handles
    if merchant_name and ("support" in merchant_name.lower() or "refund" in merchant_name.lower()):
        threats.append(ThreatIndicator(
            name="Suspicious Merchant Name",
            severity="medium",
            description="The merchant name contains terms often used in social engineering scams.",
            detected=True
        ))

    if any(t.severity == "critical" for t in threats):
        return "Malicious", 95.0, "Critical", threats, merchant_name, upi_id
    elif any(t.severity == "high" for t in threats):
        return "Suspicious", 75.0, "High", threats, merchant_name, upi_id
    elif any(t.severity == "medium" for t in threats):
        return "Suspicious", 60.0, "Medium", threats, merchant_name, upi_id
        
    return "Safe", 98.0, "Low", threats, merchant_name, upi_id

def analyze_qr_code(image_base64: str, filename: str) -> QRAnalysisResult:
    t0 = time.perf_counter()
    
    cv_img, _ = decode_image(image_base64)
    if cv_img is None:
        raise ValueError("Invalid image format or unable to decode image.")
        
    # Try decoding original image
    decoded_contents = decode_qr(cv_img)
    
    # If not found, try enhanced image
    if not decoded_contents:
        enhanced_img = enhance_for_qr(cv_img)
        decoded_contents = decode_qr(enhanced_img)
        
    if not decoded_contents:
        return QRAnalysisResult(
            analysis_id="QR-" + hashlib.sha1(image_base64[:128].encode()).hexdigest()[:12].upper(),
            qr_type="Unknown",
            decoded_content="",
            prediction="Unreadable",
            confidence=0.0,
            risk_level="Unknown",
            merchant_name=None,
            upi_id=None,
            threats=[],
            recommendation="Could not detect a valid QR code in the image. Please ensure the QR code is clearly visible and well-lit.",
            processing_time_ms=round((time.perf_counter() - t0) * 1000, 2)
        )
        
    # For now, just take the first detected QR code
    content = decoded_contents[0]
    qr_type = _classify_qr_type(content)
    
    prediction = "Safe"
    confidence = 90.0
    risk_level = "Low"
    threats = []
    merchant_name = None
    upi_id = None
    recommendation = "The QR code appears safe."

    if qr_type == "UPI Payment":
        prediction, confidence, risk_level, threats, merchant_name, upi_id = _analyze_upi(content)
        if risk_level == "Critical":
            recommendation = "Do NOT proceed with this payment. The UPI ID is associated with known scams."
        elif risk_level in ["High", "Medium"]:
            recommendation = "Exercise caution. Verify the payee's identity before transferring any funds."
            
    elif qr_type == "Website URL":
        # Integrate with Website Detection module
        try:
            web_result = analyze_website(content)
            prediction = web_result.prediction
            confidence = web_result.confidence
            risk_level = web_result.risk_level
            
            # Map website threats to QR threats
            for t in web_result.threats:
                threats.append(ThreatIndicator(
                    name=t.name,
                    severity=t.severity,
                    description=t.description,
                    detected=t.detected
                ))
                
            if risk_level == "Critical":
                recommendation = "Do NOT visit this link. It has been flagged as a phishing or malicious website."
            elif risk_level in ["High", "Medium"]:
                recommendation = "The destination link looks suspicious. Proceed with caution."
                
        except Exception as e:
            print(f"Error analyzing URL via website module: {e}")
            threats.append(ThreatIndicator(
                name="URL Analysis Failed",
                severity="medium",
                description="Unable to reach the Website Analysis engine to verify the URL.",
                detected=True
            ))
            prediction = "Suspicious"
            risk_level = "Medium"
            recommendation = "Proceed with caution, URL safety could not be fully verified."

    analysis_id = "QR-" + hashlib.sha1(content.encode()).hexdigest()[:12].upper()
    
    return QRAnalysisResult(
        analysis_id=analysis_id,
        qr_type=qr_type,
        decoded_content=content,
        prediction=prediction,
        confidence=confidence,
        risk_level=risk_level,
        merchant_name=merchant_name,
        upi_id=upi_id,
        threats=threats,
        recommendation=recommendation,
        processing_time_ms=round((time.perf_counter() - t0) * 1000, 2)
    )
