"""Tests for SQLAdmin dashboard authentication, permissions, and read-only ledgers."""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.core.security import hash_password
from app.db import SessionLocal
from app.main import app
from app.models.enums import UserRole
from app.models.user import User
from app.models.zone import Zone
from app.admin import (
    EPRCreditAdmin,
    IdempotencyKeyAdmin,
    OTPChallengeAdmin,
    PointsTransactionAdmin,
    RecyclingReceiptAdmin,
    RewardAdmin,
    ZoneAdmin,
)


@pytest.fixture
def admin_client():
    """Test client configured for testing SQLAdmin endpoints with cookie tracking."""
    return TestClient(app, follow_redirects=False)


@pytest.fixture
def seed_admin_users():
    """Ensure test users (admin, citizen, driver) exist in the database."""
    now = datetime.now(timezone.utc)
    with SessionLocal() as db:
        # 1. Active Admin
        admin = db.query(User).filter_by(email="test.sqladmin@ecosync.org").first()
        if not admin:
            admin = User(
                name="SQLAdmin Tester",
                email="test.sqladmin@ecosync.org",
                phone="+919999000001",
                password_hash=hash_password("AdminPass123!"),
                role=UserRole.ADMIN,
                verified=True,
                created_at=now,
                updated_at=now,
            )
            db.add(admin)

        # 2. Citizen User
        citizen = db.query(User).filter_by(email="test.citizen@ecosync.org").first()
        if not citizen:
            citizen = User(
                name="Citizen Tester",
                email="test.citizen@ecosync.org",
                phone="+919999000002",
                password_hash=hash_password("CitizenPass123!"),
                role=UserRole.CITIZEN,
                verified=True,
                created_at=now,
                updated_at=now,
            )
            db.add(citizen)

        # 3. Driver User
        driver = db.query(User).filter_by(email="test.driver@ecosync.org").first()
        if not driver:
            driver = User(
                name="Driver Tester",
                email="test.driver@ecosync.org",
                phone="+919999000003",
                password_hash=hash_password("DriverPass123!"),
                role=UserRole.DRIVER,
                verified=True,
                created_at=now,
                updated_at=now,
            )
            db.add(driver)

        # 4. Inactive / Unverified Admin
        inactive_admin = db.query(User).filter_by(email="test.inactive_admin@ecosync.org").first()
        if not inactive_admin:
            inactive_admin = User(
                name="Inactive Admin Tester",
                email="test.inactive_admin@ecosync.org",
                phone="+919999000004",
                password_hash=hash_password("AdminPass123!"),
                role=UserRole.ADMIN,
                verified=False,  # Unverified / inactive
                created_at=now,
                updated_at=now,
            )
            db.add(inactive_admin)

        db.commit()


def test_admin_unauthenticated_redirects_to_login(admin_client):
    """Accessing /admin/ without a valid session should redirect to /admin/login."""
    response = admin_client.get("/admin/")
    assert response.status_code in (302, 303, 307)
    assert "/admin/login" in response.headers.get("location", "")


def test_admin_login_wrong_password_fails(admin_client, seed_admin_users):
    """Logging into /admin/login with an incorrect password must fail."""
    response = admin_client.post(
        "/admin/login",
        data={"username": "test.sqladmin@ecosync.org", "password": "WrongPassword123!"},
    )
    # Failed login either re-renders the login page (200 with error) or returns 400
    assert response.status_code in (200, 400)
    # Session cookie should NOT be established
    assert "admin_user_id" not in admin_client.cookies


def test_admin_login_non_admin_role_fails(admin_client, seed_admin_users):
    """Citizens and drivers must be rejected even with correct credentials."""
    # Test Citizen login
    citizen_res = admin_client.post(
        "/admin/login",
        data={"username": "test.citizen@ecosync.org", "password": "CitizenPass123!"},
    )
    assert citizen_res.status_code in (200, 400)
    assert "session" not in citizen_res.cookies or not citizen_res.cookies.get("session")

    # Test Driver login
    driver_res = admin_client.post(
        "/admin/login",
        data={"username": "test.driver@ecosync.org", "password": "DriverPass123!"},
    )
    assert driver_res.status_code in (200, 400)

    # Test Unverified/Inactive Admin login
    inactive_res = admin_client.post(
        "/admin/login",
        data={"username": "test.inactive_admin@ecosync.org", "password": "AdminPass123!"},
    )
    assert inactive_res.status_code in (200, 400)


def test_admin_login_success_and_zone_crud(admin_client, seed_admin_users):
    """Valid admin logs in successfully and performs CRUD operations on zones."""
    login_res = admin_client.post(
        "/admin/login",
        data={"username": "test.sqladmin@ecosync.org", "password": "AdminPass123!"},
    )
    # Successful login redirects to /admin
    assert login_res.status_code in (302, 303, 307)
    assert "/admin" in login_res.headers.get("location", "")

    # Follow redirect to /admin dashboard
    dashboard_res = admin_client.get("/admin/")
    assert dashboard_res.status_code == 200
    assert "EcoSync Administration" in dashboard_res.text or "dashboard" in dashboard_res.text.lower()

    # 1. Create a new zone
    create_res = admin_client.post(
        "/admin/zone/create",
        data={"name": "Test SQLAdmin Ward", "code": "TSA-001", "city": "Bhopal"},
    )
    assert create_res.status_code in (200, 302, 303)

    with SessionLocal() as db:
        zone = db.scalar(select(Zone).where(Zone.code == "TSA-001"))
        assert zone is not None
        assert zone.name == "Test SQLAdmin Ward"
        zone_id = zone.id

    # 2. Edit the zone
    edit_res = admin_client.post(
        f"/admin/zone/edit/{zone_id}",
        data={"name": "Updated SQLAdmin Ward", "code": "TSA-001", "city": "Bhopal"},
    )
    assert edit_res.status_code in (200, 302, 303)

    with SessionLocal() as db:
        updated_zone = db.get(Zone, zone_id)
        assert updated_zone.name == "Updated SQLAdmin Ward"

    # 3. Delete the zone
    delete_res = admin_client.delete(f"/admin/zone/delete?pks={zone_id}")
    assert delete_res.status_code == 200

    with SessionLocal() as db:
        deleted_zone = db.get(Zone, zone_id)
        assert deleted_zone is None


def test_ledger_tables_are_read_only():
    """Audit and financial ledger tables must have create/edit/delete disabled."""
    read_only_views = [
        OTPChallengeAdmin,
        IdempotencyKeyAdmin,
        RecyclingReceiptAdmin,
        EPRCreditAdmin,
        PointsTransactionAdmin,
        RewardAdmin,
    ]

    for view in read_only_views:
        assert view.can_create is False, f"{view.name} must not allow creation"
        assert view.can_edit is False, f"{view.name} must not allow editing"
        assert view.can_delete is False, f"{view.name} must not allow deletion"

    # In contrast, ZoneAdmin must be fully editable
    assert ZoneAdmin.can_create is True
    assert ZoneAdmin.can_edit is True
    assert ZoneAdmin.can_delete is True
