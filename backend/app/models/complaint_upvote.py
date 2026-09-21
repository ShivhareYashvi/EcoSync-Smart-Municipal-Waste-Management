from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base


class ComplaintUpvote(Base):
    """Citizen upvote on a complaint - one vote per user per complaint.

    Uniqueness is enforced at the database level via a unique constraint
    on (complaint_id, user_id), not just in application logic.
    """

    __tablename__ = "complaint_upvotes"
    __table_args__ = (
        UniqueConstraint("complaint_id", "user_id", name="uq_complaint_upvote_user"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    complaint_id: Mapped[int] = mapped_column(
        ForeignKey("complaints.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    complaint = relationship("Complaint", back_populates="upvotes")
    user = relationship("User", back_populates="complaint_upvotes")
