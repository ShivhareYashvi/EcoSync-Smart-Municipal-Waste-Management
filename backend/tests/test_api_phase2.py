"""API integration tests for Phase 2 endpoints — happy path + one failure case each."""

from __future__ import annotations

from datetime import date, datetime, time, timezone

import pytest
from fastapi.testclient import TestClient

from tests.conftest import TestingSessionLocal, test_engine


@pytest.fixture()
def client(setup_db):
    """FastAPI TestClient with DB override and Phase 2 seed data."""
    from app.main import app
    from app.db import get_db

    def override_get_db():
        with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestingSessionLocal() as session:
        _seed_db(session)

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c

    app.dependency_overrides.clear()


# ── Seed helpers ─────────────────────────────────────────────────────────────

def _seed_db(session) -> None:
    from datetime import datetime, timezone
    from app.core.security import hash_password
    from app.models.user import User
    from app.models.driver import Driver
    from app.models.zone import Zone
    from app.models.pickup_request import PickupRequest
    from app.models.enums import (
        DriverAvailability, PickupStatus, UserRole, WasteType,
    )

    now = datetime.now(timezone.utc)

    zone = Zone(name="Indiranagar Ward", code="BLR-W01", city="Bengaluru", created_at=now)
    session.add(zone)
    session.flush()

    admin = User(
        id=1, name="Admin User", phone="+910000000001",
        email="admin@test.com", password_hash=hash_password("password123"),
        role=UserRole.ADMIN, address="Admin HQ", verified=True,
        zone_id=zone.id, created_at=now, updated_at=now,
    )
    citizen = User(
        id=2, name="Citizen User", phone="+910000000002",
        email="citizen@test.com", password_hash=hash_password("password123"),
        role=UserRole.CITIZEN, address="123 Indiranagar", verified=True,
        zone_id=zone.id, created_at=now, updated_at=now,
    )
    driver_user = User(
        id=3, name="Driver User", phone="+910000000003",
        email="driver@test.com", password_hash=hash_password("password123"),
        role=UserRole.DRIVER, address="Depot Rd", verified=True,
        zone_id=zone.id, created_at=now, updated_at=now,
    )
    session.add_all([admin, citizen, driver_user])
    session.flush()

    driver = Driver(
        user_id=driver_user.id,
        vehicle_number="KA01ZZ0000",
        availability=DriverAvailability.AVAILABLE,
        created_at=now, updated_at=now,
    )
    session.add(driver)

    # Pickup with coordinates
    pickup = PickupRequest(
        id=1, user_id=citizen.id,
        zone_id=zone.id,
        waste_type=WasteType.WET, status=PickupStatus.PENDING,
        scheduled_date=date.today(), scheduled_time=time(9, 0),
        coordinates={"latitude": 12.9784, "longitude": 77.6408},
        created_at=now, updated_at=now,
    )
    session.add(pickup)
    session.commit()

    # Store zone_id globally for tests
    session._zone_id = zone.id


def _login(client: TestClient, phone: str = "+910000000001", password: str = "password123") -> str:
    resp = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Zone tests ────────────────────────────────────────────────────────────────

