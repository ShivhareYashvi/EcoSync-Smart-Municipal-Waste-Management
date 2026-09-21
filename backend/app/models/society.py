from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base


class Society(Base):
    """Housing society / RWA registered on the platform.

    Societies aggregate household compliance and pickup data at the
    community level.  Individual household data is never exposed through
    the society dashboard - only AVG/SUM/COUNT aggregates.
    """

    __tablename__ = "societies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    zone_id: Mapped[int | None] = mapped_column(
        ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    zone = relationship("Zone", back_populates="societies", foreign_keys=[zone_id])
    memberships = relationship("SocietyMembership", back_populates="society", cascade="all, delete-orphan")
