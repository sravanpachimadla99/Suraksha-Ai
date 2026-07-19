from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from .schemas import UserRegister, UserLogin, TokenResponse, ActivityResponse
from . import services

router = APIRouter(prefix="/auth", tags=["Authentication & User"])

def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token")
    token = authorization.split(" ")[1]
    user = services.get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user

@router.post("/register", response_model=TokenResponse, summary="Register a new citizen")
async def register(request: UserRegister):
    try:
        return services.register_user(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse, summary="Login")
async def login(request: UserLogin):
    try:
        return services.login_user(request)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", summary="Get current user details")
async def get_me(user: dict = Depends(get_current_user)):
    # Return user details excluding password
    return {"id": user["id"], "name": user["name"], "email": user["email"]}

@router.get("/activity", response_model=ActivityResponse, summary="Get user activity history")
async def get_activity(user: dict = Depends(get_current_user)):
    activities = services.get_user_activity(user["email"])
    return {"activities": activities}
