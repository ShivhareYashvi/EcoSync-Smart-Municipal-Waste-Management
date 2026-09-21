"""Tests for municipal operations data models and schema changes."""

from datetime import date, datetime, timezone

from sqlalchemy import select

from app.models.bulk_generator import BulkGenerator
from app.models.complaint import Complaint
from app.models.complaint_hotspot import ComplaintHotspot
from app.models.enums import (
    BillingStatus,
    BulkGeneratorCategory,
    ComplaintCategory,
    ComplaintStatus,
    FuelType,
    HotspotStatus,
    PickupStatus,
    RouteStatus,
    RouteStopStatus,
    UserRole,
    WasteType,
)
from app.models.pickup_request import PickupRequest
from app.models.route import Route, RouteStop
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.zone import Zone
from tests.conftest import TestingSessionLocal


def test_zone_creation_and_relationships(setup_db):
    """Test Zone table creation and bidirectional relationships."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        zone = Zone(name="Indiranagar Ward", code="BLR-W01", city="Bengaluru", created_at=now)
        session.add(zone)
        session.commit()
        session.refresh(zone)

        assert zone.id is not None
        assert zone.name == "Indiranagar Ward"
        assert zone.code == "BLR-W01"

        # Link a citizen user to this zone
        user = User(
            name="Zone Citizen",
            phone="+919876543201",
            password_hash="fakehash",
            role=UserRole.CITIZEN,
            address="100 Feet Rd, Indiranagar",
            zone_id=zone.id,
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        session.commit()
        session.refresh(zone)
        session.refresh(user)

        assert user.zone is not None
        assert user.zone.code == "BLR-W01"
        assert len(zone.users) == 1
        assert zone.users[0].phone == "+919876543201"


def test_vehicle_creation_and_driver_assignment(setup_db):
    """Test Vehicle creation, fuel type enum, and driver assignment."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        driver = User(
            name="Driver Ram",
            phone="+919876543202",
            password_hash="fakehash",
            role=UserRole.DRIVER,
            address="Depot 1",
            created_at=now,
            updated_at=now,
        )
        session.add(driver)
        session.commit()

        vehicle = Vehicle(
            registration_number="KA01AB1234",
            capacity_kg=2500.0,
            fuel_type=FuelType.ELECTRIC,
            maintenance_due_date=date(2026, 10, 15),
            assigned_driver_id=driver.id,
            active=True,
        )
        session.add(vehicle)
        session.commit()
        session.refresh(vehicle)
        session.refresh(driver)

        assert vehicle.id is not None
        assert vehicle.fuel_type == FuelType.ELECTRIC
        assert vehicle.assigned_driver.name == "Driver Ram"
        assert len(driver.assigned_vehicles) == 1
        assert driver.assigned_vehicles[0].registration_number == "KA01AB1234"


