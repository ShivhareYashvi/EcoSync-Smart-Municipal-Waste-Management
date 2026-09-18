from sqlalchemy import Enum, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import RecyclerVerificationStatus


class Recycler(TimestampMixin, Base):
    """Recycling aggregator/buyer profile linked to a platform user account."""

    __tablename__ = "recyclers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    materials_accepted: Mapped[list[str]] = mapped_column(JSON, default=list, nullable=False)
    service_zone_ids: Mapped[list[int]] = mapped_column(JSON, default=list, nullable=False)
    verification_status: Mapped[RecyclerVerificationStatus] = mapped_column(
        Enum(RecyclerVerificationStatus, values_callable=lambda enum: [item.value for item in enum], native_enum=False),
        default=RecyclerVerificationStatus.PENDING,
        nullable=False,
    )
    verification_doc_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    user = relationship("User", back_populates="recycler_profile")
    rate_cards = relationship("RecyclerRateCard", back_populates="recycler", cascade="all, delete-orphan")
    transactions = relationship("RecyclingTransaction", back_populates="recycler")
