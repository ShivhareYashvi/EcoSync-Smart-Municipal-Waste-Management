"""Redemption catalog and redemption endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.redemption import RedemptionCatalogRead, RedemptionCreate, RedemptionRead
from app.services.redemption_service import redemption_service

router = APIRouter(tags=["redemptions"])


@router.get("/redemptions/catalog", response_model=list[RedemptionCatalogRead])
def list_catalog(session: Session = Depends(get_db)) -> list[RedemptionCatalogRead]:
    """List all active reward catalog items."""
    return redemption_service.list_catalog(session)


@router.post("/redemptions", response_model=RedemptionRead, status_code=status.HTTP_201_CREATED)
def create_redemption(
    payload: RedemptionCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RedemptionRead:
    """Spend points on a catalog item.

    Deducts ``points_cost`` from the citizen's balance atomically.
    Raises 400 if balance is insufficient, 404 if item is inactive.
    """
    return redemption_service.redeem(session, current_user.id, payload.catalog_item_id)
