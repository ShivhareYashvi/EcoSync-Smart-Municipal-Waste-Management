from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import MaterialType


class RecyclingReceipt(Base):
    """Immutable digital receipt generated upon citizen confirmation of a material sale."""

    __tablename__ = "recycling_receipts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    transaction_id: Mapped[int] = mapped_column(
        ForeignKey("recycling_transactions.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    receipt_number: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    material: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    weight_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    amount_credited: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    issued_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    transaction = relationship("RecyclingTransaction", back_populates="receipt")
    epr_credit = relationship("EPRCredit", back_populates="receipt", uselist=False, cascade="all, delete-orphan")
