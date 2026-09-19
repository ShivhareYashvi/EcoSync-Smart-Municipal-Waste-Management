import re
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.enums import PointsTransactionStatus, ReferralStatus
from app.models.pickup_request import PickupRequest
from app.models.points_transaction import PointsTransaction
from app.models.referral import Referral
from app.models.user import User
from app.schemas.referral import (
    ReferralCodeResponse,
    ReferralItemRead,
    ReferralSummaryRead,
)
from app.services.points_engine import points_service

REFERRAL_BONUS_POINTS = 100


class ReferralService:
    """Service managing referral code generation, pending attribution, and verified bonus awarding."""

    def generate_referral_code(self, user_id: int) -> str:
        """Create a deterministic, easily shareable referral code for a user."""
        return f"REF-{user_id:04d}"

    def parse_referral_code(self, session: Session, code: str) -> Optional[int]:
        """Validate and resolve a referral code to a referrer user ID."""
        if not code:
            return None
        match = re.match(r"^REF-(\d+)$", code.strip(), re.IGNORECASE)
        if not match:
            return None
        try:
            referrer_id = int(match.group(1))
        except ValueError:
            return None

        referrer = session.scalar(select(User).where(User.id == referrer_id))
        return referrer.id if referrer else None

    def get_code_and_link(self, user_id: int) -> ReferralCodeResponse:
        """Get referral code and shareable registration URL."""
        code = self.generate_referral_code(user_id)
        link = f"http://localhost:5173/register?ref={code}"
        return ReferralCodeResponse(
            referral_code=code,
            referral_link=link,
            bonus_points=REFERRAL_BONUS_POINTS,
        )

    def process_referral_on_registration(
        self, session: Session, referred_user_id: int, referral_code: str
    ) -> Optional[Referral]:
        """Link a new citizen to their referrer with status=pending.

        CRITICAL ANTI-FARMING RULE:
        - Points are NEVER awarded upon registration alone.
        - The record remains pending until their first verified pickup.
        """
        referrer_id = self.parse_referral_code(session, referral_code)
        if not referrer_id or referrer_id == referred_user_id:
            return None

        # Check if already linked
        existing = session.scalar(
            select(Referral).where(Referral.referred_user_id == referred_user_id)
        )
        if existing:
            return existing

        referral = Referral(
            referrer_id=referrer_id,
            referred_user_id=referred_user_id,
            referral_code=referral_code.strip(),
            status=ReferralStatus.PENDING,
            points_awarded=False,
        )
        session.add(referral)
        session.flush()
        return referral

    def check_and_award_referral_bonus(
        self, session: Session, pickup_id: int
    ) -> bool:
        """Check if pickup completes a pending referral and award 100 bonus points to referrer.

        Must be called on verified completed pickups.
        """
        pickup = session.scalar(
            select(PickupRequest).where(PickupRequest.id == pickup_id)
        )
        if not pickup or not pickup.segregation_verified:
            return False

        # Look up pending referral for this pickup's citizen
        referral = session.scalar(
            select(Referral).where(
                Referral.referred_user_id == pickup.user_id,
                Referral.status == ReferralStatus.PENDING,
                Referral.points_awarded.is_(False),
            )
        )
        if not referral:
            return False

        # Award flat 100 points to the referrer
        tx = PointsTransaction(
            user_id=referral.referrer_id,
            pickup_id=None,
            points=REFERRAL_BONUS_POINTS,
            reason=f"Referral bonus for inviting resident #{pickup.user_id:04d}",
            status=PointsTransactionStatus.APPROVED,
            created_at=datetime.now(timezone.utc),
        )
        session.add(tx)
        session.flush()

        # Update referrer's tier balance
        points_service._update_tier(
            session, referral.referrer_id, delta=REFERRAL_BONUS_POINTS
        )

        # Transition referral to completed
        referral.status = ReferralStatus.COMPLETED
        referral.points_awarded = True
        session.commit()
        return True

    def get_referral_summary(
        self, session: Session, user_id: int
    ) -> ReferralSummaryRead:
        """Fetch all referrals initiated by the user and current earnings summary."""
        code = self.generate_referral_code(user_id)
        link = f"http://localhost:5173/register?ref={code}"

        referrals = session.scalars(
            select(Referral)
            .options(joinedload(Referral.referred_user))
            .where(Referral.referrer_id == user_id)
            .order_by(Referral.created_at.desc())
        ).all()

        items: list[ReferralItemRead] = []
        completed_count = 0
        pending_count = 0

        for r in referrals:
            if r.status == ReferralStatus.COMPLETED:
                completed_count += 1
            else:
                pending_count += 1

            items.append(
                ReferralItemRead(
                    id=r.id,
                    referred_user_id=r.referred_user_id,
                    referred_user_name=r.referred_user.name if r.referred_user else None,
                    status=r.status,
                    points_awarded=r.points_awarded,
                    created_at=r.created_at,
                )
            )

        return ReferralSummaryRead(
            referral_code=code,
            referral_link=link,
            bonus_points_per_referral=REFERRAL_BONUS_POINTS,
            total_referrals=len(items),
            completed_referrals=completed_count,
            pending_referrals=pending_count,
            total_points_earned=completed_count * REFERRAL_BONUS_POINTS,
            referrals=items,
        )


referral_service = ReferralService()
