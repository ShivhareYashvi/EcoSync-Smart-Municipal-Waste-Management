"""Add Phase 4 citizen engagement & community tables.

Revision ID: 0006_phase4_community
Revises: 0005_phase3_marketplace
Create Date: 2026-09-19 12:00:00.000000

Changes
-------
New tables (in FK dependency order):
  societies
  society_memberships
  leaderboard_opt_ins
  complaint_upvotes
  referrals

Column additions:
  users.locale_preference  (String(10), default='en', NOT NULL)
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0006_phase4_community"
down_revision: str | None = "0005_phase3_marketplace"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. societies ────────────────────────────────────────────────────
    op.create_table(
        "societies",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column(
            "zone_id",
            sa.Integer(),
            sa.ForeignKey("zones.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── 2. society_memberships ──────────────────────────────────────────
    op.create_table(
        "society_memberships",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "society_id",
            sa.Integer(),
            sa.ForeignKey("societies.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "role",
            sa.String(20),
            nullable=False,
            server_default="member",
        ),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="active",
        ),
        sa.Column("registration_doc_path", sa.String(512), nullable=True),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("user_id", "society_id", name="uq_society_membership_user_society"),
    )

    # ── 3. leaderboard_opt_ins ──────────────────────────────────────────
    op.create_table(
        "leaderboard_opt_ins",
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("opted_in", sa.Boolean(), nullable=False, server_default=sa.false_()),
        sa.Column("display_handle", sa.String(120), nullable=True),
        sa.Column("opted_in_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── 4. complaint_upvotes ────────────────────────────────────────────
    op.create_table(
        "complaint_upvotes",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "complaint_id",
            sa.Integer(),
            sa.ForeignKey("complaints.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("complaint_id", "user_id", name="uq_complaint_upvote_user"),
    )

    # ── 5. referrals ───────────────────────────────────────────────────
    op.create_table(
        "referrals",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column(
            "referrer_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "referred_user_id",
            sa.Integer(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("referral_code", sa.String(64), nullable=False, index=True),
        sa.Column(
            "status",
            sa.String(20),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("points_awarded", sa.Boolean(), nullable=False, server_default=sa.false_()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )

    # ── 6. Add users.locale_preference ─────────────────────────────────
    op.add_column(
        "users",
        sa.Column(
            "locale_preference",
            sa.String(10),
            nullable=False,
            server_default="en",
        ),
    )


def downgrade() -> None:
    op.drop_column("users", "locale_preference")
    op.drop_table("referrals")
    op.drop_table("complaint_upvotes")
    op.drop_table("leaderboard_opt_ins")
    op.drop_table("society_memberships")
    op.drop_table("societies")
