from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.compliance_score import ComplianceScore
from app.models.enums import SocietyMemberStatus, UserRole
from app.models.leaderboard_opt_in import LeaderboardOptIn
from app.models.society import Society
from app.models.society_membership import SocietyMembership
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.schemas.leaderboard import (
    IndividualLeaderboardEntry,
    LeaderboardSettingsUpdate,
    SocietyLeaderboardEntry,
)
from app.services.society_service import MIN_SOCIETY_MEMBERS_FOR_AGGREGATE


class LeaderboardService:
    """Service managing privacy-first opt-in leaderboards for individuals and societies."""

    def get_or_create_settings(
        self, session: Session, user_id: int
    ) -> LeaderboardOptIn:
        """Fetch or initialize default opted-out settings for a citizen."""
        settings = session.scalar(
            select(LeaderboardOptIn).where(LeaderboardOptIn.user_id == user_id)
        )
        if not settings:
            settings = LeaderboardOptIn(
                user_id=user_id,
                opted_in=False,
                display_handle=None,
                opted_in_at=None,
            )
            session.add(settings)
            session.commit()
            session.refresh(settings)
        return settings

    def update_settings(
        self, session: Session, user_id: int, payload: LeaderboardSettingsUpdate
    ) -> LeaderboardOptIn:
        """Update opt-in status and custom display handle."""
        settings = session.scalar(
            select(LeaderboardOptIn).where(LeaderboardOptIn.user_id == user_id)
        )
        if not settings:
            settings = LeaderboardOptIn(user_id=user_id)
            session.add(settings)

        if payload.opted_in and not settings.opted_in:
            settings.opted_in_at = datetime.now(timezone.utc)
        elif not payload.opted_in:
            settings.opted_in_at = None

        settings.opted_in = payload.opted_in
        settings.display_handle = (
            payload.display_handle.strip() if payload.display_handle else None
        )

        session.commit()
        session.refresh(settings)
        return settings

    def get_individual_leaderboard(
        self,
        session: Session,
        scope: str = "city",
        zone_id: int | None = None,
        society_id: int | None = None,
        limit: int = 50,
    ) -> list[IndividualLeaderboardEntry]:
        """Rank opted-in citizens.

        STRICT PRIVACY GUARANTEE:
        - Only users with `opted_in == True` are included.
        - Users who are opted out or haven't configured opt-in are completely omitted.
        - Anonymized fallback handle `Resident #XXXX` is used if no custom handle was provided.
        """
        query = (
            select(LeaderboardOptIn, User, ComplianceScore, UserTierRecord)
            .join(User, User.id == LeaderboardOptIn.user_id)
            .outerjoin(ComplianceScore, ComplianceScore.user_id == User.id)
            .outerjoin(UserTierRecord, UserTierRecord.user_id == User.id)
            .where(
                LeaderboardOptIn.opted_in.is_(True),
                User.role == UserRole.CITIZEN,
            )
        )

        if scope == "zone" and zone_id is not None:
            query = query.where(User.zone_id == zone_id)
        elif scope == "society" and society_id is not None:
            query = query.join(
                SocietyMembership,
                (SocietyMembership.user_id == User.id)
                & (SocietyMembership.society_id == society_id)
                & (SocietyMembership.status == SocietyMemberStatus.ACTIVE),
            )

        query = query.order_by(
            func.coalesce(UserTierRecord.points_balance, 0).desc(),
            func.coalesce(ComplianceScore.rolling_score, 0.0).desc(),
            User.id.asc(),
        ).limit(limit)

        rows = session.execute(query).all()
        entries: list[IndividualLeaderboardEntry] = []

        for rank, (opt_in, user, compliance, tier) in enumerate(rows, start=1):
            handle = opt_in.display_handle or f"Resident #{user.id:04d}"
            score = round(compliance.rolling_score, 1) if compliance else 0.0
            pickups = compliance.verified_pickups if compliance else 0
            pts = tier.points_balance if tier else 0

            entries.append(
                IndividualLeaderboardEntry(
                    rank=rank,
                    user_id=user.id,
                    display_handle=handle,
                    points=pts,
                    compliance_score=score,
                    verified_pickups=pickups,
                    zone_id=user.zone_id,
                    society_id=society_id,
                )
            )

        return entries

    def get_society_leaderboard(
        self,
        session: Session,
        zone_id: int | None = None,
        limit: int = 50,
    ) -> list[SocietyLeaderboardEntry]:
        """Rank housing societies by average compliance and collective points.

        PRIVACY GUARANTEE:
        - Societies with fewer than `MIN_SOCIETY_MEMBERS_FOR_AGGREGATE` (3) active
          households are completely excluded from the leaderboard to prevent
          deduction of individual household scores.
        """
        query = select(Society)
        if zone_id is not None:
            query = query.where(Society.zone_id == zone_id)

        societies = session.scalars(query).all()
        scored_societies: list[dict] = []

        for society in societies:
            active_members = (
                session.scalar(
                    select(func.count(SocietyMembership.id)).where(
                        SocietyMembership.society_id == society.id,
                        SocietyMembership.status == SocietyMemberStatus.ACTIVE,
                    )
                )
                or 0
            )

            # Suppress societies with small cohort
            if active_members < MIN_SOCIETY_MEMBERS_FOR_AGGREGATE:
                continue

            active_user_ids = select(SocietyMembership.user_id).where(
                SocietyMembership.society_id == society.id,
                SocietyMembership.status == SocietyMemberStatus.ACTIVE,
            )

            avg_comp = (
                session.scalar(
                    select(func.coalesce(func.avg(ComplianceScore.rolling_score), 0.0)).where(
                        ComplianceScore.user_id.in_(active_user_ids)
                    )
                )
                or 0.0
            )

            total_pickups = (
                session.scalar(
                    select(func.coalesce(func.sum(ComplianceScore.verified_pickups), 0)).where(
                        ComplianceScore.user_id.in_(active_user_ids)
                    )
                )
                or 0
            )

            total_points = (
                session.scalar(
                    select(func.coalesce(func.sum(UserTierRecord.points_balance), 0)).where(
                        UserTierRecord.user_id.in_(active_user_ids)
                    )
                )
                or 0
            )

            scored_societies.append({
                "society_id": society.id,
                "society_name": society.name,
                "zone_id": society.zone_id,
                "active_members": active_members,
                "average_compliance": round(float(avg_comp), 1),
                "total_verified_pickups": int(total_pickups),
                "total_points": int(total_points),
            })

        # Sort by average compliance descending, then total points descending
        scored_societies.sort(
            key=lambda s: (s["average_compliance"], s["total_points"]),
            reverse=True,
        )

        entries: list[SocietyLeaderboardEntry] = []
        for rank, item in enumerate(scored_societies[:limit], start=1):
            entries.append(
                SocietyLeaderboardEntry(
                    rank=rank,
                    society_id=item["society_id"],
                    society_name=item["society_name"],
                    zone_id=item["zone_id"],
                    active_members=item["active_members"],
                    average_compliance=item["average_compliance"],
                    total_verified_pickups=item["total_verified_pickups"],
                    total_points=item["total_points"],
                )
            )

        return entries


leaderboard_service = LeaderboardService()
