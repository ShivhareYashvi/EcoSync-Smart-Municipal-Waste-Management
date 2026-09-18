"""Add Phase 2 municipal operations, zones, fleet, bulk generators, and routes.

Revision ID: 0004_phase2_operations_compliance
Revises: 0003_phase1_collection_loop
Create Date: 2026-09-17 09:30:00.000000

Changes
-------
New tables (in FK dependency order):
  zones
  vehicles
  bulk_generators
  routes
  route_stops
  complaint_hotspots

Column additions:
  users:
    zone_id (FK zones, nullable)
  pickup_requests:
    zone_id (FK zones, nullable)
    route_id (FK routes, nullable)
    bulk_generator_id (FK bulk_generators, nullable)
    is_bulk_generator (Boolean, default False)
  complaints:
    zone_id (FK zones, nullable)
    resolved_at (DateTime, nullable)
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004_phase2_operations_compliance"
down_revision: str | None = "0003_phase1_collection_loop"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # ── 1. Create zones table ────────────────────
    op.create_table(
        "zones",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("code", sa.String(length=40), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_zones_code"),
    )
    op.create_index(op.f("ix_zones_id"), "zones", ["id"], unique=False)
    op.create_index(op.f("ix_zones_code"), "zones", ["code"], unique=True)

    # ── 2. Create vehicles table ─────────────────
    op.create_table(
        "vehicles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("registration_number", sa.String(length=40), nullable=False),
        sa.Column("capacity_kg", sa.Float(), nullable=False),
        sa.Column(
            "fuel_type",
            sa.Enum("diesel", "cng", "electric", "petrol", name="fueltype", native_enum=False),
            nullable=False,
        ),
        sa.Column("maintenance_due_date", sa.Date(), nullable=False),
        sa.Column("assigned_driver_id", sa.Integer(), nullable=True),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.ForeignKeyConstraint(["assigned_driver_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("registration_number", name="uq_vehicles_registration_number"),
    )
    op.create_index(op.f("ix_vehicles_id"), "vehicles", ["id"], unique=False)
    op.create_index(op.f("ix_vehicles_registration_number"), "vehicles", ["registration_number"], unique=True)
    op.create_index(op.f("ix_vehicles_assigned_driver_id"), "vehicles", ["assigned_driver_id"], unique=False)
    op.create_index(op.f("ix_vehicles_maintenance_due_date"), "vehicles", ["maintenance_due_date"], unique=False)

    # ── 3. Create bulk_generators table ──────────
    op.create_table(
        "bulk_generators",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("org_name", sa.String(length=255), nullable=False),
        sa.Column(
            "category",
            sa.Enum("hotel", "mall", "apartment_complex", "office", "other", name="bulkgeneratorcategory", native_enum=False),
            nullable=False,
        ),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("zone_id", sa.Integer(), nullable=False),
        sa.Column("contact_user_id", sa.Integer(), nullable=False),
        sa.Column("threshold_kg", sa.Float(), nullable=False, server_default="100.0"),
        sa.Column(
            "billing_status",
            sa.Enum("active", "suspended", name="billingstatus", native_enum=False),
            nullable=False,
            server_default="active",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["zone_id"], ["zones.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["contact_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_bulk_generators_id"), "bulk_generators", ["id"], unique=False)
    op.create_index(op.f("ix_bulk_generators_zone_id"), "bulk_generators", ["zone_id"], unique=False)
    op.create_index(op.f("ix_bulk_generators_contact_user_id"), "bulk_generators", ["contact_user_id"], unique=False)

    # ── 4. Create routes table ───────────────────
    op.create_table(
        "routes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("driver_id", sa.Integer(), nullable=False),
        sa.Column("vehicle_id", sa.Integer(), nullable=True),
        sa.Column("zone_id", sa.Integer(), nullable=False),
        sa.Column("route_date", sa.Date(), nullable=False),
        sa.Column(
            "status",
            sa.Enum("planned", "in_progress", "completed", name="routestatus", native_enum=False),
            nullable=False,
            server_default="planned",
        ),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["driver_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["vehicle_id"], ["vehicles.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["zone_id"], ["zones.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_routes_id"), "routes", ["id"], unique=False)
    op.create_index(op.f("ix_routes_driver_id"), "routes", ["driver_id"], unique=False)
    op.create_index(op.f("ix_routes_vehicle_id"), "routes", ["vehicle_id"], unique=False)
    op.create_index(op.f("ix_routes_zone_id"), "routes", ["zone_id"], unique=False)
    op.create_index(op.f("ix_routes_route_date"), "routes", ["route_date"], unique=False)

    # ── 5. Create route_stops table ──────────────
    op.create_table(
        "route_stops",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("route_id", sa.Integer(), nullable=False),
        sa.Column("pickup_id", sa.Integer(), nullable=False),
        sa.Column("sequence_order", sa.Integer(), nullable=False),
        sa.Column("estimated_arrival", sa.DateTime(timezone=True), nullable=True),
        sa.Column("actual_arrival", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "status",
            sa.Enum("pending", "arrived", "skipped", name="routestopstatus", native_enum=False),
            nullable=False,
            server_default="pending",
        ),
        sa.ForeignKeyConstraint(["route_id"], ["routes.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["pickup_id"], ["pickup_requests.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_route_stops_id"), "route_stops", ["id"], unique=False)
    op.create_index(op.f("ix_route_stops_route_id"), "route_stops", ["route_id"], unique=False)
    op.create_index(op.f("ix_route_stops_pickup_id"), "route_stops", ["pickup_id"], unique=False)

    # ── 6. Create complaint_hotspots table ──────
    op.create_table(
        "complaint_hotspots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("zone_id", sa.Integer(), nullable=False),
        sa.Column("complaint_count", sa.Integer(), nullable=False),
        sa.Column("first_flagged_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column(
            "status",
            sa.Enum("active", "resolved", name="hotspotstatus", native_enum=False),
            nullable=False,
            server_default="active",
        ),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["zone_id"], ["zones.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_complaint_hotspots_id"), "complaint_hotspots", ["id"], unique=False)
    op.create_index(op.f("ix_complaint_hotspots_zone_id"), "complaint_hotspots", ["zone_id"], unique=False)

    # ── 7. Extend users table ────────────────────
    op.add_column("users", sa.Column("zone_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_users_zone_id_zones",
        "users",
        "zones",
        ["zone_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_users_zone_id"), "users", ["zone_id"], unique=False)

    # ── 8. Extend pickup_requests table ──────────
    op.add_column("pickup_requests", sa.Column("zone_id", sa.Integer(), nullable=True))
    op.add_column("pickup_requests", sa.Column("route_id", sa.Integer(), nullable=True))
    op.add_column("pickup_requests", sa.Column("bulk_generator_id", sa.Integer(), nullable=True))
    op.add_column(
        "pickup_requests",
        sa.Column("is_bulk_generator", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_foreign_key(
        "fk_pickup_requests_zone_id_zones",
        "pickup_requests",
        "zones",
        ["zone_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_pickup_requests_route_id_routes",
        "pickup_requests",
        "routes",
        ["route_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_foreign_key(
        "fk_pickup_requests_bulk_generator_id_bulk_generators",
        "pickup_requests",
        "bulk_generators",
        ["bulk_generator_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_pickup_requests_zone_id"), "pickup_requests", ["zone_id"], unique=False)
    op.create_index(op.f("ix_pickup_requests_route_id"), "pickup_requests", ["route_id"], unique=False)
    op.create_index(op.f("ix_pickup_requests_bulk_generator_id"), "pickup_requests", ["bulk_generator_id"], unique=False)

    # ── 9. Extend complaints table ───────────────
    op.add_column("complaints", sa.Column("zone_id", sa.Integer(), nullable=True))
    op.add_column("complaints", sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True))
    op.create_foreign_key(
        "fk_complaints_zone_id_zones",
        "complaints",
        "zones",
        ["zone_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_complaints_zone_id"), "complaints", ["zone_id"], unique=False)


def downgrade() -> None:
    # ── 1. Revert complaints column additions ────
    op.drop_constraint("fk_complaints_zone_id_zones", "complaints", type_="foreignkey")
    op.drop_index(op.f("ix_complaints_zone_id"), table_name="complaints")
    op.drop_column("complaints", "resolved_at")
    op.drop_column("complaints", "zone_id")

    # ── 2. Revert pickup_requests column additions ─────────────────────────────
    op.drop_constraint("fk_pickup_requests_bulk_generator_id_bulk_generators", "pickup_requests", type_="foreignkey")
    op.drop_constraint("fk_pickup_requests_route_id_routes", "pickup_requests", type_="foreignkey")
    op.drop_constraint("fk_pickup_requests_zone_id_zones", "pickup_requests", type_="foreignkey")
    op.drop_index(op.f("ix_pickup_requests_bulk_generator_id"), table_name="pickup_requests")
    op.drop_index(op.f("ix_pickup_requests_route_id"), table_name="pickup_requests")
    op.drop_index(op.f("ix_pickup_requests_zone_id"), table_name="pickup_requests")
    op.drop_column("pickup_requests", "is_bulk_generator")
    op.drop_column("pickup_requests", "bulk_generator_id")
    op.drop_column("pickup_requests", "route_id")
    op.drop_column("pickup_requests", "zone_id")

    # ── 3. Revert users column additions ─────────
    op.drop_constraint("fk_users_zone_id_zones", "users", type_="foreignkey")
    op.drop_index(op.f("ix_users_zone_id"), table_name="users")
    op.drop_column("users", "zone_id")

    # ── 4. Drop tables in reverse order ──────────
    op.drop_index(op.f("ix_complaint_hotspots_zone_id"), table_name="complaint_hotspots")
    op.drop_index(op.f("ix_complaint_hotspots_id"), table_name="complaint_hotspots")
    op.drop_table("complaint_hotspots")

    op.drop_index(op.f("ix_route_stops_pickup_id"), table_name="route_stops")
    op.drop_index(op.f("ix_route_stops_route_id"), table_name="route_stops")
    op.drop_index(op.f("ix_route_stops_id"), table_name="route_stops")
    op.drop_table("route_stops")

    op.drop_index(op.f("ix_routes_route_date"), table_name="routes")
    op.drop_index(op.f("ix_routes_zone_id"), table_name="routes")
    op.drop_index(op.f("ix_routes_vehicle_id"), table_name="routes")
    op.drop_index(op.f("ix_routes_driver_id"), table_name="routes")
    op.drop_index(op.f("ix_routes_id"), table_name="routes")
    op.drop_table("routes")

    op.drop_index(op.f("ix_bulk_generators_contact_user_id"), table_name="bulk_generators")
    op.drop_index(op.f("ix_bulk_generators_zone_id"), table_name="bulk_generators")
    op.drop_index(op.f("ix_bulk_generators_id"), table_name="bulk_generators")
    op.drop_table("bulk_generators")

    op.drop_index(op.f("ix_vehicles_maintenance_due_date"), table_name="vehicles")
    op.drop_index(op.f("ix_vehicles_assigned_driver_id"), table_name="vehicles")
    op.drop_index(op.f("ix_vehicles_registration_number"), table_name="vehicles")
    op.drop_index(op.f("ix_vehicles_id"), table_name="vehicles")
    op.drop_table("vehicles")

    op.drop_index(op.f("ix_zones_code"), table_name="zones")
    op.drop_index(op.f("ix_zones_id"), table_name="zones")
    op.drop_table("zones")
