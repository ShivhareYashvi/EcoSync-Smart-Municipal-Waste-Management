from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import MaterialType


class RecyclerRateCard(Base):
    """Historical and active material pricing posted by verified recyclers."""

    __tablename__ = "recycler_rate_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recycler_id: Mapped[int] = mapped_column(ForeignKey("recyclers.id", ondelete="CASCADE"), index=True, nullable=False)
    material: Mapped[MaterialType] = mapped_column(
        Enum(MaterialType, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    rate_per_kg: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    effective_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    recycler = relationship("Recycler", back_populates="rate_cards")
