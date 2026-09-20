from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import EPRCreditStatus, RecyclerVerificationStatus, RecyclingTransactionStatus, UserRole
from app.models.epr_credit import EPRCredit
from app.models.recycler import Recycler
from app.models.recycler_rate_card import RecyclerRateCard
from app.models.recycling_receipt import RecyclingReceipt
from app.models.recycling_transaction import RecyclingTransaction
from app.models.user import User
from app.schemas.recycling_transaction import ReceiptRead, TransactionCreate, TransactionDisputeRequest, TransactionLogRequest, TransactionRead


class RecyclingTransactionService:
    """Service orchestrating the citizen-to-recycler material sale lifecycle, digital receipts, and EPR ledgering."""

    def request_transaction(
        self, session: Session, citizen_id: int, payload: TransactionCreate
    ) -> TransactionRead:
        recycler = session.scalar(select(Recycler).where(Recycler.id == payload.recycler_id))
        if recycler is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recycler not found")
        if recycler.verification_status != RecyclerVerificationStatus.VERIFIED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot request a transaction with an unverified recycler",
            )

        now = datetime.now(timezone.utc)
        txn = RecyclingTransaction(
            citizen_id=citizen_id,
            recycler_id=payload.recycler_id,
            material=payload.material,
            estimated_weight_kg=payload.estimated_weight_kg,
            status=RecyclingTransactionStatus.REQUESTED,
            created_at=now,
        )
        session.add(txn)
        session.commit()
        session.refresh(txn)
        return self._to_transaction_read(txn, session)

    def log_pickup(
        self, session: Session, current_user: User, transaction_id: int, payload: TransactionLogRequest
    ) -> TransactionRead:
        txn = session.scalar(
            select(RecyclingTransaction)
            .options(selectinload(RecyclingTransaction.recycler))
            .where(RecyclingTransaction.id == transaction_id)
        )
        if txn is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

        # Authorization: Must be the assigned recycler or an admin
        if current_user.role != UserRole.ADMIN and txn.recycler.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to log pickup for this transaction",
            )

        if txn.status != RecyclingTransactionStatus.REQUESTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot log transaction in status '{txn.status.value}' (must be 'requested')",
            )

        material_to_use = payload.material or txn.material

        # Look up active rate card for this recycler and material
        rate_card = session.scalar(
            select(RecyclerRateCard).where(
                RecyclerRateCard.recycler_id == txn.recycler_id,
                RecyclerRateCard.material == material_to_use,
                RecyclerRateCard.active == True,  # noqa: E712
            )
        )
        if rate_card is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Recycler has no active rate card for material '{material_to_use.value}'",
            )

        # Snapshot rate and compute amount using exact Decimal arithmetic
        rate_snapshot = Decimal(str(rate_card.rate_per_kg))
        weight = Decimal(str(payload.weight_kg))
        amount = (weight * rate_snapshot).quantize(Decimal("0.01"))

        txn.weight_kg = weight
        txn.material = material_to_use
        txn.rate_applied = rate_snapshot
        txn.amount_credited = amount
        txn.photo_url = payload.photo_url
        txn.status = RecyclingTransactionStatus.LOGGED

        session.commit()
        session.refresh(txn)
        return self._to_transaction_read(txn, session)

    def confirm_transaction(
        self, session: Session, current_user: User, transaction_id: int
    ) -> TransactionRead:
        txn = session.scalar(
            select(RecyclingTransaction)
            .options(selectinload(RecyclingTransaction.receipt))
            .where(RecyclingTransaction.id == transaction_id)
        )
        if txn is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

        # Authorization: Citizen who initiated the request or Admin
        if current_user.role != UserRole.ADMIN and txn.citizen_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to confirm this transaction",
            )

        if txn.status == RecyclingTransactionStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Transaction is already confirmed"
            )
        if txn.status == RecyclingTransactionStatus.DISPUTED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot confirm a disputed transaction"
            )
        if txn.status != RecyclingTransactionStatus.LOGGED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Transaction must be in 'logged' status to confirm (current: '{txn.status.value}')",
            )

        now = datetime.now(timezone.utc)
        txn.status = RecyclingTransactionStatus.CONFIRMED

        # Task 5: Auto-generate digital recycling receipt
        receipt_number = f"RCP-{now.strftime('%Y%m%d')}-{uuid4().hex[:8].upper()}"
        receipt = RecyclingReceipt(
            transaction_id=txn.id,
            receipt_number=receipt_number,
            material=txn.material,
            weight_kg=txn.weight_kg,
            amount_credited=txn.amount_credited,
            issued_at=now,
        )
        session.add(receipt)
        session.flush()

        # Task 6: Auto-generate EPR credit row (placeholder 1:1 conversion: credit_amount = weight_kg)
        epr_credit = EPRCredit(
            receipt_id=receipt.id,
            credit_amount=receipt.weight_kg,
            status=EPRCreditStatus.AVAILABLE,
            created_at=now,
        )
        session.add(epr_credit)

        session.commit()
        session.refresh(txn)
        return self._to_transaction_read(txn, session)

    def dispute_transaction(
        self, session: Session, current_user: User, transaction_id: int, payload: TransactionDisputeRequest
    ) -> TransactionRead:
        txn = session.scalar(select(RecyclingTransaction).where(RecyclingTransaction.id == transaction_id))
        if txn is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

        if current_user.role != UserRole.ADMIN and txn.citizen_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to dispute this transaction",
            )

        if txn.status == RecyclingTransactionStatus.CONFIRMED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transaction is already confirmed and cannot be disputed",
            )
        if txn.status != RecyclingTransactionStatus.LOGGED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only transactions in 'logged' status can be disputed (current: '{txn.status.value}')",
            )

        txn.status = RecyclingTransactionStatus.DISPUTED
        session.commit()
        session.refresh(txn)
        return self._to_transaction_read(txn, session)

    def list_transactions(
        self, session: Session, current_user: User, status_filter: RecyclingTransactionStatus | None = None
    ) -> list[TransactionRead]:
        query = select(RecyclingTransaction).order_by(desc(RecyclingTransaction.created_at))

        if current_user.role == UserRole.CITIZEN:
            query = query.where(RecyclingTransaction.citizen_id == current_user.id)
        elif current_user.role == UserRole.RECYCLER:
            recycler = session.scalar(select(Recycler).where(Recycler.user_id == current_user.id))
            if recycler is None:
                return []
            query = query.where(RecyclingTransaction.recycler_id == recycler.id)
        # Admin sees all transactions

        if status_filter is not None:
            query = query.where(RecyclingTransaction.status == status_filter)

        txns = session.scalars(query).all()
        return [self._to_transaction_read(t, session) for t in txns]

    def get_transaction(
        self, session: Session, current_user: User, transaction_id: int
    ) -> TransactionRead:
        txn = session.scalar(
            select(RecyclingTransaction)
            .options(selectinload(RecyclingTransaction.recycler))
            .where(RecyclingTransaction.id == transaction_id)
        )
        if txn is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

        # Authorization: Citizen who initiated, assigned recycler, or admin
        is_owner_citizen = current_user.role == UserRole.CITIZEN and txn.citizen_id == current_user.id
        is_assigned_recycler = (
            current_user.role == UserRole.RECYCLER
            and txn.recycler is not None
            and txn.recycler.user_id == current_user.id
        )
        if current_user.role != UserRole.ADMIN and not is_owner_citizen and not is_assigned_recycler:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this transaction",
            )
        return self._to_transaction_read(txn, session)


    def list_receipts_for_citizen(self, session: Session, citizen_id: int) -> list[ReceiptRead]:
        receipts = session.scalars(
            select(RecyclingReceipt)
            .join(RecyclingTransaction, RecyclingReceipt.transaction_id == RecyclingTransaction.id)
            .where(RecyclingTransaction.citizen_id == citizen_id)
            .order_by(desc(RecyclingReceipt.issued_at))
        ).all()
        return [ReceiptRead.model_validate(r) for r in receipts]

    def _to_transaction_read(self, txn: RecyclingTransaction, session: Session) -> TransactionRead:
        citizen = session.scalar(select(User).where(User.id == txn.citizen_id))
        recycler = session.scalar(select(Recycler).where(Recycler.id == txn.recycler_id))
        receipt = session.scalar(select(RecyclingReceipt).where(RecyclingReceipt.transaction_id == txn.id))

        return TransactionRead(
            id=txn.id,
            citizen_id=txn.citizen_id,
            citizen_name=citizen.name if citizen else None,
            citizen_phone=citizen.phone if citizen else None,
            recycler_id=txn.recycler_id,
            recycler_business_name=recycler.business_name if recycler else None,
            material=txn.material,
            estimated_weight_kg=txn.estimated_weight_kg,
            weight_kg=txn.weight_kg,
            rate_applied=txn.rate_applied,
            amount_credited=txn.amount_credited,
            photo_url=txn.photo_url,
            status=txn.status,
            created_at=txn.created_at,
            receipt=ReceiptRead.model_validate(receipt) if receipt else None,
        )


recycling_transaction_service = RecyclingTransactionService()
