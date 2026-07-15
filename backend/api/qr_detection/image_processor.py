# ─────────────────────────────────────────────────────────────────────────────
# backend/api/qr_detection/image_processor.py
# ─────────────────────────────────────────────────────────────────────────────
import base64
import cv2
import numpy as np
from typing import Optional, Tuple, List
from pyzbar.pyzbar import decode

def decode_image(image_base64: str) -> Tuple[Optional[np.ndarray], bytes]:
    """Decodes a base64 string into a numpy array (OpenCV image)."""
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        
        raw_bytes = base64.b64decode(image_base64)
        np_arr = np.frombuffer(raw_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img, raw_bytes
    except Exception as e:
        print(f"Error decoding image: {e}")
        return None, b""

def enhance_for_qr(img: np.ndarray) -> np.ndarray:
    """Enhance the image for better QR detection."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Adaptive thresholding to handle uneven lighting
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 11, 2
    )
    return thresh

def decode_qr(img: np.ndarray) -> List[str]:
    """Detect and decode QR codes from an image."""
    decoded_objects = decode(img)
    results = []
    
    for obj in decoded_objects:
        try:
            data = obj.data.decode("utf-8")
            results.append(data)
        except UnicodeDecodeError:
            pass
            
    # Fallback to OpenCV's detector if pyzbar fails or misses
    if not results:
        detector = cv2.QRCodeDetector()
        data, bbox, _ = detector.detectAndDecode(img)
        if data:
            results.append(data)
            
    return results
