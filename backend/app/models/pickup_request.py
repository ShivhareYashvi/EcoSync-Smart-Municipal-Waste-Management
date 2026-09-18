from datetime import date, time
from typing import Any

from sqlalchemy import Boolean, Date, Enum, Float, ForeignKey, Integer, JSON, String, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import PickupStatus, WasteCategory, WasteType


class PickupRequest(TimestampMixin, Base):
    """Citizen waste collection request with duplicate-prevention constraint."""

    __tablename__ = "pickup_requests"
    __table_args__ = (UniqueConstraint("user_id", "waste_type", "scheduled_date", name="uq_pickup_user_waste_date"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    driver_id: Mapped[int | None] = mapped_column(ForeignKey("drivers.id", ondelete="SET NULL"), index=True)
    waste_type: Mapped[WasteType] = mapped_column(
        Enum(WasteType, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    status: Mapped[PickupStatus] = mapped_column(
        Enum(PickupStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=PickupStatus.PENDING,
        nullable=False,
    )
    scheduled_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scheduled_time: Mapped[time] = mapped_column(Time, nullable=False)
    coordinates: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    notes: Mapped[str | None] = mapped_column(Text)

    # ── Phase 1 columns (all nullable — logged post-completion by driver) ────
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    waste_category: Mapped[WasteCategory | None] = mapped_column(
        Enum(WasteCategory, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=True,
    )
    segregation_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    photo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # ── Phase 2 columns ───────────────────────────────────────────────────────
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    route_id: Mapped[int | None] = mapped_column(ForeignKey("routes.id", ondelete="SET NULL"), nullable=True, index=True)
    bulk_generator_id: Mapped[int | None] = mapped_column(ForeignKey("bulk_generators.id", ondelete="SET NULL"), nullable=True, index=True)
    is_bulk_generator: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="pickup_requests", foreign_keys=[user_id])
    driver = relationship("Driver", back_populates="pickup_requests", foreign_keys=[driver_id])
    location_updates = relationship("DriverLocation", back_populates="pickup", cascade="all, delete-orphan")
    points_transactions = relationship("PointsTransaction", back_populates="pickup")

    # ── Phase 2 back-references ───────────────────────────────────────────────
    zone = relationship("Zone", back_populates="pickup_requests", foreign_keys=[zone_id])
    route = relationship("Route", back_populates="pickup_requests", foreign_keys=[route_id])
    bulk_generator = relationship("BulkGenerator", back_populates="pickup_requests", foreign_keys=[bulk_generator_id])
    route_stops = relationship("RouteStop", back_populates="pickup")

