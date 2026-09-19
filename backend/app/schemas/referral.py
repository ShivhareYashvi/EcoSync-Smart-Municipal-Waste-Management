from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import ReferralStatus


class ReferralCodeResponse(BaseModel):
    """Generated referral code and share link for a citizen."""

    referral_code: str
    referral_link: str
    bonus_points: int = 100


class ReferralItemRead(BaseModel):
    """Itemized referral record showing invited user and conversion status."""

    id: int
    referred_user_id: int
    referred_user_name: Optional[str] = None
    status: ReferralStatus
    points_awarded: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ReferralSummaryRead(BaseModel):
    """Complete summary of a citizen's referral earnings and conversions."""

    referral_code: str
    referral_link: str
    bonus_points_per_referral: int = 100
    total_referrals: int
    completed_referrals: int
    pending_referrals: int
    total_points_earned: int
    referrals: list[ReferralItemRead]
