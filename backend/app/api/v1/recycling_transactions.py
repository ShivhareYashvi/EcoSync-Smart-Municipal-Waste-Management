"""Recycling transactions API endpoints (citizen sale requests, recycler logging, citizen confirmation/dispute)."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import RecyclingTransactionStatus
from app.models.user import User
from app.schemas.recycling_transaction import TransactionCreate, TransactionDisputeRequest, TransactionLogRequest, TransactionRead
from app.services.recycling_transaction_service import recycling_transaction_service

router = APIRouter(prefix="/recycling-transactions", tags=["recycling-transactions"])


@router.post("", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
def request_recycling_sale(
    payload: TransactionCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    """Citizen initiates a sale request for segregated recyclables to a verified recycler."""
    return recycling_transaction_service.request_transaction(session, current_user.id, payload)


@router.get("", response_model=list[TransactionRead])
def list_recycling_transactions(
    status_filter: RecyclingTransactionStatus | None = Query(default=None, alias="status"),
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TransactionRead]:
    """List recycling transactions for the current user (role-aware: citizen, recycler, or admin)."""
    return recycling_transaction_service.list_transactions(session, current_user, status_filter=status_filter)


@router.get("/{transaction_id}", response_model=TransactionRead)
def get_recycling_transaction(
    transaction_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    """Retrieve details of a specific recycling transaction."""
    return recycling_transaction_service.get_transaction(session, current_user, transaction_id)



@router.post("/{transaction_id}/log", response_model=TransactionRead)
def log_pickup(
    transaction_id: int,
    payload: TransactionLogRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    """Recycler logs physical pickup weight, optional photo proof, and snapshots the current active rate."""
    return recycling_transaction_service.log_pickup(session, current_user, transaction_id, payload)


@router.post("/{transaction_id}/confirm", response_model=TransactionRead)
def confirm_transaction(
    transaction_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    """Citizen confirms logged weight and credit. Generates digital receipt and available EPR credit."""
    return recycling_transaction_service.confirm_transaction(session, current_user, transaction_id)


@router.post("/{transaction_id}/dispute", response_model=TransactionRead)
def dispute_transaction(
    transaction_id: int,
    payload: TransactionDisputeRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TransactionRead:
    """Citizen disputes logged weight or material. Transaction is held for municipal review."""
    return recycling_transaction_service.dispute_transaction(session, current_user, transaction_id, payload)
