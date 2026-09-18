"""API integration tests for Phase 1 endpoints.

Uses an in-memory SQLite database via the conftest.py DATABASE_URL override.
Each test gets a fresh schema via the autouse setup_db fixture.
"""

from __future__ import annotations

from datetime import date, datetime, time, timezone

import pytest
from fastapi.testclient import TestClient

from tests.conftest import TestingSessionLocal, test_engine


@pytest.fixture()
def client(setup_db):
    """FastAPI TestClient with DB override and seeded test data."""
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


# ── Seed helpers ──

def _seed_db(session) -> None:
    from app.core.security import hash_password
    from app.models.user import User
    from app.models.driver import Driver
    from app.models.pickup_request import PickupRequest
    from app.models.redemption_catalog import RedemptionCatalog
    from app.models.enums import (
        CatalogCategory, DriverAvailability, PickupStatus, UserRole, WasteType,
    )

    now = datetime.now(timezone.utc)

    citizen = User(
        id=1, name="Test Citizen", phone="+911234567890",
        email="citizen@test.com", password_hash=hash_password("password123"),
        role=UserRole.CITIZEN, address="123 Test Street", verified=True,
        created_at=now, updated_at=now,
    )
    driver_user = User(
        id=2, name="Test Driver", phone="+919876543210",
        email="driver@test.com", password_hash=hash_password("password123"),
        role=UserRole.DRIVER, address="456 Driver Lane", verified=True,
        created_at=now, updated_at=now,
    )
    session.add_all([citizen, driver_user])
    session.flush()

    driver = Driver(
        id=1, user_id=2, vehicle_number="MH01AB1234",
        availability=DriverAvailability.AVAILABLE,
        created_at=now, updated_at=now,
    )
    session.add(driver)
    session.flush()

    completed_pickup = PickupRequest(
        id=1, user_id=1, driver_id=1,
        waste_type=WasteType.DRY,
        status=PickupStatus.COMPLETED,
        scheduled_date=date.today(), scheduled_time=time(10, 0),
        created_at=now, updated_at=now,
    )
    pending_pickup = PickupRequest(
        id=2, user_id=1, driver_id=1,
        waste_type=WasteType.WET,
        status=PickupStatus.PENDING,
        scheduled_date=date.today(), scheduled_time=time(11, 0),
        created_at=now, updated_at=now,
    )
    session.add_all([completed_pickup, pending_pickup])

    catalog_item = RedemptionCatalog(
        id=1, item_name="Test Voucher", points_cost=50,
        category=CatalogCategory.VOUCHER, active=True,
        created_at=now, updated_at=now,
    )
    session.add(catalog_item)
    session.commit()


def _get_token(client: TestClient, phone: str = "+911234567890") -> str:
    resp = client.post("/api/v1/auth/login", json={"phone": phone, "password": "password123"})
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


def _auth(client: TestClient, phone: str = "+911234567890") -> dict:
    return {"Authorization": f"Bearer {_get_token(client, phone)}"}


# ── POST /pickups/{id}/log ──────────────────────

class TestLogPickup:
    def test_happy_path_with_photo(self, client: TestClient) -> None:
        headers = _auth(client, "+919876543210")
        resp = client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 12.5, "waste_category": "dry", "photo_url": "pickup-photos/abc.jpg"},
            headers=headers,
        )
        assert resp.status_code == 200, resp.text
        data = resp.json()
        assert data["weight_kg"] == 12.5
        assert data["waste_category"] == "dry"
        assert data["segregation_verified"] is True

    def test_happy_path_without_photo(self, client: TestClient) -> None:
        headers = _auth(client, "+919876543210")
        resp = client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 5.0, "waste_category": "wet"},
            headers=headers,
        )
        assert resp.status_code == 200
        assert resp.json()["segregation_verified"] is False

    def test_non_completed_pickup_rejected(self, client: TestClient) -> None:
        headers = _auth(client, "+919876543210")
        resp = client.post(
            "/api/v1/pickups/2/log",
            json={"weight_kg": 5.0, "waste_category": "wet"},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "completed" in resp.json()["detail"].lower()

    def test_weight_zero_rejected(self, client: TestClient) -> None:
        headers = _auth(client, "+919876543210")
        resp = client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 0, "waste_category": "dry"},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_weight_above_ceiling_rejected(self, client: TestClient) -> None:
        headers = _auth(client, "+919876543210")
        resp = client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 500, "waste_category": "dry"},
            headers=headers,
        )
        assert resp.status_code == 422

    def test_missing_pickup_returns_404(self, client: TestClient) -> None:
        headers = _auth(client, "+919876543210")
        resp = client.post(
            "/api/v1/pickups/9999/log",
            json={"weight_kg": 5.0, "waste_category": "dry"},
            headers=headers,
        )
        assert resp.status_code == 404


