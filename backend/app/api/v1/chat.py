from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.services.sms_service import send_twilio_sms

router = APIRouter(prefix="/chat", tags=["chat"])

class ChatMessageRequest(BaseModel):
    phone: str
    message: str
    user_id: int

@router.post("/send")
def send_chat_message(
    payload: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
):
    """Send an SMS-based chat message using Twilio SMS."""
    if current_user.role != UserRole.ADMIN and current_user.id != payload.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only send messages under your own user identity",
        )
    
    target_user = session.get(User, payload.user_id)
    if not target_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    try:
        send_twilio_sms(payload.phone, f"EcoSync Message from {target_user.name}:\n{payload.message}")
        return {"status": "success", "message": "Message sent via Twilio successfully."}
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"SMS Gateway Error: {str(e)}")
