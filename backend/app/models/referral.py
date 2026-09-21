from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import ReferralStatus


class Referral(Base):
    """Tracks a citizen-to-citizen referral through the platform.

    A referral row is created at registration time (status=pending,
    points_awarded=False).  It transitions to status=completed and
    points_awarded=True **only** when the referred user completes
    their first verified pickup - not on registration alone, to
    prevent trivial fake-account farming of referral points.
    """

    __tablename__ = "referrals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    referrer_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    referred_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    referral_code: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    status: Mapped[ReferralStatus] = mapped_column(
        Enum(
            ReferralStatus,
            values_callable=lambda enum: [item.value for item in enum],
            native_enum=False,
        ),
        default=ReferralStatus.PENDING,
        nullable=False,
    )
    points_awarded: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    referrer = relationship("User", back_populates="referrals_sent", foreign_keys=[referrer_id])
    referred_user = relationship("User", back_populates="referrals_received", foreign_keys=[referred_user_id])
