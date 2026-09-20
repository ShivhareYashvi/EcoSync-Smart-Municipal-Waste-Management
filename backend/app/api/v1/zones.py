"""Zone management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.phase2 import ZoneRead, ZoneUserAssign
from app.services.zone_service import zone_service

router = APIRouter(prefix="/zones", tags=["zones"])


def _require_admin(user: User) -> None:
    if user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin authorization required",
        )


@router.get("", response_model=list[ZoneRead])
def list_zones(session: Session = Depends(get_db)) -> list[ZoneRead]:
    """List all municipal zones/wards (public for registration and onboarding)."""
    zones = zone_service.list_zones(session)
    return [ZoneRead.model_validate(z) for z in zones]


@router.get("/{zone_id}", response_model=ZoneRead)
def get_zone(zone_id: int, session: Session = Depends(get_db)) -> ZoneRead:
    """Get a single zone by ID."""
    zone = zone_service.get_zone(session, zone_id)
    return ZoneRead.model_validate(zone)


@router.patch("/users/{user_id}/zone", response_model=dict)
def assign_user_zone(
    user_id: int,
    payload: ZoneUserAssign,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict:
    """Admin: reassign any user to a different zone."""
    _require_admin(current_user)
    zone_service.assign_user_zone(session, user_id, payload.zone_id)
    return {"user_id": user_id, "zone_id": payload.zone_id, "status": "updated"}


@router.post("/backfill", response_model=dict)
def backfill_zone_ids(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict:
    """Admin: backfill zone_id on existing pickups and complaints from user zone."""
    _require_admin(current_user)
    result = zone_service.backfill_zone_ids(session)
    return result


@router.post("/seed", response_model=dict)
def seed_zones(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> dict:
    """Admin: seed initial zones if not already present."""
    _require_admin(current_user)
    count = zone_service.seed_zones(session)
    return {"zones_inserted": count}

