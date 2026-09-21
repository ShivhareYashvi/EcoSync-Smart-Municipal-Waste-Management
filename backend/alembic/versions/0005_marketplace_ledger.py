"""Add marketplace mechanics (ledger-only) tables.

Revision ID: 0005_marketplace_ledger
Revises: 0004_operations_compliance
Create Date: 2026-09-18 10:00:00.000000

Changes
-------
New tables (in FK dependency order):
  recyclers
  recycler_rate_cards
  recycling_transactions
  recycling_receipts
  brand_accounts
  epr_credits
  compost_batches
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0005_marketplace_ledger"
down_revision: str | None = "0004_operations_compliance"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    #  1. Create recyclers table 
    op.create_table(
        "recyclers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=False),
        sa.Column("materials_accepted", sa.JSON(), nullable=False),
        sa.Column("service_zone_ids", sa.JSON(), nullable=False),
        sa.Column(
            "verification_status",
            sa.Enum("pending", "verified", "rejected", name="recyclerverificationstatus", native_enum=False),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("verification_doc_url", sa.String(length=512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", name="uq_recyclers_user_id"),
    )
    op.create_index(op.f("ix_recyclers_id"), "recyclers", ["id"], unique=False)
    op.create_index(op.f("ix_recyclers_user_id"), "recyclers", ["user_id"], unique=True)

    #  2. Create recycler_rate_cards table 
    op.create_table(
        "recycler_rate_cards",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("recycler_id", sa.Integer(), nullable=False),
        sa.Column(
            "material",
            sa.Enum("plastic", "paper", "metal", "e_waste", "glass", name="materialtype", native_enum=False),
            nullable=False,
        ),
        sa.Column("rate_per_kg", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["recycler_id"], ["recyclers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recycler_rate_cards_id"), "recycler_rate_cards", ["id"], unique=False)
    op.create_index(op.f("ix_recycler_rate_cards_recycler_id"), "recycler_rate_cards", ["recycler_id"], unique=False)

    #  3. Create recycling_transactions table ─
    op.create_table(
        "recycling_transactions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("citizen_id", sa.Integer(), nullable=False),
        sa.Column("recycler_id", sa.Integer(), nullable=False),
        sa.Column(
            "material",
            sa.Enum("plastic", "paper", "metal", "e_waste", "glass", name="materialtype", native_enum=False),
            nullable=False,
        ),
        sa.Column("estimated_weight_kg", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("weight_kg", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("rate_applied", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("amount_credited", sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column("photo_url", sa.String(length=512), nullable=True),
        sa.Column(
            "status",
            sa.Enum("requested", "logged", "confirmed", "disputed", name="recyclingtransactionstatus", native_enum=False),
            nullable=False,
            server_default="requested",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["citizen_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["recycler_id"], ["recyclers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_recycling_transactions_id"), "recycling_transactions", ["id"], unique=False)
    op.create_index(op.f("ix_recycling_transactions_citizen_id"), "recycling_transactions", ["citizen_id"], unique=False)
    op.create_index(op.f("ix_recycling_transactions_recycler_id"), "recycling_transactions", ["recycler_id"], unique=False)

    #  4. Create recycling_receipts table 
    op.create_table(
        "recycling_receipts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("transaction_id", sa.Integer(), nullable=False),
        sa.Column("receipt_number", sa.String(length=64), nullable=False),
        sa.Column(
            "material",
            sa.Enum("plastic", "paper", "metal", "e_waste", "glass", name="materialtype", native_enum=False),
            nullable=False,
        ),
        sa.Column("weight_kg", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("amount_credited", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column("issued_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["recycling_transactions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("receipt_number", name="uq_recycling_receipts_receipt_number"),
        sa.UniqueConstraint("transaction_id", name="uq_recycling_receipts_transaction_id"),
    )
    op.create_index(op.f("ix_recycling_receipts_id"), "recycling_receipts", ["id"], unique=False)
    op.create_index(op.f("ix_recycling_receipts_receipt_number"), "recycling_receipts", ["receipt_number"], unique=True)
    op.create_index(op.f("ix_recycling_receipts_transaction_id"), "recycling_receipts", ["transaction_id"], unique=True)

    #  5. Create brand_accounts table ─
    op.create_table(
        "brand_accounts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_name", sa.String(length=255), nullable=False),
        sa.Column("contact_email", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_brand_accounts_id"), "brand_accounts", ["id"], unique=False)

    #  6. Create epr_credits table ─
    op.create_table(
        "epr_credits",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("receipt_id", sa.Integer(), nullable=False),
        sa.Column("credit_amount", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("available", "claimed", name="eprcreditstatus", native_enum=False),
            nullable=False,
            server_default="available",
        ),
        sa.Column("brand_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["brand_id"], ["brand_accounts.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["receipt_id"], ["recycling_receipts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("receipt_id", name="uq_epr_credits_receipt_id"),
    )
    op.create_index(op.f("ix_epr_credits_id"), "epr_credits", ["id"], unique=False)
    op.create_index(op.f("ix_epr_credits_receipt_id"), "epr_credits", ["receipt_id"], unique=True)
    op.create_index(op.f("ix_epr_credits_brand_id"), "epr_credits", ["brand_id"], unique=False)

    #  7. Create compost_batches table ─
    op.create_table(
        "compost_batches",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("zone_id", sa.Integer(), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("total_weight_kg", sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column(
            "status",
            sa.Enum("collected", "composting", "completed", name="compostbatchstatus", native_enum=False),
            nullable=False,
            server_default="collected",
        ),
        sa.Column("buyer_note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["zone_id"], ["zones.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_compost_batches_id"), "compost_batches", ["id"], unique=False)
    op.create_index(op.f("ix_compost_batches_zone_id"), "compost_batches", ["zone_id"], unique=False)


def downgrade() -> None:
    # Drop tables in reverse FK dependency order
    op.drop_index(op.f("ix_compost_batches_zone_id"), table_name="compost_batches")
    op.drop_index(op.f("ix_compost_batches_id"), table_name="compost_batches")
    op.drop_table("compost_batches")

    op.drop_index(op.f("ix_epr_credits_brand_id"), table_name="epr_credits")
    op.drop_index(op.f("ix_epr_credits_receipt_id"), table_name="epr_credits")
    op.drop_index(op.f("ix_epr_credits_id"), table_name="epr_credits")
    op.drop_table("epr_credits")

    op.drop_index(op.f("ix_brand_accounts_id"), table_name="brand_accounts")
    op.drop_table("brand_accounts")

    op.drop_index(op.f("ix_recycling_receipts_transaction_id"), table_name="recycling_receipts")
    op.drop_index(op.f("ix_recycling_receipts_receipt_number"), table_name="recycling_receipts")
    op.drop_index(op.f("ix_recycling_receipts_id"), table_name="recycling_receipts")
    op.drop_table("recycling_receipts")

    op.drop_index(op.f("ix_recycling_transactions_recycler_id"), table_name="recycling_transactions")
    op.drop_index(op.f("ix_recycling_transactions_citizen_id"), table_name="recycling_transactions")
    op.drop_index(op.f("ix_recycling_transactions_id"), table_name="recycling_transactions")
    op.drop_table("recycling_transactions")

    op.drop_index(op.f("ix_recycler_rate_cards_recycler_id"), table_name="recycler_rate_cards")
    op.drop_index(op.f("ix_recycler_rate_cards_id"), table_name="recycler_rate_cards")
    op.drop_table("recycler_rate_cards")

    op.drop_index(op.f("ix_recyclers_user_id"), table_name="recyclers")
    op.drop_index(op.f("ix_recyclers_id"), table_name="recyclers")
    op.drop_table("recyclers")
