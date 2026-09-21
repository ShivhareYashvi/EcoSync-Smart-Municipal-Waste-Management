"""Compliance score service - rolling 90-day verified-pickup ratio."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.compliance_score import ComplianceScore
from app.models.enums import PickupStatus, PointsTransactionStatus
from app.models.pickup_request import PickupRequest
from app.models.points_transaction import PointsTransaction
from app.schemas.compliance import ComplianceScoreRead

_WINDOW_DAYS = 90


class ComplianceService:
    """Recalculate and persist the 90-day rolling compliance score."""

    def recalculate(self, session: Session, user_id: int) -> ComplianceScoreRead:
        """Compute score and upsert compliance_scores for the given user.

        Formula:
            score = verified_pickups / total_pickups * 100

        Where:
        - total_pickups = completed pickups in the last 90 days
        - verified_pickups = completed pickups where segregation_verified=True
          AND the related points_transaction is NOT flagged
        """
        window_start = datetime.now(timezone.utc) - timedelta(days=_WINDOW_DAYS)

        # All completed pickups for this user in the window
        total = session.scalar(
            select(func.count()).where(
                PickupRequest.user_id == user_id,
                PickupRequest.status == PickupStatus.COMPLETED,
                PickupRequest.created_at >= window_start,
            )
        ) or 0

        # Verified: segregation_verified=True and no flagged transaction
        verified_subq = (
            select(PickupRequest.id)
            .where(
                PickupRequest.user_id == user_id,
                PickupRequest.status == PickupStatus.COMPLETED,
                PickupRequest.segregation_verified.is_(True),
                PickupRequest.created_at >= window_start,
            )
            .scalar_subquery()
        )
        # Exclude pickups whose transaction is flagged
        flagged_pickup_ids = (
            select(PointsTransaction.pickup_id)
            .where(
                PointsTransaction.user_id == user_id,
                PointsTransaction.status == PointsTransactionStatus.FLAGGED,
                PointsTransaction.pickup_id.isnot(None),
            )
            .scalar_subquery()
        )
        verified = session.scalar(
            select(func.count()).where(
                PickupRequest.id.in_(verified_subq),
                PickupRequest.id.notin_(flagged_pickup_ids),
            )
        ) or 0

        rolling_score = round(verified / total * 100, 2) if total > 0 else 0.0
        now = datetime.now(timezone.utc)

        score_row = session.scalar(
            select(ComplianceScore).where(ComplianceScore.user_id == user_id)
        )
        if score_row is None:
            score_row = ComplianceScore(
                user_id=user_id,
                rolling_score=rolling_score,
                total_pickups=total,
                verified_pickups=verified,
                updated_at=now,
            )
            session.add(score_row)
        else:
            score_row.rolling_score = rolling_score
            score_row.total_pickups = total
            score_row.verified_pickups = verified
            score_row.updated_at = now

        session.commit()
        session.refresh(score_row)
        return ComplianceScoreRead.model_validate(score_row)

    def get(self, session: Session, user_id: int) -> ComplianceScoreRead | None:
        """Return the current compliance score row without recalculating."""
        row = session.scalar(select(ComplianceScore).where(ComplianceScore.user_id == user_id))
        return ComplianceScoreRead.model_validate(row) if row else None


compliance_service = ComplianceService()
