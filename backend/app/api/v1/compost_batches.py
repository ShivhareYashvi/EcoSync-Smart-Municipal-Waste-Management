"""Compost batch tracking API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import CompostBatchStatus, UserRole
from app.models.user import User
from app.schemas.compost_batch import CompostBatchCreate, CompostBatchRead, CompostBatchStatusUpdate
from app.services.compost_service import compost_service

router = APIRouter(prefix="/compost-batches", tags=["compost-batches"])


def _require_admin(user: User) -> None:
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")


@router.post("", response_model=CompostBatchRead, status_code=status.HTTP_201_CREATED)
def create_compost_batch(
    payload: CompostBatchCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompostBatchRead:
    """Create a new compost batch for a zone and period, auto-aggregating confirmed wet waste."""
    _require_admin(current_user)
    return compost_service.create_batch(session, payload)


@router.get("", response_model=list[CompostBatchRead])
def list_compost_batches(
    zone_id: int | None = Query(default=None, description="Filter by municipal zone"),
    status_filter: CompostBatchStatus | None = Query(default=None, alias="status"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CompostBatchRead]:
    """List all compost batches and their processing stages."""
    return compost_service.list_batches(session, zone_id=zone_id, status_filter=status_filter)


@router.patch("/{batch_id}/status", response_model=CompostBatchRead)
def update_batch_status(
    batch_id: int,
    payload: CompostBatchStatusUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CompostBatchRead:
    """Advance a compost batch status (collected -> composting -> completed) and update buyer notes."""
    _require_admin(current_user)
    return compost_service.update_batch_status(session, batch_id, payload)
