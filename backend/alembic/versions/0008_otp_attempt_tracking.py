"""Add OTP attempt tracking and cleanup index.

Revision ID: 0008_otp_attempt_tracking
Revises: 0007_offline_pwa_idempotency
Create Date: 2026-10-25 17:00:00.000000

Changes
-------
Altered tables:
  otp_challenges  – add ``attempts`` column (SmallInteger, default 0)
                  – add index on ``expires_at`` for efficient cleanup queries
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0008_otp_attempt_tracking"
down_revision: str | None = "0007_offline_pwa_idempotency"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "otp_challenges",
        sa.Column("attempts", sa.SmallInteger(), nullable=False, server_default="0"),
    )
    op.create_index(
        "ix_otp_challenges_expires_at",
        "otp_challenges",
        ["expires_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_otp_challenges_expires_at", table_name="otp_challenges")
    op.drop_column("otp_challenges", "attempts")
