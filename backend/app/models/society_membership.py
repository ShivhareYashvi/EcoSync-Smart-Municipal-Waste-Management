from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db_base import Base
from app.models.enums import SocietyMemberRole, SocietyMemberStatus


class SocietyMembership(Base):
    """Links a citizen to a housing society with a role and approval status.
    Regular members join immediately (status=active).  RWA admin
    memberships require municipal-admin approval (status=pending until
    verified), mirroring the recycler-verification workflow.
    """

    __tablename__ = "society_memberships"
    __table_args__ = (
        UniqueConstraint("user_id", "society_id", name="uq_society_membership_user_society"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    society_id: Mapped[int] = mapped_column(
        ForeignKey("societies.id", ondelete="CASCADE"), nullable=False, index=True
    )
    role: Mapped[SocietyMemberRole] = mapped_column(
        Enum(
            SocietyMemberRole,
            values_callable=lambda enum: [item.value for item in enum],
            native_enum=False,
        ),
        default=SocietyMemberRole.MEMBER,
        nullable=False,
    )
    status: Mapped[SocietyMemberStatus] = mapped_column(
        Enum(
            SocietyMemberStatus,
            values_callable=lambda enum: [item.value for item in enum],
            native_enum=False,
        ),
        default=SocietyMemberStatus.ACTIVE,
        nullable=False,
    )
    registration_doc_path: Mapped[str | None] = mapped_column(String(512), nullable=True)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    user = relationship("User", back_populates="society_memberships")
    society = relationship("Society", back_populates="memberships")
