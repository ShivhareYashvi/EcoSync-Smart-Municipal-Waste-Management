"""Recycler management and public scrap price board API."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import MaterialType, RecyclerVerificationStatus, UserRole
from app.models.user import User
from app.schemas.recycler import PublicRateRead, RateCardCreate, RateCardRead, RecyclerRead, RecyclerVerifyRequest
from app.services.recycler_service import recycler_service

router = APIRouter(prefix="/recyclers", tags=["recyclers"])


# ── 1. Public Price Board (No Auth Required) 


@router.get("/rates", response_model=list[PublicRateRead])
def get_public_price_board(
    zone_id: int | None = Query(default=None, description="Filter rates by municipal zone ID"),
    material: MaterialType | None = Query(default=None, description="Filter rates by recyclable material type"),
    session: Session = Depends(get_db),
) -> list[PublicRateRead]:
    """Public live scrap price board — transparent material rates posted by verified recyclers.

    No authentication required. Citizens and businesses use this to inspect real-time scrap rates.
    """
    return recycler_service.get_active_rates(session, zone_id=zone_id, material=material)


# ── 2. Admin & Recycler Protected Endpoints ─


@router.get("/pending", response_model=list[RecyclerRead])
def list_pending_recyclers(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RecyclerRead]:
    """Admin queue of pending recyclers awaiting verification."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")
    return recycler_service.list_recyclers(session, status_filter=RecyclerVerificationStatus.PENDING)


@router.get("/me", response_model=RecyclerRead)
def get_my_recycler_profile(
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecyclerRead:
    """Retrieve the recycler profile for the authenticated recycler user."""
    recycler = recycler_service.get_recycler_by_user_id(session, current_user.id)
    if recycler is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No recycler profile found for current account")
    return recycler_service._to_recycler_read(recycler)


@router.get("", response_model=list[RecyclerRead])
def list_all_recyclers(
    status_filter: RecyclerVerificationStatus | None = Query(default=None, alias="status"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RecyclerRead]:
    """List all recyclers, optionally filtered by verification status."""
    return recycler_service.list_recyclers(session, status_filter=status_filter)


@router.get("/{recycler_id}", response_model=RecyclerRead)
def get_recycler(
    recycler_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecyclerRead:
    """Get recycler details by ID."""
    recycler = recycler_service.get_recycler_by_id(session, recycler_id)
    if recycler is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recycler not found")
    return recycler_service._to_recycler_read(recycler)


@router.patch("/{recycler_id}/verify", response_model=RecyclerRead)
def verify_recycler(
    recycler_id: int,
    payload: RecyclerVerifyRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecyclerRead:
    """Admin endpoint to verify or reject a registered recycler."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin authorization required")
    return recycler_service.verify_recycler(session, recycler_id, payload.status)


@router.post("/{recycler_id}/rates", response_model=RateCardRead, status_code=status.HTTP_201_CREATED)
def post_rate_card(
    recycler_id: int,
    payload: RateCardCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RateCardRead:
    """Recycler posts or updates a material rate.

    Previous rates for this material are archived (active=false) to ensure historical transaction snapshots remain valid.
    """
    recycler = recycler_service.get_recycler_by_id(session, recycler_id)
    if recycler is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recycler not found")

    if current_user.role != UserRole.ADMIN and recycler.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to post rates for this recycler")

    return recycler_service.set_rate(session, recycler_id, payload.material, payload.rate_per_kg)


@router.get("/{recycler_id}/rates", response_model=list[RateCardRead])
def list_recycler_rates(
    recycler_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[RateCardRead]:
    """List rate card history for a recycler."""
    return recycler_service.list_rates_for_recycler(session, recycler_id)
