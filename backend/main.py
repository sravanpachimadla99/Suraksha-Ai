# ─────────────────────────────────────────────────────────────────────────────
# backend/main.py
# CyberShield AI — FastAPI application entry point
# ─────────────────────────────────────────────────────────────────────────────
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from typing import List

app = FastAPI(
    title="CyberShield AI API",
    description=(
        "Production-ready AI-powered Digital Public Safety Intelligence Platform. "
        "Detects phishing, scam calls, fake websites, counterfeit currency, QR fraud, and more."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # Restrict to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Real-time WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ── System endpoints ───────────────────────────────────────────────────────────

@app.get("/", tags=["System"])
def read_root():
    return {
        "status": "ok",
        "message": "CyberShield AI API is running",
        "version": "1.0.0",
        "docs": "/api/docs",
    }


@app.get("/health", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "modules": [
            "scam_detection",
            "currency_detection",
            "intelligence",
            "phishing_detection",
            "website_detection",
            "fraud_reporting",
        ],
    }


# ── Feature routers ────────────────────────────────────────────────────────────
from api.routes import router as api_router
from api.website_detection.routes import router as website_router
from api.currency_detection.routes import router as currency_router
from api.qr_detection.routes import router as qr_router
from api.intelligence.routes import router as graph_router
from api.geo.routes import router as geo_router
from api.assistant.routes import router as assistant_router
from api.reporting.routes import router as reporting_router
from api.intel_platform.routes import router as intel_router
from api.prediction.routes import router as prediction_router
from api.demo.routes import router as demo_router
from api.auth.routes import router as auth_router

app.include_router(api_router,      prefix="/api/v1")
app.include_router(website_router,  prefix="/api/v1")
app.include_router(currency_router, prefix="/api/v1")
app.include_router(qr_router,       prefix="/api/v1")
app.include_router(graph_router,    prefix="/api/v1")
app.include_router(geo_router,      prefix="/api/v1")
app.include_router(assistant_router,prefix="/api/v1")
app.include_router(reporting_router,prefix="/api/v1")
app.include_router(intel_router,    prefix="/api/v1")
app.include_router(prediction_router,prefix="/api/v1")
app.include_router(demo_router,      prefix="/api/v1")
app.include_router(auth_router,      prefix="/api/v1")

