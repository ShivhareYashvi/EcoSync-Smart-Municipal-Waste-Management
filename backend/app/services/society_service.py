from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.compliance_score import ComplianceScore
from app.models.enums import SocietyMemberRole, SocietyMemberStatus, UserRole
from app.models.society import Society
from app.models.society_membership import SocietyMembership
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.models.zone import Zone
from app.schemas.society import SocietyCreate, SocietyDashboardRead, SocietyMembershipRead

MIN_SOCIETY_MEMBERS_FOR_AGGREGATE = 3


class SocietyService:
    """Service handling housing society registration, memberships, and privacy-guaranteed aggregation."""

    def register_society(
        self, session: Session, user_id: int, payload: SocietyCreate
    ) -> Society:
        """Register a new society and submit a pending RWA Admin membership for the creator."""
        zone = session.scalar(select(Zone).where(Zone.id == payload.zone_id))
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Zone {payload.zone_id} not found.",
            )

        society = Society(
            name=payload.name.strip(),
            address=payload.address.strip(),
            zone_id=payload.zone_id,
        )
        session.add(society)
        session.flush()

        # Creator becomes pending RWA Admin
        membership = SocietyMembership(
            user_id=user_id,
            society_id=society.id,
            role=SocietyMemberRole.RWA_ADMIN,
            status=SocietyMemberStatus.PENDING,
            registration_doc_path=payload.registration_doc_path,
        )
        session.add(membership)
        session.commit()
        session.refresh(society)
        return society

    def list_societies(
        self, session: Session, zone_id: int | None = None
    ) -> list[Society]:
        """List societies, optionally filtered by municipal zone."""
        query = select(Society).order_by(Society.name)
        if zone_id is not None:
            query = query.where(Society.zone_id == zone_id)
        return list(session.scalars(query).all())

    def get_society(self, session: Session, society_id: int) -> Society:
        """Retrieve a single society by ID."""
        society = session.scalar(select(Society).where(Society.id == society_id))
        if not society:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Society {society_id} not found.",
            )
        return society

    def join_society(
        self, session: Session, user_id: int, society_id: int
    ) -> SocietyMembership:
        """Join a society as a regular active member."""
        self.get_society(session, society_id)

        existing = session.scalar(
            select(SocietyMembership).where(
                SocietyMembership.user_id == user_id,
                SocietyMembership.society_id == society_id,
            )
        )
        if existing:
            return existing

        membership = SocietyMembership(
            user_id=user_id,
            society_id=society_id,
            role=SocietyMemberRole.MEMBER,
            status=SocietyMemberStatus.ACTIVE,
        )
        session.add(membership)
        session.commit()
        session.refresh(membership)
        return membership

    def list_pending_rwa_admins(self, session: Session) -> list[dict[str, Any]]:
        """List all pending RWA admin membership applications for municipal admin review."""
        memberships = session.scalars(
            select(SocietyMembership)
            .options(joinedload(SocietyMembership.user), joinedload(SocietyMembership.society))
            .where(
                SocietyMembership.role == SocietyMemberRole.RWA_ADMIN,
                SocietyMemberStatus.PENDING == SocietyMembership.status,
            )
            .order_by(SocietyMembership.joined_at.desc())
        ).all()

        results = []
        for m in memberships:
            results.append({
                "id": m.id,
                "user_id": m.user_id,
                "society_id": m.society_id,
                "role": m.role,
                "status": m.status,
                "registration_doc_path": m.registration_doc_path,
                "joined_at": m.joined_at,
                "user_name": m.user.name if m.user else None,
                "user_email": m.user.email if m.user else None,
                "society_name": m.society.name if m.society else None,
            })
        return results

    def verify_rwa_admin(
        self, session: Session, membership_id: int, new_status: SocietyMemberStatus
    ) -> SocietyMembership:
        """Approve or reject a pending RWA admin application."""
        membership = session.scalar(
            select(SocietyMembership).where(SocietyMembership.id == membership_id)
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Membership {membership_id} not found.",
            )
        if membership.role != SocietyMemberRole.RWA_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only RWA admin memberships can be verified through this endpoint.",
            )

        membership.status = new_status
        session.commit()
        session.refresh(membership)
        return membership

    def get_user_memberships(
        self, session: Session, user_id: int
    ) -> list[dict[str, Any]]:
        """List all society memberships for a specific user."""
        memberships = session.scalars(
            select(SocietyMembership)
            .options(joinedload(SocietyMembership.society))
            .where(SocietyMembership.user_id == user_id)
        ).all()

        return [
            {
                "id": m.id,
                "user_id": m.user_id,
                "society_id": m.society_id,
                "role": m.role,
                "status": m.status,
                "registration_doc_path": m.registration_doc_path,
                "joined_at": m.joined_at,
                "society_name": m.society.name if m.society else None,
            }
            for m in memberships
        ]

    def get_society_dashboard(
        self, session: Session, society_id: int, current_user: User
    ) -> SocietyDashboardRead:
        """Compute aggregate stats for a society.

        Enforces Privacy Boundary:
        - Must be municipal admin or active member/RWA admin of the society.
        - If active members < 3, suppresses metrics to prevent mathematical inference.
        """
        society = self.get_society(session, society_id)

        # Authorization check
        is_admin = current_user.role == UserRole.ADMIN
        membership = session.scalar(
            select(SocietyMembership).where(
                SocietyMembership.user_id == current_user.id,
                SocietyMembership.society_id == society_id,
                SocietyMembership.status == SocietyMemberStatus.ACTIVE,
            )
        )
        if not is_admin and not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You must be a verified active member or admin of this society.",
            )

        # Cohort counts
        total_members = (
            session.scalar(
                select(func.count(SocietyMembership.id)).where(
                    SocietyMembership.society_id == society_id
                )
            )
            or 0
        )
        active_members = (
            session.scalar(
                select(func.count(SocietyMembership.id)).where(
                    SocietyMembership.society_id == society_id,
                    SocietyMembership.status == SocietyMemberStatus.ACTIVE,
                )
            )
            or 0
        )

        # Privacy suppression guard (k-Anonymity)
        if active_members < MIN_SOCIETY_MEMBERS_FOR_AGGREGATE:
            return SocietyDashboardRead(
                society_id=society.id,
                society_name=society.name,
                zone_id=society.zone_id,
                total_members=total_members,
                active_members=active_members,
                privacy_suppressed=True,
                message="Aggregate statistics require a minimum of 3 active households to safeguard resident privacy.",
                average_compliance=None,
                total_verified_pickups=None,
                total_points_earned=None,
                zone_rank=None,
            )

        # Subquery for active member user IDs
        active_user_ids = select(SocietyMembership.user_id).where(
            SocietyMembership.society_id == society_id,
            SocietyMembership.status == SocietyMemberStatus.ACTIVE,
        )

        # Aggregate compliance score
        avg_compliance = session.scalar(
            select(func.coalesce(func.avg(ComplianceScore.rolling_score), 0.0)).where(
                ComplianceScore.user_id.in_(active_user_ids)
            )
        )
        avg_compliance_val = round(float(avg_compliance or 0.0), 1)

        # Total verified pickups
        total_pickups = session.scalar(
            select(func.coalesce(func.sum(ComplianceScore.verified_pickups), 0)).where(
                ComplianceScore.user_id.in_(active_user_ids)
            )
        )

        # Total points earned
        total_points = session.scalar(
            select(func.coalesce(func.sum(UserTierRecord.points_balance), 0)).where(
                UserTierRecord.user_id.in_(active_user_ids)
            )
        )

        # Compute zone rank among societies in same zone with >= 3 active members
        # Rank by average compliance descending
        other_societies = session.scalars(
            select(Society).where(
                Society.zone_id == society.zone_id,
                Society.id != society.id,
            )
        ).all()

        rank = 1
        for other in other_societies:
            other_active_count = session.scalar(
                select(func.count(SocietyMembership.id)).where(
                    SocietyMembership.society_id == other.id,
                    SocietyMembership.status == SocietyMemberStatus.ACTIVE,
                )
            ) or 0
            if other_active_count >= MIN_SOCIETY_MEMBERS_FOR_AGGREGATE:
                other_active_ids = select(SocietyMembership.user_id).where(
                    SocietyMembership.society_id == other.id,
                    SocietyMembership.status == SocietyMemberStatus.ACTIVE,
                )
                other_avg = session.scalar(
                    select(func.coalesce(func.avg(ComplianceScore.rolling_score), 0.0)).where(
                        ComplianceScore.user_id.in_(other_active_ids)
                    )
                ) or 0.0
                if float(other_avg) > avg_compliance_val:
                    rank += 1

        return SocietyDashboardRead(
            society_id=society.id,
            society_name=society.name,
            zone_id=society.zone_id,
            total_members=total_members,
            active_members=active_members,
            privacy_suppressed=False,
            message=None,
            average_compliance=avg_compliance_val,
            total_verified_pickups=int(total_pickups or 0),
            total_points_earned=int(total_points or 0),
            zone_rank=rank,
        )


society_service = SocietyService()
