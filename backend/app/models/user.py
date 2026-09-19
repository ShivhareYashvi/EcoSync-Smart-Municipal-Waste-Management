from sqlalchemy import Boolean, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import UserRole


class User(TimestampMixin, Base):
    """Platform account for citizens, drivers, and municipal admins."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone: Mapped[str] = mapped_column(String(30), unique=True, index=True, nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=UserRole.CITIZEN,
        nullable=False,
    )
    address: Mapped[str] = mapped_column(Text, nullable=False)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    household_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    electricity_bill_path: Mapped[str | None] = mapped_column(String(512))
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    locale_preference: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

    pickup_requests = relationship("PickupRequest", back_populates="user", foreign_keys="PickupRequest.user_id")
    complaints = relationship("Complaint", back_populates="user")
    rewards = relationship("Reward", back_populates="user")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

    # ── Phase 1 back-references ─────────────────
    points_transactions = relationship("PointsTransaction", back_populates="user")
    user_tier = relationship("UserTierRecord", back_populates="user", uselist=False)
    compliance_score = relationship("ComplianceScore", back_populates="user", uselist=False)
    redemptions = relationship("Redemption", back_populates="user")

    # ── Phase 2 back-references ─────────────────
    zone = relationship("Zone", back_populates="users", foreign_keys=[zone_id])
    assigned_vehicles = relationship("Vehicle", back_populates="assigned_driver")
    bulk_generators = relationship("BulkGenerator", back_populates="contact_user")
    routes = relationship("Route", back_populates="driver")

    # ── Phase 3 back-references ─────────────────
    recycler_profile = relationship("Recycler", back_populates="user", uselist=False)
    recycling_transactions = relationship("RecyclingTransaction", back_populates="citizen")

    # ── Phase 4 back-references ─────────────────
    society_memberships = relationship("SocietyMembership", back_populates="user")
    leaderboard_opt_in = relationship("LeaderboardOptIn", back_populates="user", uselist=False)
    complaint_upvotes = relationship("ComplaintUpvote", back_populates="user")
    referrals_sent = relationship("Referral", back_populates="referrer", foreign_keys="Referral.referrer_id")
    referrals_received = relationship("Referral", back_populates="referred_user", foreign_keys="Referral.referred_user_id")


