"""API integration tests for Recycler Marketplace Mechanics (Ledger-Only).

Tests cover:
  - Recycler registration, pending queue, and admin verification
  - Rate card posting, versioning, and unauthenticated public price board
  - Recycling transaction lifecycle: request -> log pickup -> confirm / dispute
  - Digital receipt generation and citizen receipt history
  - EPR credit ledger, available pool, and simulated brand claim
  - Compost batch wet waste aggregation and status workflow
"""

from __future__ import annotations

from datetime import date, datetime, time, timezone
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.models.brand_account import BrandAccount
from app.models.enums import (
    CompostBatchStatus,
    MaterialType,
    PickupStatus,
    RecyclerVerificationStatus,
    RecyclingTransactionStatus,
    UserRole,
    WasteCategory,
    WasteType,
)
from app.models.pickup_request import PickupRequest
from app.models.recycler import Recycler
from app.models.recycler_rate_card import RecyclerRateCard
from app.models.user import User
from app.models.zone import Zone
from tests.conftest import TestingSessionLocal


@pytest.fixture()
def client(setup_db):
    """FastAPI TestClient with DB override and marketplace seed data."""
    from app.db import get_db
    from app.main import app

    def override_get_db():
        with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestingSessionLocal() as session:
        _seed_db(session)

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c

    app.dependency_overrides.clear()


