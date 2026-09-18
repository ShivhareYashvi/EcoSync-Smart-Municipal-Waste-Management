"""Bulk generator registration and management API endpoints."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.phase2 import BulkGeneratorCreate, BulkGeneratorRead, BulkGeneratorStatusUpdate
from app.services.bulk_generator_service import bulk_generator_service

router = APIRouter(prefix="/bulk-generators", tags=["bulk-generators"])


@router.post(
    "/register",
    response_model=BulkGeneratorRead,
    status_code=status.HTTP_201_CREATED,
)
def register_bulk_generator(
    payload: BulkGeneratorCreate,
    session: Session = Depends(get_db),
) -> BulkGeneratorRead:
    """Register a new commercial bulk waste generator."""
    return bulk_generator_service.register(session, payload)


@router.get("", response_model=list[BulkGeneratorRead])
def list_bulk_generators(
    zone_id: int | None = Query(default=None),
    session: Session = Depends(get_db),
) -> list[BulkGeneratorRead]:
    """List bulk generators, optionally filtered by zone."""
    return bulk_generator_service.list_bulk_generators(session, zone_id=zone_id)


@router.patch("/{bg_id}/status", response_model=BulkGeneratorRead)
def update_bulk_generator_status(
    bg_id: int,
    payload: BulkGeneratorStatusUpdate,
    session: Session = Depends(get_db),
) -> BulkGeneratorRead:
    """Admin: update billing status (active/suspended) of a bulk generator."""
    return bulk_generator_service.update_status(session, bg_id, payload)
