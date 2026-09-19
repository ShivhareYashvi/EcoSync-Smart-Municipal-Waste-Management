"""Add Phase 5 offline PWA idempotency keys table.

Revision ID: 0007_phase5_offline_pwa_idempotency
Revises: 0006_phase4_community
Create Date: 2026-09-19 18:00:00.000000

Changes
-------
New tables:
  idempotency_keys
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007_phase5_offline_pwa_idempotency"
down_revision: str | None = "0006_phase4_community"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "idempotency_keys",
        sa.Column("key", sa.String(length=128), primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
            index=True,
        ),
        sa.Column("endpoint", sa.String(length=255), nullable=False),
        sa.Column("request_hash", sa.String(length=64), nullable=False, index=True),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("response_body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "expires_at",
            sa.DateTime(timezone=True),
            nullable=False,
            index=True,
        ),
    )
    op.create_index(
        "ix_idempotency_keys_key",
        "idempotency_keys",
        ["key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("ix_idempotency_keys_key", table_name="idempotency_keys")
    op.drop_table("idempotency_keys")
