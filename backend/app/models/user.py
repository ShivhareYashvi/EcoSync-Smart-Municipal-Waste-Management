from datetime import datetime
from sqlalchemy import Boolean, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import UserRole


class User(TimestampMixin, Base):
    """Platform account for citizens/residents, drivers/collectors, and municipal admins."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str | None] = mapped_column(String(120), nullable=True, default="Citizen")
    phone: Mapped[str | None] = mapped_column(String(30), unique=True, index=True, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=UserRole.CITIZEN,
        nullable=False,
    )
    address: Mapped[str | None] = mapped_column(Text, nullable=True, default="")
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    profile_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Structured Indian Government Address Format
    house_flat_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    street_colony: Mapped[str | None] = mapped_column(String(255), nullable=True)
    locality: Mapped[str | None] = mapped_column(String(120), nullable=True)
    landmark: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ward_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    pincode: Mapped[str | None] = mapped_column(String(10), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)

    household_id: Mapped[str | None] = mapped_column(String(64), unique=True, index=True)
    electricity_bill_path: Mapped[str | None] = mapped_column(String(512))
    zone_id: Mapped[int | None] = mapped_column(ForeignKey("zones.id", ondelete="SET NULL"), nullable=True, index=True)
    locale_preference: Mapped[str] = mapped_column(String(10), default="en", nullable=False)

    # Security & Verification
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    email_verification_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    password_reset_token: Mapped[str | None] = mapped_column(String(128), nullable=True)
    password_reset_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def update_formatted_address(self) -> str:
        parts = [
            self.house_flat_number,
            self.street_colony,
            self.locality,
            f"Near {self.landmark}" if self.landmark else None,
            f"Ward {self.ward_number}" if self.ward_number else None,
            f"Pincode {self.pincode}" if self.pincode else None,
        ]
        formatted = ", ".join([p.strip() for p in parts if p and p.strip()])
        if formatted:
            self.address = formatted
        return self.address or ""

    pickup_requests = relationship("PickupRequest", back_populates="user", foreign_keys="PickupRequest.user_id")
    complaints = relationship("Complaint", back_populates="user")
    rewards = relationship("Reward", back_populates="user")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

    #  Collection & Rewards back-references ─
    points_transactions = relationship("PointsTransaction", back_populates="user")
    user_tier = relationship("UserTierRecord", back_populates="user", uselist=False)
    compliance_score = relationship("ComplianceScore", back_populates="user", uselist=False)
    redemptions = relationship("Redemption", back_populates="user")

    #  Municipal Operations & Fleet back-references ─
    zone = relationship("Zone", back_populates="users", foreign_keys=[zone_id])
    assigned_vehicles = relationship("Vehicle", back_populates="assigned_driver")
    bulk_generators = relationship("BulkGenerator", back_populates="contact_user")
    routes = relationship("Route", back_populates="driver")

    #  Recycler Marketplace & EPR back-references ─
    recycler_profile = relationship("Recycler", back_populates="user", uselist=False)
    recycling_transactions = relationship("RecyclingTransaction", back_populates="citizen")

    #  Citizen Engagement & Community back-references ─
    society_memberships = relationship("SocietyMembership", back_populates="user")
    leaderboard_opt_in = relationship("LeaderboardOptIn", back_populates="user", uselist=False)
    complaint_upvotes = relationship("ComplaintUpvote", back_populates="user")
    referrals_sent = relationship("Referral", back_populates="referrer", foreign_keys="Referral.referrer_id")
    referrals_received = relationship("Referral", back_populates="referred_user", foreign_keys="Referral.referred_user_id")


