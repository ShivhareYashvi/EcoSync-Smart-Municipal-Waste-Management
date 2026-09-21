"""Unit tests for citizen engagement & community: Privacy boundaries, upvote uniqueness, and referral bonus rules."""

from datetime import date, datetime, time, timezone
import pytest
from sqlalchemy.exc import IntegrityError

from app.models.complaint import Complaint
from app.models.complaint_upvote import ComplaintUpvote
from app.models.compliance_score import ComplianceScore
from app.models.enums import (
    ComplaintCategory,
    ComplaintStatus,
    PickupStatus,
    ReferralStatus,
    SocietyMemberRole,
    SocietyMemberStatus,
    UserRole,
    UserTier,
    WasteCategory,
)
from app.models.pickup_request import PickupRequest
from app.models.referral import Referral
from app.models.society import Society
from app.models.society_membership import SocietyMembership
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.models.zone import Zone
from app.schemas.leaderboard import LeaderboardSettingsUpdate
from app.schemas.society import SocietyCreate
from app.services.leaderboard_service import leaderboard_service
from app.services.operations_service import operations_service
from app.services.referral_service import referral_service
from app.services.society_service import society_service
from tests.conftest import TestingSessionLocal


_user_counter = 0


def _create_user(session, name="Resident", role=UserRole.CITIZEN, zone_id=None):
    global _user_counter
    _user_counter += 1
    now = datetime.now(timezone.utc)
    user = User(
        name=name,
        phone=f"+9198{_user_counter:08d}",
        email=f"user_{_user_counter}_{name.lower().replace(' ', '')}@example.com",
        password_hash="hashed_pw",
        role=role,
        address="Flat 101, Test Residency",
        verified=True,
        zone_id=zone_id,
        locale_preference="en",
        created_at=now,
        updated_at=now,
    )
    session.add(user)
    session.flush()
    # Add initial tier record
    tier = UserTierRecord(
        user_id=user.id,
        current_tier=UserTier.BRONZE,
        points_balance=0,
        points_lifetime=0,
        flags_count=0,
        tier_updated_at=now,
    )
    session.add(tier)
    session.flush()
    return user


def _create_zone(session, name="Central Ward", code="CW-01"):
    zone = Zone(name=name, code=code, city="Bengaluru")
    session.add(zone)
    session.flush()
    return zone


class TestComplaintUpvoteUniqueness:
    def test_database_unique_constraint_blocks_duplicate_upvote(self, setup_db):
        """Database enforces unique(complaint_id, user_id). Second insert raises IntegrityError."""
        with TestingSessionLocal() as session:
            user = _create_user(session, "Voter User")
            complaint = Complaint(
                user_id=user.id,
                category=ComplaintCategory.MISSED_PICKUP,
                description="Garbage not collected from main road",
                status=ComplaintStatus.OPEN,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(complaint)
            session.commit()

            # First upvote succeeds
            upvote1 = ComplaintUpvote(complaint_id=complaint.id, user_id=user.id)
            session.add(upvote1)
            session.commit()

            # Second upvote for same (complaint_id, user_id) MUST raise IntegrityError
            upvote2 = ComplaintUpvote(complaint_id=complaint.id, user_id=user.id)
            session.add(upvote2)
            with pytest.raises(IntegrityError):
                session.commit()

    def test_toggle_complaint_upvote(self, setup_db):
        """Operations service toggles upvote status smoothly."""
        with TestingSessionLocal() as session:
            user = _create_user(session, "Toggle Voter")
            complaint = Complaint(
                user_id=user.id,
                category=ComplaintCategory.DAMAGED_BIN,
                description="Community dustbin overflowing with wet waste",
                status=ComplaintStatus.OPEN,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc),
            )
            session.add(complaint)
            session.commit()

            # 1. First toggle -> upvoted = True, count = 1
            res1 = operations_service.toggle_complaint_upvote(session, complaint.id, user.id)
            assert res1["upvoted"] is True
            assert res1["upvote_count"] == 1

            # 2. Second toggle -> upvoted = False, count = 0
            res2 = operations_service.toggle_complaint_upvote(session, complaint.id, user.id)
            assert res2["upvoted"] is False
            assert res2["upvote_count"] == 0


