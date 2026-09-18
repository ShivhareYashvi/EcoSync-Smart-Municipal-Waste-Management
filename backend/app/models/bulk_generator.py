from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import BillingStatus, BulkGeneratorCategory


class BulkGenerator(Base):
    """High-volume commercial waste producer profile."""

    __tablename__ = "bulk_generators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    org_name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[BulkGeneratorCategory] = mapped_column(
        Enum(BulkGeneratorCategory, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    address: Mapped[str] = mapped_column(Text, nullable=False)
    zone_id: Mapped[int] = mapped_column(ForeignKey("zones.id", ondelete="RESTRICT"), nullable=False, index=True)
    contact_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    threshold_kg: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)
    billing_status: Mapped[BillingStatus] = mapped_column(
        Enum(BillingStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=BillingStatus.ACTIVE,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    zone = relationship("Zone", back_populates="bulk_generators")
    contact_user = relationship("User", back_populates="bulk_generators", foreign_keys=[contact_user_id])
    pickup_requests = relationship("PickupRequest", back_populates="bulk_generator")
