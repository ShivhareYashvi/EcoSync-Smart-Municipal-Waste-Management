"""Tests for IdempotencyMiddleware on mutating driver/pickup endpoints."""

from datetime import date, datetime, time, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.core.security import hash_password
from app.db import get_db
from app.db_base import Base
import app.models  # noqa: F401
from app.main import app
from app.models.enums import PickupStatus, UserRole
from app.models.idempotency_key import IdempotencyKey
from app.models.pickup_request import PickupRequest
from app.models.points_transaction import PointsTransaction
from app.models.route import Route, RouteStop
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.models.zone import Zone


@pytest.fixture
def client_and_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    def override_db():
        db = TestingSession()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db

    now = datetime.now(timezone.utc)
    with TestingSession() as s:
        z = Zone(id=1, name="Central Ward", code="CW-01", city="Bengaluru")
        s.add(z)
        s.flush()

        driver = User(
            id=10,
            name="Driver David",
            phone="+919111111111",
            email="driver@test.com",
            password_hash=hash_password("password123"),
            role=UserRole.DRIVER,
            address="Driver Depot Road",
            verified=True,
            zone_id=1,
            created_at=now,
            updated_at=now,
        )
        citizen = User(
            id=20,
            name="Citizen Clara",
            phone="+919222222222",
            email="clara@test.com",
            password_hash=hash_password("password123"),
            role=UserRole.CITIZEN,
            address="102 Lake View Apartments",
            verified=True,
            zone_id=1,
            created_at=now,
            updated_at=now,
        )
        s.add_all([driver, citizen])
        s.flush()

        p = PickupRequest(
            id=101,
            user_id=citizen.id,
            driver_id=driver.id,
            waste_type="dry",
            status=PickupStatus.COMPLETED,
            scheduled_date=date(2026, 9, 21),
            scheduled_time=time(10, 0),
            created_at=now,
            updated_at=now,
        )
        s.add(p)

        route = Route(
            id=501,
            driver_id=driver.id,
            zone_id=1,
            route_date=date(2026, 9, 21),
            status="in_progress",
            created_at=now,
        )
        s.add(route)
        s.flush()

        stop = RouteStop(
            id=701,
            route_id=route.id,
            pickup_id=p.id,
            sequence_order=1,
            status="pending",
        )
        s.add(stop)
        s.commit()

    test_client = TestClient(app)
    # Login as driver
    login_resp = test_client.post(
        "/api/v1/auth/login",
        json={"phone": "+919111111111", "password": "password123"},
    )
    assert login_resp.status_code == 200, login_resp.text
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    yield test_client, headers, TestingSession

    app.dependency_overrides.clear()


def test_pickup_log_idempotency_prevents_duplicate_mutations(client_and_db):
    client, headers, SessionClass = client_and_db
    headers_with_key = {**headers, "Idempotency-Key": "test-uuid-key-pickup-001"}
    payload = {
        "weight_kg": 5.0,
        "waste_category": "dry",
        "photo_url": "http://test.com/photo.jpg",
    }

    # 1. First submission
    resp1 = client.post("/api/v1/pickups/101/log", json=payload, headers=headers_with_key)
    assert resp1.status_code == 200
    data1 = resp1.json()
    assert data1["weight_kg"] == 5.0

    with SessionClass() as s:
        txs1 = s.scalars(select(PointsTransaction).where(PointsTransaction.pickup_id == 101)).all()
        assert len(txs1) == 1
        tier1 = s.get(UserTierRecord, 20)
        assert tier1.points_balance == 75  # 50 base + 25 weight

    # 2. Second submission with same Idempotency-Key and payload
    resp2 = client.post("/api/v1/pickups/101/log", json=payload, headers=headers_with_key)
    assert resp2.status_code == 200
    assert resp2.headers.get("X-Cache-Lookup") == "HIT"
    assert resp2.json() == data1

    # Verify zero extra DB transactions were written and balance is identical
    with SessionClass() as s:
        txs2 = s.scalars(select(PointsTransaction).where(PointsTransaction.pickup_id == 101)).all()
        assert len(txs2) == 1
        tier2 = s.get(UserTierRecord, 20)
        assert tier2.points_balance == 75  # Balance has NOT doubled!

    # 3. Third submission with same key but DIFFERENT payload -> returns 409 Conflict
    different_payload = {
        "weight_kg": 15.0,
        "waste_category": "dry",
        "photo_url": "http://test.com/photo.jpg",
    }
    resp3 = client.post("/api/v1/pickups/101/log", json=different_payload, headers=headers_with_key)
    assert resp3.status_code == 409
    assert "different request payload" in resp3.json()["detail"]


def test_route_stop_status_idempotency(client_and_db):
    client, headers, SessionClass = client_and_db
    headers_with_key = {**headers, "Idempotency-Key": "test-uuid-key-stop-002"}
    payload = {"status": "arrived"}

    # 1. First submission
    resp1 = client.patch("/api/v1/routes/501/stops/701/status", json=payload, headers=headers_with_key)
    assert resp1.status_code == 200

    # 2. Duplicate submission
    resp2 = client.patch("/api/v1/routes/501/stops/701/status", json=payload, headers=headers_with_key)
    assert resp2.status_code == 200
    assert resp2.headers.get("X-Cache-Lookup") == "HIT"
