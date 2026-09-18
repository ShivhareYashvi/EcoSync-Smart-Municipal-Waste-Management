from datetime import date

from sqlalchemy import Boolean, Date, Enum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import FuelType


class Vehicle(Base):
    """Fleet vehicle record for municipal collection dispatch."""

    __tablename__ = "vehicles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    registration_number: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    capacity_kg: Mapped[float] = mapped_column(Float, nullable=False)
    fuel_type: Mapped[FuelType] = mapped_column(
        Enum(FuelType, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        nullable=False,
    )
    maintenance_due_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    assigned_driver_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    assigned_driver = relationship("User", back_populates="assigned_vehicles", foreign_keys=[assigned_driver_id])
    routes = relationship("Route", back_populates="vehicle")
