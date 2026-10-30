"""Unit and integration test suite for enhanced authentication and Indian structured address setup."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from tests.conftest import TestingSessionLocal
from app.main import app


@pytest.fixture
def client(setup_db):
    from app.db import get_db

    def override_get_db():
        with TestingSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


class TestPhoneOTPAuth:
    def test_request_otp_invalid_phone(self, client: TestClient):
        # Must fail when not 10 digits
        res = client.post("/api/v1/auth/phone/otp/request", json={"phone": "123"})
        assert res.status_code == 400

    def test_request_and_verify_new_user(self, client: TestClient):
        phone = "9876500001"
        req_res = client.post("/api/v1/auth/phone/otp/request", json={"phone": phone})
        assert req_res.status_code == 200

        # Dev bypass code is 1234
        verify_res = client.post("/api/v1/auth/phone/otp/verify", json={"phone": phone, "code": "1234"})
        assert verify_res.status_code == 200
        data = verify_res.json()

        assert data["is_new_user"] is True
        assert data["profile_completed"] is False
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["user"]["phone"] == f"+91{phone}"
        assert data["user"]["phone_verified"] is True

    def test_verify_existing_user(self, client: TestClient):
        phone = "9876500002"
        # First login creates account
        client.post("/api/v1/auth/phone/otp/request", json={"phone": phone})
        client.post("/api/v1/auth/phone/otp/verify", json={"phone": phone, "code": "1234"})

        # Second login logs in existing user
        client.post("/api/v1/auth/phone/otp/request", json={"phone": phone})
        res = client.post("/api/v1/auth/phone/otp/verify", json={"phone": phone, "code": "1234"})
        assert res.status_code == 200
        assert res.json()["is_new_user"] is False


class TestEmailPasswordAuth:
    def test_email_signup_and_verify_flow(self, client: TestClient):
        email = "test.resident@bhopal.in"
        signup_res = client.post("/api/v1/auth/email/signup", json={
            "email": email,
            "password": "strongPassword123",
            "confirm_password": "strongPassword123",
        })
        assert signup_res.status_code == 201
        data = signup_res.json()
        assert "verification_link" in data

        # Login before email verification must fail with 403
        login_before = client.post("/api/v1/auth/email/login", json={
            "email": email,
            "password": "strongPassword123",
        })
        assert login_before.status_code == 403

        # Verify email using the token
        token = data["verification_link"].split("token=")[1]
        verify_res = client.post("/api/v1/auth/email/verify", json={"token": token})
        assert verify_res.status_code == 200
        assert verify_res.json()["user"]["email_verified"] is True

        # Login after email verification succeeds
        login_after = client.post("/api/v1/auth/email/login", json={
            "email": email,
            "password": "strongPassword123",
        })
        assert login_after.status_code == 200
        assert "access_token" in login_after.json()
        assert "refresh_token" in login_after.json()

    def test_account_lockout_after_five_attempts(self, client: TestClient):
        email = "lockout.test@bhopal.in"
        client.post("/api/v1/auth/email/signup", json={
            "email": email,
            "password": "strongPassword123",
            "confirm_password": "strongPassword123",
        })
        # Simulate verified
        with TestingSessionLocal() as session:
            from sqlalchemy import select
            from app.models.user import User
            user = session.scalar(select(User).where(User.email == email))
            user.email_verified = True
            session.commit()

        # 4 wrong attempts return 401
        for _ in range(4):
            res = client.post("/api/v1/auth/email/login", json={"email": email, "password": "wrongpassword"})
            assert res.status_code == 401

        # 5th wrong attempt triggers 403 lockout
        res5 = client.post("/api/v1/auth/email/login", json={"email": email, "password": "wrongpassword"})
        assert res5.status_code == 403
        assert "locked" in res5.json()["detail"].lower()


class TestProfileAndStructuredAddress:
    def test_complete_profile_with_bhopal_address(self, client: TestClient):
        phone = "9876500003"
        client.post("/api/v1/auth/phone/otp/request", json={"phone": phone})
        auth_res = client.post("/api/v1/auth/phone/otp/verify", json={"phone": phone, "code": "1234"})
        token = auth_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        profile_payload = {
            "name": "Amitabh Sharma",
            "phone": "9876500003",
            "email": "amitabh@bhopal.in",
            "house_flat_number": "E-4/204",
            "street_colony": "Arera Colony",
            "locality": "Arera Colony",
            "landmark": "Near Shahpura Lake",
            "ward_number": "48",
            "pincode": "462016",
            "latitude": 23.2156,
            "longitude": 77.4338,
        }

        res = client.post("/api/v1/auth/profile-address", json=profile_payload, headers=headers)
        assert res.status_code == 200
        user = res.json()
        assert user["name"] == "Amitabh Sharma"
        assert user["profile_completed"] is True
        assert "E-4/204" in user["address"]
        assert "Near Shahpura Lake" in user["address"]
        assert user["latitude"] == 23.2156
        assert user["longitude"] == 77.4338


class TestTokenRefresh:
    def test_refresh_token_exchange(self, client: TestClient):
        phone = "9876500004"
        client.post("/api/v1/auth/phone/otp/request", json={"phone": phone})
        auth_res = client.post("/api/v1/auth/phone/otp/verify", json={"phone": phone, "code": "1234"})
        refresh_token = auth_res.json()["refresh_token"]

        ref_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
        assert ref_res.status_code == 200
        data = ref_res.json()
        assert "access_token" in data
        assert "refresh_token" in data
