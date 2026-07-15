from fastapi import APIRouter
from typing import List
from .schemas import RunPredictionRequest, PredictionResponse, AlertResponse
from . import services

router = APIRouter(prefix="/prediction", tags=["Threat Prediction & Warning Engine"])

@router.post("/run", response_model=PredictionResponse, summary="Trigger a forecast run")
async def run_forecast(req: RunPredictionRequest):
    return services.run_prediction(req.category, req.model_name)

@router.get("/current", response_model=List[PredictionResponse], summary="Get active threat predictions")
async def get_current_predictions():
    return services.get_current_predictions()

@router.get("/history", response_model=List[PredictionResponse], summary="Get historic prediction logs")
async def get_prediction_history():
    return services.PREDICTIONS_DB

@router.get("/alerts", response_model=List[AlertResponse], summary="Get early warning alerts")
async def get_alerts():
    return services.get_alerts()

@router.get("/regions", summary="Get affected risk regions")
async def get_risk_regions():
    return {"high_risk_districts": ["Mewat", "Jamtara", "NCR Delhi"]}

@router.get("/models", summary="Get configured forecast model frameworks")
async def get_models():
    return services.get_models()
