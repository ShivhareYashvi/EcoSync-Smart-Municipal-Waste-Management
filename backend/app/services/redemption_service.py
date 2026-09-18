"""Redemption service — atomic point spend against the closed-loop catalog."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.redemption import Redemption
from app.models.redemption_catalog import RedemptionCatalog
from app.models.user_tier import UserTierRecord
from app.schemas.redemption import RedemptionCatalogRead, RedemptionRead


class RedemptionService:
    """List catalog items and process atomic point redemptions."""

    def list_catalog(self, session: Session) -> list[RedemptionCatalogRead]:
        """Return all active catalog items."""
        items = session.scalars(
            select(RedemptionCatalog).where(RedemptionCatalog.active.is_(True)).order_by(RedemptionCatalog.points_cost)
        ).all()
        return [RedemptionCatalogRead.model_validate(item) for item in items]

    def redeem(self, session: Session, user_id: int, catalog_item_id: int) -> RedemptionRead:
        """Atomically deduct points and create a redemption record.

        Raises 404 if the catalog item doesn't exist or is inactive.
        Raises 400 if the user's points_balance is insufficient.
        """
        item = session.scalar(
            select(RedemptionCatalog).where(
                RedemptionCatalog.id == catalog_item_id,
                RedemptionCatalog.active.is_(True),
            )
        )
        if item is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Catalog item not found or inactive",
            )

        tier = session.scalar(select(UserTierRecord).where(UserTierRecord.user_id == user_id))
        if tier is None or tier.points_balance < item.points_cost:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient points. Required: {item.points_cost}, Available: {tier.points_balance if tier else 0}",
            )

        # Atomic deduction — within the same transaction
        tier.points_balance -= item.points_cost
        redemption = Redemption(
            user_id=user_id,
            catalog_item_id=catalog_item_id,
            points_spent=item.points_cost,
        )
        session.add(redemption)
        session.commit()
        session.refresh(redemption)
        return RedemptionRead.model_validate(redemption)


redemption_service = RedemptionService()
