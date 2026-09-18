from datetime import datetime, timezone

from sqlalchemy import DateTime, Float, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base


class ComplianceScore(Base):
    """Rolling 90-day compliance score for a citizen's pickup history.

    One row per user (user_id is both PK and FK).  Recalculated on every
    pickup log, confirm, or dispute event.  Formula:
        rolling_score = verified_pickups / total_pickups * 100
    where both counts are restricted to the trailing 90-day window.
    """

    __tablename__ = "compliance_scores"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    rolling_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    total_pickups: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    verified_pickups: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="compliance_score")