class TestReferralLifecycleAndAntiGaming:
    def test_registration_alone_does_not_award_points(self, setup_db):
        """Crucial anti-farming boundary: registration creates pending referral, 0 bonus points."""
        with TestingSessionLocal() as session:
            referrer = _create_user(session, "Referrer Citizen")
            new_user = _create_user(session, "Referred Neighbor")

            code = referral_service.generate_referral_code(referrer.id)
            ref = referral_service.process_referral_on_registration(session, new_user.id, code)
            session.commit()

            assert ref is not None
            assert ref.status == ReferralStatus.PENDING
            assert ref.points_awarded is False

            # Check referrer balance - MUST BE 0!
            tier = session.get(UserTierRecord, referrer.id)
            assert tier.points_balance == 0

    def test_bonus_awarded_on_first_verified_pickup_only(self, setup_db):
        """Referrer receives 100 points only after first verified pickup. Subsequent pickups award nothing extra."""
        with TestingSessionLocal() as session:
            referrer = _create_user(session, "Referrer Alice")
            new_user = _create_user(session, "Referred Bob")

            code = referral_service.generate_referral_code(referrer.id)
            referral_service.process_referral_on_registration(session, new_user.id, code)
            session.commit()

            now = datetime.now(timezone.utc)
            # Create first pickup for referred user (verified)
            pickup1 = PickupRequest(
                user_id=new_user.id,
                waste_type="dry",
                waste_category=WasteCategory.DRY,
                weight_kg=5.0,
                segregation_verified=True,
                status=PickupStatus.COMPLETED,
                scheduled_date=date(2026, 9, 19),
                scheduled_time=time(10, 0),
                created_at=now,
                updated_at=now,
            )
            session.add(pickup1)
            session.commit()

            # Trigger referral check on 1st verified pickup
            awarded = referral_service.check_and_award_referral_bonus(session, pickup1.id)
            assert awarded is True

            # Verify referrer received 100 points
            tier = session.get(UserTierRecord, referrer.id)
            assert tier.points_balance == 100

            # Verify referral record transitioned to COMPLETED
            ref_record = session.query(Referral).filter_by(referred_user_id=new_user.id).one()
            assert ref_record.status == ReferralStatus.COMPLETED
            assert ref_record.points_awarded is True

            # 2. Second verified pickup occurs
            pickup2 = PickupRequest(
                user_id=new_user.id,
                waste_type="wet",
                waste_category=WasteCategory.WET,
                weight_kg=3.0,
                segregation_verified=True,
                status=PickupStatus.COMPLETED,
                scheduled_date=date(2026, 9, 20),
                scheduled_time=time(10, 0),
                created_at=now,
                updated_at=now,
            )
            session.add(pickup2)
            session.commit()

            awarded2 = referral_service.check_and_award_referral_bonus(session, pickup2.id)
            assert awarded2 is False

            # Referrer balance remains 100 (not 200)
            session.refresh(tier)
            assert tier.points_balance == 100


class TestSocietyAggregatePrivacyBoundary:
    def test_society_aggregate_suppression_with_under_three_members(self, setup_db):
        """CRITICAL PRIVACY TEST: 1 or 2 member society must suppress individual inference."""
        with TestingSessionLocal() as session:
            zone = _create_zone(session, "North Zone", "NZ-01")
            rwa_admin = _create_user(session, "Admin User", zone_id=zone.id)

            # 1. Register society -> 1 member (the creator)
            society = society_service.register_society(
                session,
                rwa_admin.id,
                SocietyCreate(
                    name="Palm Meadows Society",
                    address="123 Palm Ave",
                    zone_id=zone.id,
                ),
            )
            # Make creator membership active for testing dashboard
            membership1 = session.query(SocietyMembership).filter_by(society_id=society.id, user_id=rwa_admin.id).one()
            membership1.status = SocietyMemberStatus.ACTIVE
            session.commit()

            # 1 Member cohort -> Suppressed
            dash1 = society_service.get_society_dashboard(session, society.id, rwa_admin)
            assert dash1.privacy_suppressed is True
            assert dash1.average_compliance is None
            assert dash1.total_verified_pickups is None
            assert dash1.total_points_earned is None
            assert "minimum of 3 active households" in (dash1.message or "")

            # 2. Add 2nd member -> 2 members cohort -> MUST STILL BE SUPPRESSED!
            member2 = _create_user(session, "Resident Two", zone_id=zone.id)
            society_service.join_society(session, member2.id, society.id)

            dash2 = society_service.get_society_dashboard(session, society.id, rwa_admin)
            assert dash2.active_members == 2
            assert dash2.privacy_suppressed is True
            assert dash2.average_compliance is None

            # 3. Add 3rd member -> 3 members cohort -> UNLOCK AGGREGATES!
            member3 = _create_user(session, "Resident Three", zone_id=zone.id)
            society_service.join_society(session, member3.id, society.id)

            # Assign compliance score to member 2 and 3
            now = datetime.now(timezone.utc)
            session.add(ComplianceScore(user_id=member2.id, rolling_score=90.0, total_pickups=10, verified_pickups=9, updated_at=now))
            session.add(ComplianceScore(user_id=member3.id, rolling_score=80.0, total_pickups=10, verified_pickups=8, updated_at=now))
            session.commit()

            dash3 = society_service.get_society_dashboard(session, society.id, rwa_admin)
            assert dash3.active_members == 3
            assert dash3.privacy_suppressed is False
            assert dash3.average_compliance is not None
            # Average of 0 (rwa_admin), 90, 80 = 170 / 3 ≈ 56.7%
            assert dash3.average_compliance > 50.0
            assert dash3.total_verified_pickups == 17
            assert dash3.message is None


class TestOptInLeaderboardPrivacyFilter:
    def test_non_opted_in_user_is_strictly_excluded(self, setup_db):
        """User who has not opted in NEVER appears on the leaderboard."""
        with TestingSessionLocal() as session:
            user_opted_out = _create_user(session, "Hidden Citizen")
            user_opted_in = _create_user(session, "Visible Citizen")

            # Give points to both users
            session.get(UserTierRecord, user_opted_out.id).points_balance = 500
            session.get(UserTierRecord, user_opted_in.id).points_balance = 300
            session.commit()

            # Opt in only user_opted_in
            leaderboard_service.update_settings(
                session,
                user_opted_in.id,
                LeaderboardSettingsUpdate(opted_in=True, display_handle="EcoHero"),
            )

            # Query leaderboard
            entries = leaderboard_service.get_individual_leaderboard(session, scope="city")
            user_ids = [e.user_id for e in entries]

            assert user_opted_in.id in user_ids
            assert user_opted_out.id not in user_ids

            # Display handle check
            entry = next(e for e in entries if e.user_id == user_opted_in.id)
            assert entry.display_handle == "EcoHero"
            assert entry.points == 300
