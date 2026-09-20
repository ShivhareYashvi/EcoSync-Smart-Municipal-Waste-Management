"""Points balance, tier, and transaction history endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.points_transaction import PointsTransaction
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.schemas.points import PointsTransactionRead, UserTierRead

router = APIRouter(tags=["points"])

_RECENT_TX_LIMIT = 20


@router.get("/users/{user_id}/points", response_model=UserTierRead)
def get_user_points(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> UserTierRead:
    """Return the citizen's tier info and 20 most recent point transactions.

    Returns 404 if the user has no tier record yet (no pickups logged).
    """
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view points for this user",
        )

    tier = session.scalar(select(UserTierRecord).where(UserTierRecord.user_id == user_id))
    if tier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No points record found. Complete a logged pickup first.",
        )


    recent_txs = session.scalars(
        select(PointsTransaction)
        .where(PointsTransaction.user_id == user_id)
        .order_by(desc(PointsTransaction.created_at))
        .limit(_RECENT_TX_LIMIT)
    ).all()

    return UserTierRead(
        user_id=tier.user_id,
        current_tier=tier.current_tier,
        points_balance=tier.points_balance,
        points_lifetime=tier.points_lifetime,
        flags_count=tier.flags_count,
        tier_updated_at=tier.tier_updated_at,
        recent_transactions=[PointsTransactionRead.model_validate(tx) for tx in recent_txs],
    )
