"""Add Phase 1 collection-loop columns and reward tables.

Revision ID: 0003_phase1_collection_loop
Revises: 0002_tracking_uploads_otp
Create Date: 2026-09-17 02:20:00.000000

Changes
-------
pickup_requests:
  ADD COLUMNS: weight_kg, waste_category, segregation_verified, photo_url

New tables (in FK dependency order):
  points_transactions
  user_tiers
  redemption_catalog
  redemptions
  compliance_scores

Seed data:
  3 placeholder rows in redemption_catalog
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003_phase1_collection_loop"
down_revision: str | None = "0002_tracking_uploads_otp"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. Extend pickup_requests ───────────────
    op.add_column("pickup_requests", sa.Column("weight_kg", sa.Float(), nullable=True))
    op.add_column(
        "pickup_requests",
        sa.Column(
            "waste_category",
            sa.Enum(
                "wet", "dry", "hazardous", "e_waste", "mixed",
                name="wastecategory",
                native_enum=False,
            ),
            nullable=True,
        ),
    )
    op.add_column(
        "pickup_requests",
        sa.Column("segregation_verified", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.add_column("pickup_requests", sa.Column("photo_url", sa.String(length=512), nullable=True))

    # ── 2. points_transactions ──────────────────
    op.create_table(
        "points_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("pickup_id", sa.Integer(), nullable=True),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=255), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "pending", "approved", "flagged",
                name="pointstransactionstatus",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["pickup_id"], ["pickup_requests.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_points_transactions_id"), "points_transactions", ["id"], unique=False)
    op.create_index(op.f("ix_points_transactions_user_id"), "points_transactions", ["user_id"], unique=False)
    op.create_index(op.f("ix_points_transactions_pickup_id"), "points_transactions", ["pickup_id"], unique=False)

    # ── 3. user_tiers ───────────────────────────
    op.create_table(
        "user_tiers",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column(
            "current_tier",
            sa.Enum("bronze", "silver", "gold", name="usertier", native_enum=False),
            nullable=False,
        ),
        sa.Column("points_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("points_lifetime", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("flags_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("tier_updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # ── 4. redemption_catalog ───────────────────
    op.create_table(
        "redemption_catalog",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("item_name", sa.String(length=255), nullable=False),
        sa.Column("points_cost", sa.Integer(), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "utility_credit", "service_perk", "voucher",
                name="catalogcategory",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_redemption_catalog_id"), "redemption_catalog", ["id"], unique=False)

    # ── 5. redemptions ──────────────────────────
    op.create_table(
        "redemptions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("catalog_item_id", sa.Integer(), nullable=True),
        sa.Column("points_spent", sa.Integer(), nullable=False),
        sa.Column(
            "status",
            sa.Enum(
                "requested", "fulfilled", "cancelled",
                name="redemptionstatus",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["catalog_item_id"], ["redemption_catalog.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_redemptions_id"), "redemptions", ["id"], unique=False)
    op.create_index(op.f("ix_redemptions_user_id"), "redemptions", ["user_id"], unique=False)
    op.create_index(op.f("ix_redemptions_catalog_item_id"), "redemptions", ["catalog_item_id"], unique=False)

    # ── 6. compliance_scores ────────────────────
    op.create_table(
        "compliance_scores",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("rolling_score", sa.Float(), nullable=False, server_default="0"),
        sa.Column("total_pickups", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("verified_pickups", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id"),
    )

    # ── 7. Seed redemption_catalog with 3 placeholder items ──────────────────
    catalog = sa.table(
        "redemption_catalog",
        sa.column("item_name", sa.String),
        sa.column("points_cost", sa.Integer),
        sa.column("category", sa.String),
        sa.column("active", sa.Boolean),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )
    now = sa.func.now()
    op.bulk_insert(
        catalog,
        [
            {
                "item_name": "₹50 Utility Bill Credit",
                "points_cost": 500,
                "category": "utility_credit",
                "active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "item_name": "Priority Pickup Slot (next week)",
                "points_cost": 300,
                "category": "service_perk",
                "active": True,
                "created_at": now,
                "updated_at": now,
            },
            {
                "item_name": "₹25 Local Store Voucher",
                "points_cost": 250,
                "category": "voucher",
                "active": True,
                "created_at": now,
                "updated_at": now,
            },
        ],
    )


def downgrade() -> None:
    # Remove seed data first (cascade via FK is fine since we drop tables)

    # ── Reverse table drops (in reverse creation order) ───────────────────────
    op.drop_table("compliance_scores")

    op.drop_index(op.f("ix_redemptions_catalog_item_id"), table_name="redemptions")
    op.drop_index(op.f("ix_redemptions_user_id"), table_name="redemptions")
    op.drop_index(op.f("ix_redemptions_id"), table_name="redemptions")
    op.drop_table("redemptions")

    op.drop_index(op.f("ix_redemption_catalog_id"), table_name="redemption_catalog")
    op.drop_table("redemption_catalog")

    op.drop_table("user_tiers")

    op.drop_index(op.f("ix_points_transactions_pickup_id"), table_name="points_transactions")
    op.drop_index(op.f("ix_points_transactions_user_id"), table_name="points_transactions")
    op.drop_index(op.f("ix_points_transactions_id"), table_name="points_transactions")
    op.drop_table("points_transactions")

    # ── Reverse pickup_requests column additions ─
    op.drop_column("pickup_requests", "photo_url")
    op.drop_column("pickup_requests", "segregation_verified")
    op.drop_column("pickup_requests", "waste_category")
    op.drop_column("pickup_requests", "weight_kg")
