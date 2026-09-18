from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import EPRCreditStatus


class EPRCredit(Base):
    """Extended Producer Responsibility (EPR) credit generated from verified recycling receipts."""

    __tablename__ = "epr_credits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    receipt_id: Mapped[int] = mapped_column(
        ForeignKey("recycling_receipts.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    # Placeholder conversion: credit_amount = weight_kg (regulatory matrix pending CPCB integration)
    credit_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[EPRCreditStatus] = mapped_column(
        Enum(EPRCreditStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=EPRCreditStatus.AVAILABLE,
        nullable=False,
    )
    brand_id: Mapped[int | None] = mapped_column(
        ForeignKey("brand_accounts.id", ondelete="SET NULL"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    receipt = relationship("RecyclingReceipt", back_populates="epr_credit")
    brand = relationship("BrandAccount", back_populates="epr_credits")