def _seed_db(session) -> None:
    now = datetime.now(timezone.utc)

    # Zone
    zone = Zone(name="Indiranagar Ward", code="BLR-W01", city="Bengaluru", created_at=now)
    session.add(zone)
    session.flush()

    # Admin
    admin = User(
        id=1,
        name="Admin User",
        phone="+910000000001",
        email="admin@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.ADMIN,
        address="Admin HQ",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    # Citizen
    citizen = User(
        id=2,
        name="Citizen User",
        phone="+910000000002",
        email="citizen@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.CITIZEN,
        address="123 Indiranagar",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    # Recycler 1 (Verified)
    recycler_user1 = User(
        id=3,
        name="Verified Recycler",
        phone="+910000000003",
        email="recycler1@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.RECYCLER,
        address="45 Eco Park",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    # Recycler 2 (Pending)
    recycler_user2 = User(
        id=4,
        name="Pending Recycler",
        phone="+910000000004",
        email="recycler2@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.RECYCLER,
        address="88 Scrap Lane",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    session.add_all([admin, citizen, recycler_user1, recycler_user2])
    session.flush()

    # Profiles
    rec1 = Recycler(
        id=1,
        user_id=recycler_user1.id,
        business_name="Indiranagar Green Traders",
        materials_accepted=[MaterialType.PLASTIC, MaterialType.PAPER],
        service_zone_ids=[zone.id],
        verification_status=RecyclerVerificationStatus.VERIFIED,
        verification_doc_url="/uploads/verification-docs/trade_license.pdf",
        created_at=now,
        updated_at=now,
    )
    rec2 = Recycler(
        id=2,
        user_id=recycler_user2.id,
        business_name="Newbie Metal Scrap",
        materials_accepted=[MaterialType.METAL],
        service_zone_ids=[zone.id],
        verification_status=RecyclerVerificationStatus.PENDING,
        created_at=now,
        updated_at=now,
    )
    session.add_all([rec1, rec2])
    session.flush()

    # Rate card for verified recycler: Plastic @ 15.00
    card1 = RecyclerRateCard(
        recycler_id=rec1.id,
        material=MaterialType.PLASTIC,
        rate_per_kg=Decimal("15.00"),
        effective_from=now,
        active=True,
    )
    session.add(card1)

    # Brand Account
    brand = BrandAccount(
        id=1,
        org_name="Hindustan Packaging Corp",
        contact_email="epr@hindustanpackaging.com",
        created_at=now,
    )
    session.add(brand)

    # Completed wet waste pickup for compost aggregation test
    pickup = PickupRequest(
        id=1,
        user_id=citizen.id,
        zone_id=zone.id,
        waste_type=WasteType.WET,
        waste_category=WasteCategory.WET,
        weight_kg=50.0,
        status=PickupStatus.COMPLETED,
        scheduled_date=date.today(),
        scheduled_time=time(10, 0),
        segregation_verified=True,
        created_at=now,
        updated_at=now,
    )
    session.add(pickup)

    session.commit()


def _login(client: TestClient, phone: str = "+910000000001", password: str = "password123") -> str:
    resp = client.post("/api/v1/auth/login", json={"phone": phone, "password": password})
    assert resp.status_code == 200
    return resp.json()["access_token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


#  1. Onboarding & Verification Tests ─


class TestRecyclerOnboarding:
    def test_register_recycler_success(self, client):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "Fresh Plastics",
                "phone": "+919999900001",
                "password": "password123",
                "address": "Zone 1 Scrap Market",
                "role": "recycler",
                "business_name": "Fresh Plastics Recycling Co",
                "materials_accepted": ["plastic"],
                "service_zone_ids": [1],
            },
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["role"] == "recycler"
        assert data["business_name"] == "Fresh Plastics Recycling Co"
        assert data["verification_status"] == "pending"

    def test_register_recycler_missing_business_name_fails(self, client):
        resp = client.post(
            "/api/v1/auth/register",
            json={
                "name": "No Business Name",
                "phone": "+919999900002",
                "password": "password123",
                "address": "Unknown Road",
                "role": "recycler",
            },
        )
        assert resp.status_code == 400

    def test_admin_pending_queue_and_verify(self, client):
        admin_token = _login(client, "+910000000001")
        # Check pending queue
        resp = client.get("/api/v1/recyclers/pending", headers=_auth(admin_token))
        assert resp.status_code == 200
        pending = resp.json()
        assert any(r["id"] == 2 for r in pending)

        # Approve recycler 2
        verify_resp = client.patch(
            "/api/v1/recyclers/2/verify",
            json={"status": "verified"},
            headers=_auth(admin_token),
        )
        assert verify_resp.status_code == 200
        assert verify_resp.json()["verification_status"] == "verified"


#  2. Rate Cards & Public Price Board Tests ─


class TestRateCardsAndPriceBoard:
    def test_unverified_recycler_cannot_post_rates(self, client):
        rec2_token = _login(client, "+910000000004")
        resp = client.post(
            "/api/v1/recyclers/2/rates",
            json={"material": "metal", "rate_per_kg": "35.50"},
            headers=_auth(rec2_token),
        )
        assert resp.status_code == 403

    def test_verified_recycler_post_and_update_rates(self, client):
        rec1_token = _login(client, "+910000000003")
        # Post new paper rate
        resp = client.post(
            "/api/v1/recyclers/1/rates",
            json={"material": "paper", "rate_per_kg": "12.50"},
            headers=_auth(rec1_token),
        )
        assert resp.status_code == 201
        assert resp.json()["rate_per_kg"] == "12.50"

        # Update plastic rate from 15.00 to 16.75
        update_resp = client.post(
            "/api/v1/recyclers/1/rates",
            json={"material": "plastic", "rate_per_kg": "16.75"},
            headers=_auth(rec1_token),
        )
        assert update_resp.status_code == 201
        assert update_resp.json()["rate_per_kg"] == "16.75"

    def test_public_scrap_price_board_no_auth_required(self, client):
        """Live scrap price board must be public without any Authorization header."""
        resp = client.get("/api/v1/recyclers/rates")
        assert resp.status_code == 200
        rates = resp.json()
        assert len(rates) >= 1
        assert any(r["material"] == "plastic" and r["recycler_id"] == 1 for r in rates)

    def test_public_price_board_filter_by_zone(self, client):
        resp = client.get("/api/v1/recyclers/rates?zone_id=1")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

        # Non-matching zone
        resp_empty = client.get("/api/v1/recyclers/rates?zone_id=999")
        assert resp_empty.status_code == 200
        assert len(resp_empty.json()) == 0


#  3. Recycling Transaction Flow Tests 


class TestRecyclingTransactionFlow:
    def test_full_happy_path_sale_to_receipt_and_epr(self, client):
        citizen_token = _login(client, "+910000000002")
        rec_token = _login(client, "+910000000003")
        admin_token = _login(client, "+910000000001")

        # 1. Citizen requests a sale of 20 kg plastic to Recycler 1
        req_resp = client.post(
            "/api/v1/recycling-transactions",
            json={
                "recycler_id": 1,
                "material": "plastic",
                "estimated_weight_kg": "20.00",
            },
            headers=_auth(citizen_token),
        )
        assert req_resp.status_code == 201
        txn_data = req_resp.json()
        txn_id = txn_data["id"]
        assert txn_data["status"] == "requested"

        # 2. Recycler logs actual weight (22.50 kg) with photo proof
        log_resp = client.post(
            f"/api/v1/recycling-transactions/{txn_id}/log",
            json={
                "weight_kg": "22.50",
                "photo_url": "/uploads/pickup-photos/plastic_stack.jpg",
            },
            headers=_auth(rec_token),
        )
        assert log_resp.status_code == 200
        logged_data = log_resp.json()
        assert logged_data["status"] == "logged"
        assert logged_data["rate_applied"] == "15.00"
        # 22.50 * 15.00 = 337.50
        assert logged_data["amount_credited"] == "337.50"

        # 3. Citizen confirms the logged weight and credit
        confirm_resp = client.post(
            f"/api/v1/recycling-transactions/{txn_id}/confirm",
            headers=_auth(citizen_token),
        )
        assert confirm_resp.status_code == 200
        confirmed_data = confirm_resp.json()
        assert confirmed_data["status"] == "confirmed"
        assert confirmed_data["receipt"] is not None
        receipt_num = confirmed_data["receipt"]["receipt_number"]
        assert receipt_num.startswith("RCP-")

        # 4. Digital receipt is queryable by citizen
        receipts_resp = client.get("/api/v1/recycling-receipts/me", headers=_auth(citizen_token))
        assert receipts_resp.status_code == 200
        receipts = receipts_resp.json()
        assert any(r["receipt_number"] == receipt_num for r in receipts)

        # 5. EPR Credit appears in admin available pool
        epr_resp = client.get("/api/v1/epr-credits/available", headers=_auth(admin_token))
        assert epr_resp.status_code == 200
        credits = epr_resp.json()
        matching_credit = next((c for c in credits if c["receipt_number"] == receipt_num), None)
        assert matching_credit is not None
        assert matching_credit["credit_amount"] == "22.50"
        assert matching_credit["status"] == "available"

        # 6. Admin simulates claim against brand account 1
        claim_resp = client.post(
            f"/api/v1/epr-credits/{matching_credit['id']}/claim",
            json={"brand_id": 1},
            headers=_auth(admin_token),
        )
        assert claim_resp.status_code == 200
        assert claim_resp.json()["status"] == "claimed"
        assert claim_resp.json()["brand_name"] == "Hindustan Packaging Corp"

    def test_dispute_transaction_flow(self, client):
        citizen_token = _login(client, "+910000000002")
        rec_token = _login(client, "+910000000003")

        # Create and log
        req_resp = client.post(
            "/api/v1/recycling-transactions",
            json={"recycler_id": 1, "material": "plastic", "estimated_weight_kg": "10.00"},
            headers=_auth(citizen_token),
        )
        txn_id = req_resp.json()["id"]

        client.post(
            f"/api/v1/recycling-transactions/{txn_id}/log",
            json={"weight_kg": "5.00"},
            headers=_auth(rec_token),
        )

        # Citizen disputes weight difference
        dispute_resp = client.post(
            f"/api/v1/recycling-transactions/{txn_id}/dispute",
            json={"reason": "Weight recorded 5kg but I gave 10kg"},
            headers=_auth(citizen_token),
        )
        assert dispute_resp.status_code == 200
        assert dispute_resp.json()["status"] == "disputed"

        # Confirming an already-disputed transaction must be rejected
        confirm_fail = client.post(
            f"/api/v1/recycling-transactions/{txn_id}/confirm",
            headers=_auth(citizen_token),
        )
        assert confirm_fail.status_code == 400

    def test_confirm_already_confirmed_transaction_rejected(self, client):
        citizen_token = _login(client, "+910000000002")
        rec_token = _login(client, "+910000000003")

        req_resp = client.post(
            "/api/v1/recycling-transactions",
            json={"recycler_id": 1, "material": "plastic", "estimated_weight_kg": "5.00"},
            headers=_auth(citizen_token),
        )
        txn_id = req_resp.json()["id"]

        client.post(
            f"/api/v1/recycling-transactions/{txn_id}/log",
            json={"weight_kg": "5.00"},
            headers=_auth(rec_token),
        )

        first_confirm = client.post(
            f"/api/v1/recycling-transactions/{txn_id}/confirm",
            headers=_auth(citizen_token),
        )
        assert first_confirm.status_code == 200

        # Second confirmation must fail with 400
        second_confirm = client.post(
            f"/api/v1/recycling-transactions/{txn_id}/confirm",
            headers=_auth(citizen_token),
        )
        assert second_confirm.status_code == 400


#  4. Compost Batch Tracking Tests ─


class TestCompostBatches:
    def test_create_and_advance_compost_batch(self, client):
        admin_token = _login(client, "+910000000001")

        # Create batch with auto-aggregated wet waste from completed pickup (50.0 kg seeded)
        resp = client.post(
            "/api/v1/compost-batches",
            json={
                "zone_id": 1,
                "period_start": str(date.today()),
                "period_end": str(date.today()),
                "buyer_note": "Reserved for Indiranagar Parks",
            },
            headers=_auth(admin_token),
        )
        assert resp.status_code == 201
        batch_data = resp.json()
        assert batch_data["status"] == "collected"
        assert Decimal(batch_data["total_weight_kg"]) >= Decimal("50.00")
        batch_id = batch_data["id"]

        # Advance to composting
        step1 = client.patch(
            f"/api/v1/compost-batches/{batch_id}/status",
            json={"status": "composting"},
            headers=_auth(admin_token),
        )
        assert step1.status_code == 200
        assert step1.json()["status"] == "composting"

        # Advance to completed
        step2 = client.patch(
            f"/api/v1/compost-batches/{batch_id}/status",
            json={"status": "completed", "buyer_note": "Curing finished, ready for delivery"},
            headers=_auth(admin_token),
        )
        assert step2.status_code == 200
        assert step2.json()["status"] == "completed"
        assert "ready for delivery" in step2.json()["buyer_note"]

    def test_non_admin_cannot_create_compost_batch(self, client):
        citizen_token = _login(client, "+910000000002")
        resp = client.post(
            "/api/v1/compost-batches",
            json={
                "zone_id": 1,
                "period_start": str(date.today()),
                "period_end": str(date.today()),
            },
            headers=_auth(citizen_token),
        )
        assert resp.status_code == 403
