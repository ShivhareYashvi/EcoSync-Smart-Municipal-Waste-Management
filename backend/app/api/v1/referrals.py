from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.referral import ReferralCodeResponse, ReferralSummaryRead
from app.services.referral_service import referral_service

router = APIRouter(prefix="/referrals", tags=["referrals"])


@router.post("", response_model=ReferralCodeResponse)
@router.get("/code", response_model=ReferralCodeResponse)
def get_or_create_referral_code(
    current_user: User = Depends(get_current_user),
) -> ReferralCodeResponse:
    """Generate or retrieve the citizen's unique referral code and share link."""
    return referral_service.get_code_and_link(current_user.id)


@router.get("/me", response_model=ReferralSummaryRead)
def get_my_referrals(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> ReferralSummaryRead:
    """View referral conversion status, earned points, and invited resident list."""
    return referral_service.get_referral_summary(session, current_user.id)
