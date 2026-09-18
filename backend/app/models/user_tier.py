from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import UserTier


class UserTierRecord(Base):
    """Gamification tier and points balance for a citizen account.

    One row per user (user_id is both PK and FK).  Created on first
    pickup log; upserted on every subsequent award or reversal.
    """

    __tablename__ = "user_tiers"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    current_tier: Mapped[UserTier] = mapped_column(
        Enum(UserTier, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=UserTier.BRONZE,
        nullable=False,
    )
    points_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    points_lifetime: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    flags_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tier_updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="user_tier")
