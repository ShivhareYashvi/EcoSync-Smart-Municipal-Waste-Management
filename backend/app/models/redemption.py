from sqlalchemy import Enum, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base, TimestampMixin
from app.models.enums import RedemptionStatus


class Redemption(TimestampMixin, Base):
    """Citizen redemption request against the closed-loop reward catalog.

    Points are atomically deducted from user_tiers.points_balance when
    this row is created with status='requested'.
    """

    __tablename__ = "redemptions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    catalog_item_id: Mapped[int | None] = mapped_column(
        ForeignKey("redemption_catalog.id", ondelete="SET NULL"), nullable=True, index=True
    )
    points_spent: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[RedemptionStatus] = mapped_column(
        Enum(
            RedemptionStatus,
            values_callable=lambda enum: [item.value for item in enum],
            native_enum=False,
        ),
        default=RedemptionStatus.REQUESTED,
        nullable=False,
    )

    user = relationship("User", back_populates="redemptions")
    catalog_item = relationship("RedemptionCatalog", back_populates="redemptions")
