from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import CompostBatchStatus


class CompostBatch(Base):
    """Compost batch tracking municipal organic wet-waste aggregation and curing lifecycle."""

    __tablename__ = "compost_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("zones.id", ondelete="RESTRICT"), index=True, nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    total_weight_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[CompostBatchStatus] = mapped_column(
        Enum(CompostBatchStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=CompostBatchStatus.COLLECTED,
        nullable=False,
    )
    buyer_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    zone = relationship("Zone")
