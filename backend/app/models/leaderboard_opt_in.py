from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base


class LeaderboardOptIn(Base):
    """Per-user opt-in record for individual leaderboard visibility.

    Default state is opted **out** (opted_in=False).  A user who has not
    explicitly opted in must never appear - by name, handle, or
    implication - on any individual leaderboard.

    If opted_in is True but display_handle is null, the UI should
    auto-generate an anonymous handle like "Member #1234".
    """

    __tablename__ = "leaderboard_opt_ins"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    opted_in: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    display_handle: Mapped[str | None] = mapped_column(String(120), nullable=True)
    opted_in_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    user = relationship("User", back_populates="leaderboard_opt_in")
