"""Digital recycling receipts API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.recycling_transaction import ReceiptRead
from app.services.recycling_transaction_service import recycling_transaction_service

router = APIRouter(prefix="/recycling-receipts", tags=["recycling-receipts"])


@router.get("/me", response_model=list[ReceiptRead])
def get_my_receipts(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ReceiptRead]:
    """Retrieve digital recycling receipts issued to the authenticated citizen."""
    return recycling_transaction_service.list_receipts_for_citizen(session, current_user.id)


@router.get("/{user_id}", response_model=list[ReceiptRead])
def get_user_receipts(
    user_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ReceiptRead]:
    """Retrieve digital recycling receipts for a specific user ID (self or admin)."""
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to view receipts for this user")
    return recycling_transaction_service.list_receipts_for_citizen(session, user_id)
