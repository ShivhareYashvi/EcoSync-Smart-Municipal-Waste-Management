from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import HotspotStatus


class ComplaintHotspot(Base):
    """Cluster of complaints flagged when crossing zone thresholds."""

    __tablename__ = "complaint_hotspots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    zone_id: Mapped[int] = mapped_column(ForeignKey("zones.id", ondelete="CASCADE"), nullable=False, index=True)
    complaint_count: Mapped[int] = mapped_column(Integer, nullable=False)
    first_flagged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[HotspotStatus] = mapped_column(
        Enum(HotspotStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=HotspotStatus.ACTIVE,
        nullable=False,
    )
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    zone = relationship("Zone", back_populates="hotspots")
