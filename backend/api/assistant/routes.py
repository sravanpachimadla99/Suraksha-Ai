from fastapi import APIRouter
from .schemas import ChatRequest, MessageResponse, UploadRequest
from . import services

router = APIRouter(prefix="/assistant", tags=["Citizen AI Assistant"])

@router.post("/chat", response_model=MessageResponse, summary="Send message to AI assistant")
async def chat(request: ChatRequest):
    return services.process_chat(request.message, request.session_id)

@router.post("/upload", response_model=MessageResponse, summary="Process uploaded file")
async def upload(request: UploadRequest):
    return services.process_chat(f"Uploaded file: {request.file_name}", request.session_id)

@router.post("/voice", response_model=MessageResponse, summary="Process voice snippet")
async def voice(request: UploadRequest):
    # In reality, this would use whisper or similar for STT
    return services.process_chat(f"Voice snippet received.", request.session_id)

@router.get("/history", summary="Get chat history")
async def get_history(session_id: str):
    return {"session_id": session_id, "messages": []}

@router.get("/session/{id}", summary="Get session details")
async def get_session(id: str):
    return {"id": id, "status": "active"}

@router.delete("/session/{id}", summary="Delete session")
async def delete_session(id: str):
    return {"status": "deleted"}

@router.get("/suggestions", summary="Get suggested prompts")
async def get_suggestions():
    return {
        "suggestions": [
            "How do I report a fake UPI QR code?",
            "Can you check this website for phishing?",
            "What should I do if I shared my OTP?",
            "How to identify counterfeit currency?"
        ]
    }
