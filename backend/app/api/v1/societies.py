from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.society import (
    RWAAdminVerifyRequest,
    SocietyCreate,
    SocietyDashboardRead,
    SocietyMembershipRead,
    SocietyRead,
)
from app.services.society_service import society_service

router = APIRouter(prefix="/societies", tags=["societies"])


@router.post("", response_model=SocietyRead, status_code=status.HTTP_201_CREATED)
def register_society(
    payload: SocietyCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> SocietyRead:
    """Register a new housing society and apply as its RWA Admin."""
    society = society_service.register_society(session, current_user.id, payload)
    return SocietyRead.model_validate(society)


@router.get("", response_model=list[SocietyRead])
def list_societies(
    zone_id: int | None = Query(default=None, description="Filter societies by zone ID"),
    session: Session = Depends(get_db),
) -> list[SocietyRead]:
    """List registered housing societies, optionally filtered by zone."""
    societies = society_service.list_societies(session, zone_id=zone_id)
    return [SocietyRead.model_validate(s) for s in societies]


@router.get("/me", response_model=list[SocietyMembershipRead])
def get_my_memberships(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[SocietyMembershipRead]:
    """List all housing society memberships for the current user."""
    memberships = society_service.get_user_memberships(session, current_user.id)
    return [SocietyMembershipRead.model_validate(m) for m in memberships]


@router.get("/pending-admins", response_model=list[SocietyMembershipRead])
def list_pending_rwa_admins(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[SocietyMembershipRead]:
    """Municipal admin: List pending RWA Admin applications."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to view pending RWA admins.",
        )
    items = society_service.list_pending_rwa_admins(session)
    return [SocietyMembershipRead.model_validate(i) for i in items]


@router.get("/{society_id}", response_model=SocietyRead)
def get_society(
    society_id: int,
    session: Session = Depends(get_db),
) -> SocietyRead:
    """Get housing society details by ID."""
    society = society_service.get_society(session, society_id)
    return SocietyRead.model_validate(society)


@router.post("/{society_id}/join", response_model=SocietyMembershipRead)
def join_society(
    society_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> SocietyMembershipRead:
    """Join a housing society as a regular resident member."""
    membership = society_service.join_society(session, current_user.id, society_id)
    return SocietyMembershipRead.model_validate(membership)


@router.patch("/memberships/{membership_id}/verify", response_model=SocietyMembershipRead)
def verify_rwa_admin(
    membership_id: int,
    payload: RWAAdminVerifyRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> SocietyMembershipRead:
    """Municipal admin: Approve or reject an RWA Admin request."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to verify RWA admins.",
        )
    updated = society_service.verify_rwa_admin(session, membership_id, payload.status)
    return SocietyMembershipRead.model_validate(updated)


@router.get("/{society_id}/dashboard", response_model=SocietyDashboardRead)
def get_society_dashboard(
    society_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> SocietyDashboardRead:
    """View aggregate society statistics.

    Enforces Privacy Boundary:
    - Only accessible to verified active members/RWA admins or municipal admins.
    - Suppresses individual statistics if fewer than 3 active households exist.
    """
    return society_service.get_society_dashboard(session, society_id, current_user)