def test_bulk_generator_and_pickup_integration(setup_db):
    """Test BulkGenerator creation and pickup_requests integration."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        zone = Zone(name="Koramangala Ward", code="BLR-W02", city="Bengaluru", created_at=now)
        contact = User(
            name="Mall Manager",
            phone="+919876543203",
            password_hash="fakehash",
            role=UserRole.CITIZEN,
            address="Forum Mall, Koramangala",
            created_at=now,
            updated_at=now,
        )
        session.add_all([zone, contact])
        session.commit()

        bg = BulkGenerator(
            org_name="Forum Mall",
            category=BulkGeneratorCategory.MALL,
            address="Hosur Road, Koramangala",
            zone_id=zone.id,
            contact_user_id=contact.id,
            threshold_kg=200.0,
            billing_status=BillingStatus.ACTIVE,
            created_at=now,
        )
        session.add(bg)
        session.commit()
        session.refresh(bg)

        assert bg.id is not None
        assert bg.category == BulkGeneratorCategory.MALL
        assert bg.billing_status == BillingStatus.ACTIVE

        # Bulk generator pickup using pickup_requests table
        pickup = PickupRequest(
            user_id=contact.id,
            zone_id=zone.id,
            bulk_generator_id=bg.id,
            is_bulk_generator=True,
            waste_type=WasteType.DRY,
            status=PickupStatus.PENDING,
            scheduled_date=date(2026, 9, 20),
            scheduled_time=datetime.strptime("10:00:00", "%H:%M:%S").time(),
            created_at=now,
            updated_at=now,
        )
        session.add(pickup)
        session.commit()
        session.refresh(pickup)

        assert pickup.is_bulk_generator is True
        assert pickup.bulk_generator.org_name == "Forum Mall"
        assert pickup.zone.code == "BLR-W02"


def test_routes_and_route_stops(setup_db):
    """Test Route and RouteStop sequence order and statuses."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        zone = Zone(name="Whitefield Ward", code="BLR-W03", city="Bengaluru", created_at=now)
        driver = User(
            name="Route Driver",
            phone="+919876543204",
            password_hash="fakehash",
            role=UserRole.DRIVER,
            address="Whitefield Depot",
            created_at=now,
            updated_at=now,
        )
        citizen = User(
            name="Citizen One",
            phone="+919876543205",
            password_hash="fakehash",
            role=UserRole.CITIZEN,
            address="ITPL Main Rd",
            created_at=now,
            updated_at=now,
        )
        session.add_all([zone, driver, citizen])
        session.commit()

        pickup = PickupRequest(
            user_id=citizen.id,
            zone_id=zone.id,
            waste_type=WasteType.WET,
            status=PickupStatus.ASSIGNED,
            scheduled_date=date(2026, 9, 18),
            scheduled_time=datetime.strptime("09:00:00", "%H:%M:%S").time(),
            created_at=now,
            updated_at=now,
        )
        session.add(pickup)
        session.commit()

        route = Route(
            driver_id=driver.id,
            zone_id=zone.id,
            route_date=date(2026, 9, 18),
            status=RouteStatus.PLANNED,
            created_at=now,
        )
        session.add(route)
        session.commit()

        stop = RouteStop(
            route_id=route.id,
            pickup_id=pickup.id,
            sequence_order=1,
            status=RouteStopStatus.PENDING,
        )
        session.add(stop)
        session.commit()
        session.refresh(route)

        assert len(route.stops) == 1
        assert route.stops[0].sequence_order == 1
        assert route.stops[0].pickup_id == pickup.id
        assert route.stops[0].status == RouteStopStatus.PENDING


def test_complaint_zone_and_resolved_at(setup_db):
    """Test Complaint zone association and resolved_at column."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        zone = Zone(name="Jayanagar Ward", code="BLR-W04", city="Bengaluru", created_at=now)
        user = User(
            name="Complaint Citizen",
            phone="+919876543206",
            password_hash="fakehash",
            role=UserRole.CITIZEN,
            address="4th Block, Jayanagar",
            created_at=now,
            updated_at=now,
        )
        session.add_all([zone, user])
        session.commit()

        complaint = Complaint(
            user_id=user.id,
            zone_id=zone.id,
            category=ComplaintCategory.MISSED_PICKUP,
            description="Missed wet waste pickup this morning",
            status=ComplaintStatus.RESOLVED,
            resolved_at=now,
            created_at=now,
            updated_at=now,
        )
        session.add(complaint)
        session.commit()
        session.refresh(complaint)

        assert complaint.zone_id == zone.id
        assert complaint.resolved_at is not None
        assert complaint.zone.name == "Jayanagar Ward"


def test_complaint_hotspot(setup_db):
    """Test ComplaintHotspot table creation and fields."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        zone = Zone(name="HSR Layout Ward", code="BLR-W05", city="Bengaluru", created_at=now)
        session.add(zone)
        session.commit()

        hotspot = ComplaintHotspot(
            zone_id=zone.id,
            complaint_count=5,
            first_flagged_at=now,
            status=HotspotStatus.ACTIVE,
        )
        session.add(hotspot)
        session.commit()
        session.refresh(hotspot)

        assert hotspot.id is not None
        assert hotspot.complaint_count == 5
        assert hotspot.status == HotspotStatus.ACTIVE
        assert hotspot.zone.name == "HSR Layout Ward"