class TestZones:
    def test_list_zones_returns_seeded(self, client):
        token = _login(client)
        resp = client.get("/api/v1/zones", headers=_auth(token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert any(z["code"] == "BLR-W01" for z in data)

    def test_assign_user_zone(self, client):
        token = _login(client)
        # Get zone id first
        zones_resp = client.get("/api/v1/zones", headers=_auth(token))
        zone_id = zones_resp.json()[0]["id"]
        resp = client.patch("/api/v1/zones/users/2/zone", json={"zone_id": zone_id}, headers=_auth(token))
        assert resp.status_code == 200
        assert resp.json()["zone_id"] == zone_id

    def test_assign_nonexistent_zone_returns_404(self, client):
        token = _login(client)
        resp = client.patch("/api/v1/zones/users/2/zone", json={"zone_id": 9999}, headers=_auth(token))
        assert resp.status_code == 404


# ── Vehicle tests ─────────────────────────────────────────────────────────────

class TestVehicles:
    def test_create_and_list_vehicle(self, client):
        token = _login(client)
        payload = {
            "registration_number": "KA01AB9999",
            "capacity_kg": 2000.0,
            "fuel_type": "electric",
            "maintenance_due_date": "2026-12-01",
        }
        create_resp = client.post("/api/v1/vehicles", json=payload, headers=_auth(token))
        assert create_resp.status_code == 201
        vehicle = create_resp.json()
        assert vehicle["registration_number"] == "KA01AB9999"
        assert vehicle["fuel_type"] == "electric"

        list_resp = client.get("/api/v1/vehicles", headers=_auth(token))
        assert list_resp.status_code == 200
        assert any(v["registration_number"] == "KA01AB9999" for v in list_resp.json())

    def test_duplicate_registration_returns_409(self, client):
        token = _login(client)
        payload = {
            "registration_number": "KA01DUP001",
            "capacity_kg": 1000.0,
            "fuel_type": "cng",
            "maintenance_due_date": "2026-11-01",
        }
        client.post("/api/v1/vehicles", json=payload, headers=_auth(token))
        resp = client.post("/api/v1/vehicles", json=payload, headers=_auth(token))
        assert resp.status_code == 409

    def test_maintenance_status(self, client):
        token = _login(client)
        import datetime
        due_soon = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
        v_resp = client.post("/api/v1/vehicles", json={
            "registration_number": "KA01MNT001",
            "capacity_kg": 1500.0,
            "fuel_type": "diesel",
            "maintenance_due_date": due_soon,
        }, headers=_auth(token))
        v_id = v_resp.json()["id"]
        resp = client.get(f"/api/v1/vehicles/{v_id}/maintenance", headers=_auth(token))
        assert resp.status_code == 200
        assert resp.json()["days_until_due"] <= 7


# ── Bulk generator tests ──────────────────────────────────────────────────────

class TestBulkGenerators:
    def test_register_and_list(self, client):
        token = _login(client)
        zones = client.get("/api/v1/zones", headers=_auth(token)).json()
        zone_id = zones[0]["id"]

        payload = {
            "org_name": "Grand Hotel",
            "category": "hotel",
            "address": "100 MG Road, Bengaluru",
            "zone_id": zone_id,
            "contact_user_id": 2,
            "threshold_kg": 150.0,
        }
        create_resp = client.post("/api/v1/bulk-generators/register", json=payload, headers=_auth(token))
        assert create_resp.status_code == 201
        bg = create_resp.json()
        assert bg["org_name"] == "Grand Hotel"
        assert bg["billing_status"] == "active"

        list_resp = client.get(f"/api/v1/bulk-generators?zone_id={zone_id}", headers=_auth(token))
        assert list_resp.status_code == 200
        assert any(b["org_name"] == "Grand Hotel" for b in list_resp.json())

    def test_duplicate_address_returns_409(self, client):
        token = _login(client)
        zones = client.get("/api/v1/zones", headers=_auth(token)).json()
        zone_id = zones[0]["id"]
        payload = {
            "org_name": "Duplicate Mall",
            "category": "mall",
            "address": "999 Duplicate Rd",
            "zone_id": zone_id,
            "contact_user_id": 2,
        }
        client.post("/api/v1/bulk-generators/register", json=payload, headers=_auth(token))
        resp = client.post("/api/v1/bulk-generators/register", json=payload, headers=_auth(token))
        assert resp.status_code == 409


# ── Route generation tests ────────────────────────────────────────────────────

class TestRouteGeneration:
    def test_generate_route_with_eligible_pickup(self, client):
        token = _login(client)
        zones = client.get("/api/v1/zones", headers=_auth(token)).json()
        zone_id = zones[0]["id"]
        import datetime
        payload = {
            "driver_id": 3,
            "zone_id": zone_id,
            "route_date": datetime.date.today().isoformat(),
        }
        resp = client.post("/api/v1/routes/generate", json=payload, headers=_auth(token))
        assert resp.status_code == 201
        route = resp.json()
        assert route["driver_id"] == 3
        assert len(route["stops"]) >= 1
        assert route["stops"][0]["sequence_order"] == 1

    def test_generate_route_no_eligible_pickups_returns_422(self, client):
        token = _login(client)
        zones = client.get("/api/v1/zones", headers=_auth(token)).json()
        zone_id = zones[0]["id"]
        import datetime
        # Use a future date with no pickups
        future_date = (datetime.date.today() + datetime.timedelta(days=365)).isoformat()
        payload = {
            "driver_id": 3,
            "zone_id": zone_id,
            "route_date": future_date,
        }
        resp = client.post("/api/v1/routes/generate", json=payload, headers=_auth(token))
        assert resp.status_code == 422

    def test_driver_can_update_stop_status(self, client):
        """Driver marks a stop as arrived."""
        token = _login(client)
        zones = client.get("/api/v1/zones", headers=_auth(token)).json()
        zone_id = zones[0]["id"]
        import datetime
        gen_resp = client.post("/api/v1/routes/generate", json={
            "driver_id": 3,
            "zone_id": zone_id,
            "route_date": datetime.date.today().isoformat(),
        }, headers=_auth(token))
        assert gen_resp.status_code == 201
        route = gen_resp.json()
        route_id = route["id"]
        stop_id = route["stops"][0]["id"]

        update_resp = client.patch(
            f"/api/v1/routes/{route_id}/stops/{stop_id}/status",
            json={"status": "arrived"},
            headers=_auth(token),
        )
        assert update_resp.status_code == 200
        updated_route = update_resp.json()
        updated_stop = next(s for s in updated_route["stops"] if s["id"] == stop_id)
        assert updated_stop["status"] == "arrived"


# ── Complaint heatmap tests ───────────────────────────────────────────────────

class TestComplaintHeatmap:
    def test_heatmap_returns_valid_structure(self, client):
        token = _login(client)
        resp = client.get("/api/v1/complaints/heatmap", headers=_auth(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "points" in data
        assert isinstance(data["points"], list)
