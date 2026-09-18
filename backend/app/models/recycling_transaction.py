from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import MaterialType, RecyclingTransactionStatus


class RecyclingTransaction(Base):
    """Citizen-to-recycler material sale transaction record (ledger-only)."""

    __tablename__ = "recycling_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    citizen_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    recycler_id: Mapped[int] = mapped_column(ForeignKey("recyclers.id", ondelete="CASCADE"), index=True, nullable=False)
    material: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    estimated_weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    weight_kg: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    rate_applied: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    amount_credited: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    status: Mapped[RecyclingTransactionStatus] = mapped_column(
        Enum(RecyclingTransactionStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=RecyclingTransactionStatus.REQUESTED,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    citizen = relationship("User", back_populates="recycling_transactions")
    recycler = relationship("Recycler", back_populates="transactions")
    receipt = relationship("RecyclingReceipt", back_populates="transaction", uselist=False, cascade="all, delete-orphan")
