"""Zone management API endpoints."""

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.phase2 import ZoneRead, ZoneUserAssign
from app.services.zone_service import zone_service

router = APIRouter(prefix="/zones", tags=["zones"])


@router.get("", response_model=list[ZoneRead])
def list_zones(session: Session = Depends(get_db)) -> list[ZoneRead]:
    """List all municipal zones/wards."""
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
    session: Session = Depends(get_db),
) -> dict:
    """Admin: reassign any user to a different zone."""
    zone_service.assign_user_zone(session, user_id, payload.zone_id)
    return {"user_id": user_id, "zone_id": payload.zone_id, "status": "updated"}


@router.post("/backfill", response_model=dict)
def backfill_zone_ids(session: Session = Depends(get_db)) -> dict:
    """Admin: backfill zone_id on existing pickups and complaints from user zone."""
    result = zone_service.backfill_zone_ids(session)
    return result


@router.post("/seed", response_model=dict)
def seed_zones(session: Session = Depends(get_db)) -> dict:
    """Admin: seed initial zones if not already present."""
    count = zone_service.seed_zones(session)
    return {"zones_inserted": count}
