from datetime import datetime, timezone

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base


class Zone(Base):
    """Municipal ward or operational zone without polygon geometry."""

    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(40), unique=True, index=True, nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    users = relationship("User", back_populates="zone")
    pickup_requests = relationship("PickupRequest", back_populates="zone")
    complaints = relationship("Complaint", back_populates="zone")
    bulk_generators = relationship("BulkGenerator", back_populates="zone")
    routes = relationship("Route", back_populates="zone")
    hotspots = relationship("ComplaintHotspot", back_populates="zone")
