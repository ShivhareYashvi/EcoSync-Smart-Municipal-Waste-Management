from datetime import date, datetime, timezone

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import RouteStatus, RouteStopStatus


class Route(Base):
    """Driver collection route scheduled for a specific date and zone."""

    __tablename__ = "routes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    driver_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    vehicle_id: Mapped[int | None] = mapped_column(ForeignKey("vehicles.id", ondelete="SET NULL"), nullable=True, index=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("zones.id", ondelete="RESTRICT"), nullable=False, index=True)
    route_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    status: Mapped[RouteStatus] = mapped_column(
        Enum(RouteStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=RouteStatus.PLANNED,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    driver = relationship("User", back_populates="routes", foreign_keys=[driver_id])
    vehicle = relationship("Vehicle", back_populates="routes", foreign_keys=[vehicle_id])
    zone = relationship("Zone", back_populates="routes", foreign_keys=[zone_id])
    stops = relationship("RouteStop", back_populates="route", cascade="all, delete-orphan", order_by="RouteStop.sequence_order")
    pickup_requests = relationship("PickupRequest", back_populates="route")


class RouteStop(Base):
    """Ordered stop within a driver's municipal route."""

    __tablename__ = "route_stops"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    route_id: Mapped[int] = mapped_column(ForeignKey("routes.id", ondelete="CASCADE"), nullable=False, index=True)
    pickup_id: Mapped[int] = mapped_column(ForeignKey("pickup_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    sequence_order: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_arrival: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    actual_arrival: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[RouteStopStatus] = mapped_column(
        Enum(RouteStopStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=RouteStopStatus.PENDING,
        nullable=False,
    )

    route = relationship("Route", back_populates="stops")
    pickup = relationship("PickupRequest", back_populates="route_stops")
