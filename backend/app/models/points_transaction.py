from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import PointsTransactionStatus


class PointsTransaction(Base):
    """Immutable ledger entry for points awarded or reversed on a pickup.

    A new row is written for every award or reversal - status transitions
    (pending → approved / flagged) are made in-place on the single row
    created at award time, keeping the ledger simple.
    """

    __tablename__ = "points_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    pickup_id: Mapped[int | None] = mapped_column(
        ForeignKey("pickup_requests.id", ondelete="SET NULL"), nullable=True, index=True
    )
    points: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[PointsTransactionStatus] = mapped_column(
        Enum(
            PointsTransactionStatus,
            values_callable=lambda enum: [item.value for item in enum],
            native_enum=False,
        ),
        default=PointsTransactionStatus.PENDING,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="points_transactions")
    pickup = relationship("PickupRequest", back_populates="points_transactions")
