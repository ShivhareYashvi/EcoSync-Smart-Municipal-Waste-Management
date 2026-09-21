"""API integration tests for citizen engagement & community endpoints — happy path + failure cases."""

from __future__ import annotations

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.models.enums import ComplaintCategory, ComplaintStatus, SocietyMemberStatus, UserRole, UserTier
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.models.zone import Zone
from tests.conftest import TestingSessionLocal


@pytest.fixture()
def client(setup_db):
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


def _seed_db(session) -> None:
    now = datetime.now(timezone.utc)
    zone = Zone(name="Indiranagar Ward", code="BLR-W01", city="Bengaluru", created_at=now)
    session.add(zone)
    session.flush()

    admin = User(
        id=1,
        name="Municipal Admin",
        phone="+919000000001",
        email="admin@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.ADMIN,
        address="Admin HQ",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    citizen1 = User(
        id=2,
        name="Citizen Alice",
        phone="+919000000002",
        email="alice@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.CITIZEN,
        address="Flat 101, Indiranagar",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    citizen2 = User(
        id=3,
        name="Citizen Bob",
        phone="+919000000003",
        email="bob@test.com",
        password_hash=hash_password("password123"),
        role=UserRole.CITIZEN,
        address="Flat 102, Indiranagar",
        verified=True,
        zone_id=zone.id,
        created_at=now,
        updated_at=now,
    )
    session.add_all([admin, citizen1, citizen2])
    session.flush()

    # User tiers
    for u in [admin, citizen1, citizen2]:
        session.add(
            UserTierRecord(
                user_id=u.id,
                current_tier=UserTier.BRONZE,
                points_balance=100 if u.id == 2 else 50,
                points_lifetime=100 if u.id == 2 else 50,
                flags_count=0,
                tier_updated_at=now,
            )
        )
    session.commit()


def _login(client: TestClient, phone: str = "+919000000001") -> str:
    resp = client.post("/api/v1/auth/login", json={"phone": phone, "password": "password123"})
    assert resp.status_code == 200, resp.text
    return resp.json()["access_token"]


def _auth_header(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


#  Task 2: Society Tests 

class TestSocietyEndpoints:
    def test_register_and_list_societies(self, client: TestClient):
        token = _login(client, "+919000000002")  # Alice
        # Register society
        resp = client.post(
            "/api/v1/societies",
            json={
                "name": "Green Valley Apartments",
                "address": "100 Outer Ring Road",
                "zone_id": 1,
            },
            headers=_auth_header(token),
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "Green Valley Apartments"
        society_id = data["id"]

        # List societies
        resp_list = client.get("/api/v1/societies", headers=_auth_header(token))
        assert resp_list.status_code == 200
        assert any(s["id"] == society_id for s in resp_list.json())

        # Check /me memberships
        resp_me = client.get("/api/v1/societies/me", headers=_auth_header(token))
        assert resp_me.status_code == 200
        assert any(m["society_id"] == society_id and m["role"] == "rwa_admin" for m in resp_me.json())

    def test_rwa_admin_approval_queue_and_verification(self, client: TestClient):
        alice_token = _login(client, "+919000000002")
        admin_token = _login(client, "+919000000001")

        # Alice registers society
        reg = client.post(
            "/api/v1/societies",
            json={"name": "Silver Oak Enclave", "address": "200 Indiranagar", "zone_id": 1},
            headers=_auth_header(alice_token),
        )
        society_id = reg.json()["id"]

        # Citizen attempts to view pending queue -> 403
        bad_resp = client.get("/api/v1/societies/pending-admins", headers=_auth_header(alice_token))
        assert bad_resp.status_code == 403

        # Municipal admin views queue -> 200
        queue = client.get("/api/v1/societies/pending-admins", headers=_auth_header(admin_token))
        assert queue.status_code == 200
        pending = [p for p in queue.json() if p["society_id"] == society_id]
        assert len(pending) == 1
        membership_id = pending[0]["id"]

        # Municipal admin approves
        verify_resp = client.patch(
            f"/api/v1/societies/memberships/{membership_id}/verify",
            json={"status": "active"},
            headers=_auth_header(admin_token),
        )
        assert verify_resp.status_code == 200
        assert verify_resp.json()["status"] == "active"

    def test_society_dashboard_privacy_suppression(self, client: TestClient):
        alice_token = _login(client, "+919000000002")
        admin_token = _login(client, "+919000000001")

        # Alice registers society
        reg = client.post(
            "/api/v1/societies",
            json={"name": "Privacy Test Society", "address": "300 Lake Rd", "zone_id": 1},
            headers=_auth_header(alice_token),
        )
        society_id = reg.json()["id"]

        # Municipal admin approves Alice
        queue = client.get("/api/v1/societies/pending-admins", headers=_auth_header(admin_token)).json()
        m_id = next(m["id"] for m in queue if m["society_id"] == society_id)
        client.patch(f"/api/v1/societies/memberships/{m_id}/verify", json={"status": "active"}, headers=_auth_header(admin_token))

        # Alice views dashboard: only 1 member -> privacy_suppressed=True
        dash = client.get(f"/api/v1/societies/{society_id}/dashboard", headers=_auth_header(alice_token))
        assert dash.status_code == 200
        d_data = dash.json()
        assert d_data["privacy_suppressed"] is True
        assert d_data["average_compliance"] is None
        assert d_data["total_points_earned"] is None


#  Task 3: Leaderboard Tests 

class TestLeaderboardEndpoints:
    def test_opt_in_toggle_and_strict_exclusion(self, client: TestClient):
        alice_token = _login(client, "+919000000002")
        bob_token = _login(client, "+919000000003")

        # Check default: opted_in == False
        settings = client.get("/api/v1/users/me/leaderboard-settings", headers=_auth_header(alice_token))
        assert settings.status_code == 200
        assert settings.json()["opted_in"] is False

        # Query leaderboard: neither Alice nor Bob should appear
        board_before = client.get("/api/v1/leaderboards/individual?scope=city", headers=_auth_header(alice_token))
        assert board_before.status_code == 200
        uids_before = [e["user_id"] for e in board_before.json()]
        assert 2 not in uids_before
        assert 3 not in uids_before

        # Alice opts in with custom handle
        opt_resp = client.patch(
            "/api/v1/users/me/leaderboard-settings",
            json={"opted_in": True, "display_handle": "GreenChampion"},
            headers=_auth_header(alice_token),
        )
        assert opt_resp.status_code == 200
        assert opt_resp.json()["opted_in"] is True
        assert opt_resp.json()["display_handle"] == "GreenChampion"

        # Now Alice appears, Bob still does not
        board_after = client.get("/api/v1/leaderboards/individual?scope=city", headers=_auth_header(alice_token))
        entries = board_after.json()
        assert any(e["user_id"] == 2 and e["display_handle"] == "GreenChampion" for e in entries)
        assert not any(e["user_id"] == 3 for e in entries)


#  Task 4: Complaint Upvote Tests 

class TestComplaintUpvoteEndpoints:
    def test_complaint_upvote_toggle_and_sort(self, client: TestClient):
        alice_token = _login(client, "+919000000002")
        bob_token = _login(client, "+919000000003")

        # Create two complaints
        c1_resp = client.post(
            "/api/v1/complaints",
            json={"user_id": 2, "category": "missed_pickup", "description": "Missed pickup on 5th main road"},
            headers=_auth_header(alice_token),
        )
        c1_id = c1_resp.json()["id"]

        c2_resp = client.post(
            "/api/v1/complaints",
            json={"user_id": 3, "category": "damaged_bin", "description": "Bin overflowing near bus stop"},
            headers=_auth_header(bob_token),
        )
        c2_id = c2_resp.json()["id"]

        # Alice upvotes c2
        up_resp1 = client.post(f"/api/v1/complaints/{c2_id}/upvote", headers=_auth_header(alice_token))
        assert up_resp1.status_code == 200
        assert up_resp1.json()["upvoted"] is True
        assert up_resp1.json()["upvote_count"] == 1

        # Bob upvotes c2 -> count = 2
        up_resp2 = client.post(f"/api/v1/complaints/{c2_id}/upvote", headers=_auth_header(bob_token))
        assert up_resp2.status_code == 200
        assert up_resp2.json()["upvoted"] is True
        assert up_resp2.json()["upvote_count"] == 2

        # Query complaints sorted by upvotes: c2 must be first!
        sorted_list = client.get("/api/v1/complaints?sort_by=upvotes", headers=_auth_header(alice_token)).json()
        assert sorted_list[0]["id"] == c2_id
        assert sorted_list[0]["upvote_count"] == 2
        assert sorted_list[0]["user_has_upvoted"] is True  # for Alice

        # Alice toggles off upvote on c2 -> count drops to 1
        toggle_off = client.post(f"/api/v1/complaints/{c2_id}/upvote", headers=_auth_header(alice_token))
        assert toggle_off.status_code == 200
        assert toggle_off.json()["upvoted"] is False
        assert toggle_off.json()["upvote_count"] == 1


#  Task 5: Referral Endpoints ─

class TestReferralEndpoints:
    def test_referral_code_and_summary(self, client: TestClient):
        alice_token = _login(client, "+919000000002")

        # Get referral code
        code_resp = client.post("/api/v1/referrals", headers=_auth_header(alice_token))
        assert code_resp.status_code == 200
        data = code_resp.json()
        assert "REF-0002" in data["referral_code"]
        assert "http" in data["referral_link"]
        assert data["bonus_points"] == 100

        # View summary
        summary = client.get("/api/v1/referrals/me", headers=_auth_header(alice_token))
        assert summary.status_code == 200
        s_data = summary.json()
        assert s_data["referral_code"] == data["referral_code"]
        assert s_data["total_referrals"] == 0
        assert s_data["total_points_earned"] == 0
