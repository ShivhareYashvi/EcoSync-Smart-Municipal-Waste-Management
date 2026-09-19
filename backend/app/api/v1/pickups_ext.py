"""Extended pickup endpoints — Phase 1 logging, confirm, and dispute."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.enums import PickupStatus
from app.models.pickup_request import PickupRequest
from app.schemas.pickup_request import PickupDisputePayload, PickupLogPayload, PickupRequestRead
from app.services.compliance_service import compliance_service
from app.services.points_engine import points_service
from fastapi import HTTPException
from sqlalchemy import select

router = APIRouter(tags=["pickups-phase1"])


@router.post("/pickups/{pickup_id}/log", response_model=PickupRequestRead, status_code=status.HTTP_200_OK)
def log_pickup_details(
    pickup_id: int,
    payload: PickupLogPayload,
    session: Session = Depends(get_db),
) -> PickupRequestRead:
    """Driver logs weight, category, and optional photo after completing a pickup.

    - Only allowed when pickup status is ``completed``.
    - Sets ``segregation_verified = True`` when a photo_url is provided.
    - Triggers points calculation and compliance score update.
    """
    pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == pickup_id))
    if pickup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")
    if pickup.status != PickupStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pickup must be in 'completed' status to log details. Current status: {pickup.status}",
        )

    pickup.weight_kg = payload.weight_kg
    pickup.waste_category = payload.waste_category
    pickup.photo_url = payload.photo_url
    pickup.segregation_verified = bool(payload.photo_url)
    session.commit()
    session.refresh(pickup)

    # Trigger points engine and compliance score update
    points_service.award_points(session, pickup_id)
    compliance_service.recalculate(session, pickup.user_id)

    # Trigger referral bonus check if this is the citizen's first verified pickup
    from app.services.referral_service import referral_service
    referral_service.check_and_award_referral_bonus(session, pickup_id)

    return PickupRequestRead.model_validate(pickup)


@router.post("/pickups/{pickup_id}/confirm", response_model=PickupRequestRead, status_code=status.HTTP_200_OK)
def confirm_pickup(
    pickup_id: int,
    session: Session = Depends(get_db),
) -> PickupRequestRead:
    """Citizen confirms the driver's logged details are correct.

    Moves the related points transaction from pending → approved if it
    was not already approved (i.e. citizen is confirming an unverified pickup).
    Recalculates compliance score.
    """
    from app.models.points_transaction import PointsTransaction
    from app.models.enums import PointsTransactionStatus

    pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == pickup_id))
    if pickup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")

    # Approve any pending transaction for this pickup
    tx = session.scalar(select(PointsTransaction).where(PointsTransaction.pickup_id == pickup_id))
    if tx is not None and tx.status == PointsTransactionStatus.PENDING:
        points_service.approve_transaction(session, tx.id)

    compliance_service.recalculate(session, pickup.user_id)

    from app.services.referral_service import referral_service
    referral_service.check_and_award_referral_bonus(session, pickup_id)

    session.refresh(pickup)
    return PickupRequestRead.model_validate(pickup)


@router.post("/pickups/{pickup_id}/dispute", response_model=PickupRequestRead, status_code=status.HTTP_200_OK)
def dispute_pickup(
    pickup_id: int,
    payload: PickupDisputePayload,
    session: Session = Depends(get_db),
) -> PickupRequestRead:
    """Citizen disputes the driver's logged details.

    - Flags the associated points transaction (reverses balance if approved).
    - Excludes pickup from compliance score until admin resolves.
    - Stores dispute reason as a note on the pickup record.
    """
    pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == pickup_id))
    if pickup is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")

    if not pickup.segregation_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot dispute a pickup that has not been logged by the driver yet",
        )

    # Append dispute reason to pickup notes
    existing_notes = pickup.notes or ""
    pickup.notes = f"{existing_notes}\n[DISPUTE] {payload.reason}".strip()
    session.commit()

    points_service.flag_transaction(session, pickup_id)
    compliance_service.recalculate(session, pickup.user_id)

    session.refresh(pickup)
    return PickupRequestRead.model_validate(pickup)