# ── POST /pickups/{id}/confirm ──────────────────

class TestConfirmPickup:
    def _log(self, client):
        client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 10.0, "waste_category": "dry", "photo_url": "p.jpg"},
            headers=_auth(client, "+919876543210"),
        )

    def test_happy_path(self, client: TestClient) -> None:
        self._log(client)
        resp = client.post("/api/v1/pickups/1/confirm", headers=_auth(client))
        assert resp.status_code == 200

    def test_missing_pickup_returns_404(self, client: TestClient) -> None:
        resp = client.post("/api/v1/pickups/9999/confirm", headers=_auth(client))
        assert resp.status_code == 404


# ── POST /pickups/{id}/dispute ──────────────────

class TestDisputePickup:
    def _log(self, client):
        client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 10.0, "waste_category": "dry", "photo_url": "p.jpg"},
            headers=_auth(client, "+919876543210"),
        )

    def test_happy_path(self, client: TestClient) -> None:
        self._log(client)
        resp = client.post(
            "/api/v1/pickups/1/dispute",
            json={"reason": "The weight logged is incorrect"},
            headers=_auth(client),
        )
        assert resp.status_code == 200

    def test_dispute_without_log_rejected(self, client: TestClient) -> None:
        resp = client.post(
            "/api/v1/pickups/1/dispute",
            json={"reason": "Something seems wrong here"},
            headers=_auth(client),
        )
        assert resp.status_code == 400

    def test_missing_pickup_returns_404(self, client: TestClient) -> None:
        resp = client.post(
            "/api/v1/pickups/9999/dispute",
            json={"reason": "This pickup does not exist"},
            headers=_auth(client),
        )
        assert resp.status_code == 404


# ── GET /users/{id}/compliance ──────────────────

class TestComplianceScore:
    def test_no_record_returns_404(self, client: TestClient) -> None:
        resp = client.get("/api/v1/users/1/compliance", headers=_auth(client))
        assert resp.status_code == 404

    def test_score_available_after_log(self, client: TestClient) -> None:
        client.post(
            "/api/v1/pickups/1/log",
            json={"weight_kg": 10.0, "waste_category": "dry", "photo_url": "p.jpg"},
            headers=_auth(client, "+919876543210"),
        )
        resp = client.get("/api/v1/users/1/compliance", headers=_auth(client))
        assert resp.status_code == 200
        data = resp.json()
        assert "rolling_score" in data
        assert data["user_id"] == 1


# ── GET /redemptions/catalog ────────────────────

class TestRedemptionCatalog:
    def test_returns_active_items(self, client: TestClient) -> None:
        resp = client.get("/api/v1/redemptions/catalog", headers=_auth(client))
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) >= 1
        assert any(i["item_name"] == "Test Voucher" for i in items)


# ── POST /redemptions ───────────────────────────

class TestRedeem:
    def _give_points(self, points: int = 100) -> None:
        with TestingSessionLocal() as session:
            from app.models.user_tier import UserTierRecord
            from app.models.enums import UserTier
            tier = UserTierRecord(
                user_id=1, current_tier=UserTier.BRONZE,
                points_balance=points, points_lifetime=points,
                flags_count=0, tier_updated_at=datetime.now(timezone.utc),
            )
            session.add(tier)
            session.commit()

    def test_happy_path(self, client: TestClient) -> None:
        self._give_points(100)
        resp = client.post(
            "/api/v1/redemptions",
            json={"catalog_item_id": 1},
            headers=_auth(client),
        )
        assert resp.status_code == 201
        assert resp.json()["status"] == "requested"

    def test_insufficient_points_rejected(self, client: TestClient) -> None:
        self._give_points(10)
        resp = client.post(
            "/api/v1/redemptions",
            json={"catalog_item_id": 1},
            headers=_auth(client),
        )
        assert resp.status_code == 400
        assert "insufficient" in resp.json()["detail"].lower()

    def test_no_tier_record_rejected(self, client: TestClient) -> None:
        resp = client.post(
            "/api/v1/redemptions",
            json={"catalog_item_id": 1},
            headers=_auth(client),
        )
        assert resp.status_code == 400

    def test_inactive_catalog_item_rejected(self, client: TestClient) -> None:
        self._give_points(1000)
        with TestingSessionLocal() as session:
            from sqlalchemy import select
            from app.models.redemption_catalog import RedemptionCatalog
            item = session.scalar(select(RedemptionCatalog).where(RedemptionCatalog.id == 1))
            item.active = False
            session.commit()

        resp = client.post(
            "/api/v1/redemptions",
            json={"catalog_item_id": 1},
            headers=_auth(client),
        )
        assert resp.status_code == 404
