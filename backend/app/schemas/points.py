from datetime import datetime

from pydantic import BaseModel

from app.models.enums import PointsTransactionStatus, UserTier


class PointsTransactionRead(BaseModel):
    """Serialised view of a single points ledger entry."""

    id: int
    user_id: int
    pickup_id: int | None
    points: int
    reason: str
    status: PointsTransactionStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class UserTierRead(BaseModel):
    """Citizen gamification tier and running balance."""

    user_id: int
    current_tier: UserTier
    points_balance: int
    points_lifetime: int
    flags_count: int
    tier_updated_at: datetime
    recent_transactions: list[PointsTransactionRead] = []

    model_config = {"from_attributes": True}
