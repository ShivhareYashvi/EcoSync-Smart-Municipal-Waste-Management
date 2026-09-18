"""EPR Credit ledger and internal administrative claim simulation API."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.epr_credit import BrandAccountCreate, BrandAccountRead, EPRClaimRequest, EPRCreditRead
from app.services.epr_credit_service import epr_credit_service

router = APIRouter(tags=["epr-credits"])


def _require_admin(user: User) -> None:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")


@router.get("/epr-credits/available", response_model=list[EPRCreditRead])
def get_available_epr_credits(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EPRCreditRead]:
    """Admin-only view of the available (unclaimed) EPR credit pool."""
    _require_admin(current_user)
    return epr_credit_service.get_available_credits(session)


@router.get("/epr-credits", response_model=list[EPRCreditRead])
def list_all_epr_credits(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[EPRCreditRead]:
    """Admin-only view of all EPR credits (available and claimed)."""
    _require_admin(current_user)
    return epr_credit_service.list_all_credits(session)


@router.post("/epr-credits/{credit_id}/claim", response_model=EPRCreditRead)
def claim_epr_credit(
    credit_id: int,
    payload: EPRClaimRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> EPRCreditRead:
    """Admin-only simulated action assigning an EPR credit to a brand account (marks claimed)."""
    _require_admin(current_user)
    return epr_credit_service.claim_credit(session, credit_id, payload.brand_id)


@router.get("/brands", response_model=list[BrandAccountRead])
def list_brands(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[BrandAccountRead]:
    """List registered brand accounts available for EPR credit claiming."""
    return epr_credit_service.list_brands(session)


@router.post("/brands", response_model=BrandAccountRead, status_code=status.HTTP_201_CREATED)
def create_brand(
    payload: BrandAccountCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BrandAccountRead:
    """Admin registers a new brand account."""
    _require_admin(current_user)
    return epr_credit_service.create_brand(session, payload)
