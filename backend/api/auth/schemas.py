from pydantic import BaseModel, EmailStr
from typing import List, Optional

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_name: str

class ActivityItem(BaseModel):
    id: str
    type: str
    description: str
    date: str
    status: str

class ActivityResponse(BaseModel):
    activities: List[ActivityItem]
