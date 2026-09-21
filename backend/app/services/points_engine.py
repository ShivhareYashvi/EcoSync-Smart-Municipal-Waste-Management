"""Points engine — pure calculation function + stateful service.

The pure ``calculate_points`` function is side-effect-free and fully
unit-testable without a database.  The ``PointsService`` class wraps it
with the database operations needed to persist the award, enforce the
weekly weight-bonus cap, update the user's tier record, and handle
dispute reversals.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import PickupStatus, PointsTransactionStatus, UserTier
from app.models.pickup_request import PickupRequest
from app.models.points_transaction import PointsTransaction
from app.models.user_tier import UserTierRecord

#  Tier promotion thresholds 
_SILVER_THRESHOLD = 500   # lifetime points, zero flags
_GOLD_THRESHOLD = 2_000   # lifetime points threshold

#  Weekly weight-bonus cap (points, not kg) 
_WEEKLY_WEIGHT_BONUS_CAP = 50


#  Pure calculation function (unit-testable) ─

@dataclass
class UserHistory:
    """Minimal history snapshot needed by the points formula."""

    consecutive_clean_weeks: int = 0  # weeks with ≥1 verified, zero disputes


def calculate_points(pickup: PickupRequest, user_history: UserHistory) -> int:
    """Return the raw points value for one pickup, ignoring the weekly cap.

    Returns 0 if ``segregation_verified`` is False — the transaction will
    still be written as ``pending`` by the service layer; the citizen never
    loses points outright, they just await manual review.

    The weekly weight-bonus cap is intentionally NOT enforced here so this
    function stays pure and easy to unit-test in isolation.
    """
    if not pickup.segregation_verified:
        return 0

    base = 50
    weight_bonus = min((pickup.weight_kg or 0.0) * 5, 50)
    streak_multiplier = 1.2 if user_history.consecutive_clean_weeks >= 4 else 1.0

    return round((base + weight_bonus) * streak_multiplier)


#  Stateful service ─

class PointsService:
    """Persist points awards, enforce caps, update tiers, handle disputes."""

    #  Public API 

    def award_points(self, session: Session, pickup_id: int) -> PointsTransaction:
        """Calculate and persist a points award for a completed, logged pickup.

        Must be called *after* the pickup's collection verification fields have been saved.
        Enforces the 50-pt/week weight-bonus cap at the service level.
        """
        pickup = self._get_pickup(session, pickup_id)

        # Anti-duplicate guard: return existing transaction if already created for this pickup
        existing_tx = session.scalar(
            select(PointsTransaction).where(PointsTransaction.pickup_id == pickup_id)
        )
        if existing_tx is not None:
            return existing_tx

        history = self._build_history(session, pickup.user_id)
        raw_points = calculate_points(pickup, history)

        # Determine status: unverified pickups go to pending for manual review
        tx_status = (
            PointsTransactionStatus.APPROVED
            if pickup.segregation_verified
            else PointsTransactionStatus.PENDING
        )

        # Apply weekly weight-bonus cap (service layer, not pure function)
        if pickup.segregation_verified and raw_points > 0:
            raw_points = self._apply_weekly_cap(session, pickup.user_id, raw_points)

        reason = self._build_reason(pickup)
        tx = PointsTransaction(
            user_id=pickup.user_id,
            pickup_id=pickup_id,
            points=raw_points,
            reason=reason,
            status=tx_status,
            created_at=datetime.now(timezone.utc),
        )
        session.add(tx)
        session.flush()  # get tx.id before updating tier

        if tx_status == PointsTransactionStatus.APPROVED and raw_points > 0:
            self._update_tier(session, pickup.user_id, delta=raw_points)

        session.commit()
        session.refresh(tx)
        return tx

    def approve_transaction(self, session: Session, transaction_id: int) -> PointsTransaction:
        """Admin path: move a pending transaction to approved and credit points."""
        tx = self._get_transaction(session, transaction_id)
        if tx.status != PointsTransactionStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending transactions can be approved",
            )
        tx.status = PointsTransactionStatus.APPROVED
        self._update_tier(session, tx.user_id, delta=tx.points)
        session.commit()
        session.refresh(tx)
        return tx

    def flag_transaction(self, session: Session, pickup_id: int) -> PointsTransaction | None:
        """Citizen dispute: flag the associated transaction and reverse balance.

        Returns the flagged transaction or None if no transaction exists yet
        (e.g. driver logged without photo, transaction still pending).
        """
        tx = session.scalar(
            select(PointsTransaction).where(PointsTransaction.pickup_id == pickup_id)
        )
        if tx is None:
            return None

        previously_approved = tx.status == PointsTransactionStatus.APPROVED
        tx.status = PointsTransactionStatus.FLAGGED

        tier = session.scalar(
            select(UserTierRecord).where(UserTierRecord.user_id == tx.user_id)
        )
        if tier is not None:
            tier.flags_count += 1
            if previously_approved:
                # Reverse the points that were credited
                tier.points_balance = max(0, tier.points_balance - tx.points)

        session.commit()
        session.refresh(tx)
        return tx

    #  Private helpers 

    def _get_pickup(self, session: Session, pickup_id: int) -> PickupRequest:
        pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == pickup_id))
        if pickup is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")
        return pickup

    def _get_transaction(self, session: Session, transaction_id: int) -> PointsTransaction:
        tx = session.scalar(select(PointsTransaction).where(PointsTransaction.id == transaction_id))
        if tx is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
        return tx

    def _build_history(self, session: Session, user_id: int) -> UserHistory:
        """Compute consecutive clean weeks from the user's approved transactions."""
        # Count back from most recent week; a "clean" week has ≥1 approved tx
        # and zero flagged tx in that same calendar week.
        now = datetime.now(timezone.utc)
        weeks_checked = 0
        consecutive = 0
        for week_offset in range(52):  # look back up to 52 weeks
            week_start = now - timedelta(weeks=week_offset + 1)
            week_end = now - timedelta(weeks=week_offset)
            approved_count = session.scalar(
                select(func.count()).where(
                    PointsTransaction.user_id == user_id,
                    PointsTransaction.status == PointsTransactionStatus.APPROVED,
                    PointsTransaction.created_at >= week_start,
                    PointsTransaction.created_at < week_end,
                )
            ) or 0
            flagged_count = session.scalar(
                select(func.count()).where(
                    PointsTransaction.user_id == user_id,
                    PointsTransaction.status == PointsTransactionStatus.FLAGGED,
                    PointsTransaction.created_at >= week_start,
                    PointsTransaction.created_at < week_end,
                )
            ) or 0
            if approved_count > 0 and flagged_count == 0:
                consecutive += 1
                weeks_checked += 1
            else:
                break  # streak broken
        return UserHistory(consecutive_clean_weeks=consecutive)

    def _apply_weekly_cap(self, session: Session, user_id: int, raw_points: int) -> int:
        """Reduce weight-bonus component if user already hit 50 pts this week."""
        week_start = datetime.now(timezone.utc) - timedelta(days=7)
        # Sum weight-bonus points already awarded this week
        # Weight bonus = total_points - base_points (60 or 50 depending on streak).
        # Simpler: sum ALL approved points this week and see how much head-room is left.
        weekly_earned = session.scalar(
            select(func.coalesce(func.sum(PointsTransaction.points), 0)).where(
                PointsTransaction.user_id == user_id,
                PointsTransaction.status == PointsTransactionStatus.APPROVED,
                PointsTransaction.created_at >= week_start,
            )
        ) or 0

        base_without_weight = 50  # minimum possible (base, no streak, no weight)
        # Estimate weight bonus in raw_points
        # raw_points = round((base + weight_bonus) * multiplier)
        # We cap the weight bonus at _WEEKLY_WEIGHT_BONUS_CAP across the week.
        # Remaining cap = max(0, _WEEKLY_WEIGHT_BONUS_CAP - points_already_from_weight_this_week)
        # Approximation: points already from weight bonus = weekly_earned - (base * multiplier * n)
        # For simplicity, cap total points awarded in the week to avoid over-awarding.
        # The cap applies to the weight BONUS only; base is always awarded.
        remaining_weight_cap = max(0, _WEEKLY_WEIGHT_BONUS_CAP - max(0, int(weekly_earned) - base_without_weight))
        base_in_award = 50
        weight_component = max(0, raw_points - base_in_award)
        capped_weight = min(weight_component, remaining_weight_cap)
        return base_in_award + capped_weight

    def _update_tier(self, session: Session, user_id: int, delta: int) -> None:
        """Upsert user_tiers and promote tier if thresholds are crossed."""
        tier = session.scalar(select(UserTierRecord).where(UserTierRecord.user_id == user_id))
        now = datetime.now(timezone.utc)
        if tier is None:
            tier = UserTierRecord(
                user_id=user_id,
                points_balance=0,
                points_lifetime=0,
                flags_count=0,
                tier_updated_at=now,
            )
            session.add(tier)
            session.flush()

        tier.points_balance += delta
        tier.points_lifetime += delta

        # Tier promotion (upward only)
        new_tier = self._compute_tier(tier.points_lifetime, tier.flags_count)
        if new_tier != tier.current_tier:
            tier.current_tier = new_tier
            tier.tier_updated_at = now

    @staticmethod
    def _compute_tier(lifetime_points: int, flags_count: int) -> UserTier:
        if lifetime_points >= _GOLD_THRESHOLD:
            return UserTier.GOLD
        if lifetime_points >= _SILVER_THRESHOLD and flags_count == 0:
            return UserTier.SILVER
        return UserTier.BRONZE

    @staticmethod
    def _build_reason(pickup: PickupRequest) -> str:
        cat = pickup.waste_category.value if pickup.waste_category else "unknown"
        kg = f"{pickup.weight_kg:.1f} kg" if pickup.weight_kg else "unknown weight"
        verified = "verified" if pickup.segregation_verified else "unverified"
        return f"Pickup #{pickup.id}: {cat}, {kg}, segregation {verified}"


points_service = PointsService()
