"""Django-style Admin Panel for EcoSync using SQLAdmin.

Connected to real SQLAlchemy models and authentication backend.
Enforces role-based admin check, active user status, and read-only protections
on financial/points and audit ledgers.
"""

from datetime import datetime, timezone
import os
from typing import Any

from fastapi import FastAPI
from sqlalchemy import or_, select
from starlette.requests import Request
from starlette.responses import RedirectResponse, Response
from sqladmin import Admin, ModelView
from sqladmin.authentication import AuthenticationBackend

from app.core.config import get_settings
from app.core.security import verify_password
from app.db import SessionLocal, engine
from app.models.enums import UserRole
from app.models import (
    BrandAccount,
    BulkGenerator,
    Complaint,
    ComplaintHotspot,
    ComplaintUpvote,
    ComplianceScore,
    CompostBatch,
    Driver,
    DriverLocation,
    EPRCredit,
    IdempotencyKey,
    LeaderboardOptIn,
    Notification,
    OTPChallenge,
    PickupRequest,
    PointsTransaction,
    Recycler,
    RecyclerRateCard,
    RecyclingReceipt,
    RecyclingTransaction,
    Redemption,
    RedemptionCatalog,
    Referral,
    Reward,
    Route,
    RouteStop,
    Society,
    SocietyMembership,
    User,
    UserTierRecord,
    Vehicle,
    Zone,
)

settings = get_settings()


# =============================================================================
# Admin Authentication Backend
# =============================================================================

def get_admin_session_secret() -> str:
    """Retrieve the admin session secret key, failing loudly outside local environments."""
    secret = settings.admin_session_secret or os.getenv("ADMIN_SESSION_SECRET")
    if not secret:
        if settings.environment == "local":
            return "dev-insecure-admin-session-secret-key-32b"
        raise RuntimeError(
            "CRITICAL: ADMIN_SESSION_SECRET environment variable is missing. "
            "A secure secret key is required outside local development."
        )
    return secret


class AdminAuth(AuthenticationBackend):
    """Authenticate administrators against the real users table."""

    async def login(self, request: Request) -> bool:
        form = await request.form()
        identifier = str(form.get("username", "")).strip()
        password = str(form.get("password", ""))

        if not identifier or not password:
            return False

        with SessionLocal() as session:
            # Match by email or normalized phone number
            user = session.scalar(
                select(User).where(or_(User.email == identifier, User.phone == identifier))
            )
            if not user or not user.password_hash:
                return False

            # Verify password hash
            if not verify_password(password, user.password_hash):
                return False

            # Allow ONLY admin role
            if user.role != UserRole.ADMIN:
                return False

            # Verify active user (not locked out and verified)
            now = datetime.now(timezone.utc)
            if user.locked_until and user.locked_until > now:
                return False

            if not user.verified:
                return False

            # Set session
            request.session.update({
                "admin_user_id": user.id,
                "admin_email": user.email or user.phone,
            })
            return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        admin_user_id = request.session.get("admin_user_id")
        if not admin_user_id:
            return False

        with SessionLocal() as session:
            user = session.get(User, admin_user_id)
            if not user or user.role != UserRole.ADMIN:
                request.session.clear()
                return False

            now = datetime.now(timezone.utc)
            if user.locked_until and user.locked_until > now:
                request.session.clear()
                return False

            if not user.verified:
                request.session.clear()
                return False

            return True


# =============================================================================
# Model Views
# =============================================================================

class UserAdmin(ModelView, model=User):
    name = "User"
    name_plural = "Users"
    icon = "fa-solid fa-users"
    category = "Accounts & Identity"

    column_list = [
        User.id,
        User.name,
        User.email,
        User.phone,
        User.role,
        User.verified,
        User.zone_id,
        User.created_at,
    ]
    column_searchable_list = [User.name, User.email, User.phone]
    column_sortable_list = [User.id, User.name, User.role, User.verified, User.created_at]
    column_filters = [User.role, User.verified, User.zone_id]

    # SECURITY: Never show or expose password hashes or verification tokens
    column_details_exclude_list = [
        User.password_hash,
        User.email_verification_token,
        User.password_reset_token,
        User.password_reset_token_expires_at,
    ]
    form_excluded_columns = [
        User.password_hash,
        User.email_verification_token,
        User.password_reset_token,
        User.password_reset_token_expires_at,
        User.pickup_requests,
        User.complaints,
        User.rewards,
        User.driver_profile,
        User.notifications,
        User.points_transactions,
        User.user_tier,
        User.compliance_score,
        User.redemptions,
        User.assigned_vehicles,
        User.bulk_generators,
        User.routes,
        User.recycler_profile,
        User.recycling_transactions,
        User.society_memberships,
        User.leaderboard_opt_in,
        User.complaint_upvotes,
        User.referrals_sent,
        User.referrals_received,
    ]


class ZoneAdmin(ModelView, model=Zone):
    name = "Zone"
    name_plural = "Zones"
    icon = "fa-solid fa-map-location-dot"
    category = "Municipal Operations"

    column_list = [Zone.id, Zone.name, Zone.code, Zone.city, Zone.created_at]
    column_searchable_list = [Zone.name, Zone.code, Zone.city]
    column_sortable_list = [Zone.id, Zone.name, Zone.code, Zone.city, Zone.created_at]

    # Zones are fully editable by administrators
    can_create = True
    can_edit = True
    can_delete = True


class VehicleAdmin(ModelView, model=Vehicle):
    name = "Vehicle"
    name_plural = "Vehicles"
    icon = "fa-solid fa-truck"
    category = "Municipal Operations"

    column_list = [
        Vehicle.id,
        Vehicle.registration_number,
        Vehicle.fuel_type,
        Vehicle.capacity_kg,
        Vehicle.active,
        Vehicle.assigned_driver_id,
    ]
    column_searchable_list = [Vehicle.registration_number]
    column_sortable_list = [Vehicle.id, Vehicle.registration_number, Vehicle.capacity_kg, Vehicle.active]
    column_filters = [Vehicle.fuel_type, Vehicle.active]

    # Vehicles are fully editable
    can_create = True
    can_edit = True
    can_delete = True


class DriverAdmin(ModelView, model=Driver):
    name = "Driver"
    name_plural = "Drivers"
    icon = "fa-solid fa-id-card"
    category = "Municipal Operations"

    column_list = [Driver.id, Driver.user_id, Driver.vehicle_number, Driver.availability, Driver.created_at]
    column_searchable_list = [Driver.vehicle_number]
    column_sortable_list = [Driver.id, Driver.availability, Driver.created_at]
    column_filters = [Driver.availability]


class DriverLocationAdmin(ModelView, model=DriverLocation):
    name = "Driver Location"
    name_plural = "Driver Locations"
    icon = "fa-solid fa-location-crosshairs"
    category = "Municipal Operations"

    column_list = [
        DriverLocation.id,
        DriverLocation.driver_id,
        DriverLocation.pickup_id,
        DriverLocation.latitude,
        DriverLocation.longitude,
        DriverLocation.status,
        DriverLocation.recorded_at,
    ]
    column_sortable_list = [DriverLocation.id, DriverLocation.recorded_at]
    can_create = False
    can_edit = False


class PickupRequestAdmin(ModelView, model=PickupRequest):
    name = "Pickup Request"
    name_plural = "Pickup Requests"
    icon = "fa-solid fa-box-archive"
    category = "Collection & Complaints"

    column_list = [
        PickupRequest.id,
        PickupRequest.user_id,
        PickupRequest.driver_id,
        PickupRequest.status,
        PickupRequest.waste_type,
        PickupRequest.scheduled_date,
        PickupRequest.weight_kg,
    ]
    column_searchable_list = [PickupRequest.notes]
    column_sortable_list = [PickupRequest.id, PickupRequest.status, PickupRequest.scheduled_date]
    column_filters = [PickupRequest.status, PickupRequest.waste_type]

    # Driver assignment and status are editable
    can_create = True
    can_edit = True
    can_delete = True


class ComplaintAdmin(ModelView, model=Complaint):
    name = "Complaint"
    name_plural = "Complaints"
    icon = "fa-solid fa-triangle-exclamation"
    category = "Collection & Complaints"

    column_list = [
        Complaint.id,
        Complaint.user_id,
        Complaint.zone_id,
        Complaint.category,
        Complaint.status,
        Complaint.description,
        Complaint.created_at,
    ]
    column_searchable_list = [Complaint.description]
    column_sortable_list = [Complaint.id, Complaint.status, Complaint.created_at]
    column_filters = [Complaint.category, Complaint.status]

    # Complaint status and resolution are editable
    can_create = True
    can_edit = True
    can_delete = True


class ComplaintHotspotAdmin(ModelView, model=ComplaintHotspot):
    name = "Complaint Hotspot"
    name_plural = "Complaint Hotspots"
    icon = "fa-solid fa-fire"
    category = "Collection & Complaints"

    column_list = [
        ComplaintHotspot.id,
        ComplaintHotspot.zone_id,
        ComplaintHotspot.complaint_count,
        ComplaintHotspot.status,
        ComplaintHotspot.first_flagged_at,
    ]
    column_sortable_list = [ComplaintHotspot.id, ComplaintHotspot.complaint_count, ComplaintHotspot.first_flagged_at]
    column_filters = [ComplaintHotspot.status]


class ComplaintUpvoteAdmin(ModelView, model=ComplaintUpvote):
    name = "Complaint Upvote"
    name_plural = "Complaint Upvotes"
    icon = "fa-solid fa-thumbs-up"
    category = "Collection & Complaints"

    column_list = [ComplaintUpvote.id, ComplaintUpvote.complaint_id, ComplaintUpvote.user_id, ComplaintUpvote.created_at]
    can_create = False
    can_edit = False


class RecyclerAdmin(ModelView, model=Recycler):
    name = "Recycler"
    name_plural = "Recyclers"
    icon = "fa-solid fa-recycle"
    category = "Recycling & EPR"

    column_list = [
        Recycler.id,
        Recycler.user_id,
        Recycler.business_name,
        Recycler.verification_status,
        Recycler.created_at,
    ]
    column_searchable_list = [Recycler.business_name]
    column_sortable_list = [Recycler.id, Recycler.verification_status, Recycler.created_at]
    column_filters = [Recycler.verification_status]

    # Recycler verification/approval status is editable
    can_create = True
    can_edit = True
    can_delete = True


class RecyclerRateCardAdmin(ModelView, model=RecyclerRateCard):
    name = "Rate Card"
    name_plural = "Rate Cards"
    icon = "fa-solid fa-tags"
    category = "Recycling & EPR"

    column_list = [
        RecyclerRateCard.id,
        RecyclerRateCard.recycler_id,
        RecyclerRateCard.material,
        RecyclerRateCard.rate_per_kg,
        RecyclerRateCard.active,
        RecyclerRateCard.effective_from,
    ]
    column_sortable_list = [RecyclerRateCard.id, RecyclerRateCard.rate_per_kg, RecyclerRateCard.active]
    column_filters = [RecyclerRateCard.material, RecyclerRateCard.active]

    # Rate cards are editable
    can_create = True
    can_edit = True
    can_delete = True


class BulkGeneratorAdmin(ModelView, model=BulkGenerator):
    name = "Bulk Generator"
    name_plural = "Bulk Generators"
    icon = "fa-solid fa-building"
    category = "Municipal Operations"

    column_list = [
        BulkGenerator.id,
        BulkGenerator.org_name,
        BulkGenerator.category,
        BulkGenerator.billing_status,
        BulkGenerator.zone_id,
        BulkGenerator.threshold_kg,
        BulkGenerator.created_at,
    ]
    column_searchable_list = [BulkGenerator.org_name]
    column_filters = [BulkGenerator.category, BulkGenerator.billing_status]


class RouteAdmin(ModelView, model=Route):
    name = "Route"
    name_plural = "Routes"
    icon = "fa-solid fa-route"
    category = "Municipal Operations"

    column_list = [Route.id, Route.driver_id, Route.vehicle_id, Route.zone_id, Route.status, Route.route_date]
    column_sortable_list = [Route.id, Route.status, Route.route_date]
    column_filters = [Route.status]


class RouteStopAdmin(ModelView, model=RouteStop):
    name = "Route Stop"
    name_plural = "Route Stops"
    icon = "fa-solid fa-stopwatch"
    category = "Municipal Operations"

    column_list = [RouteStop.id, RouteStop.route_id, RouteStop.pickup_id, RouteStop.sequence_order, RouteStop.status]
    column_sortable_list = [RouteStop.id, RouteStop.sequence_order, RouteStop.status]
    column_filters = [RouteStop.status]


class CompostBatchAdmin(ModelView, model=CompostBatch):
    name = "Compost Batch"
    name_plural = "Compost Batches"
    icon = "fa-solid fa-seedling"
    category = "Recycling & EPR"

    column_list = [
        CompostBatch.id,
        CompostBatch.zone_id,
        CompostBatch.period_start,
        CompostBatch.period_end,
        CompostBatch.total_weight_kg,
        CompostBatch.status,
        CompostBatch.created_at,
    ]
    column_sortable_list = [CompostBatch.id, CompostBatch.total_weight_kg, CompostBatch.created_at]
    column_filters = [CompostBatch.status]


class SocietyAdmin(ModelView, model=Society):
    name = "Housing Society"
    name_plural = "Housing Societies"
    icon = "fa-solid fa-people-roof"
    category = "Community & Housing"

    column_list = [Society.id, Society.name, Society.address, Society.zone_id, Society.created_at]
    column_searchable_list = [Society.name, Society.address]
    column_sortable_list = [Society.id, Society.name, Society.created_at]


class SocietyMembershipAdmin(ModelView, model=SocietyMembership):
    name = "Society Membership"
    name_plural = "Society Memberships"
    icon = "fa-solid fa-user-group"
    category = "Community & Housing"

    column_list = [
        SocietyMembership.id,
        SocietyMembership.society_id,
        SocietyMembership.user_id,
        SocietyMembership.role,
        SocietyMembership.status,
        SocietyMembership.joined_at,
    ]
    column_sortable_list = [SocietyMembership.id, SocietyMembership.joined_at]
    column_filters = [SocietyMembership.role, SocietyMembership.status]


class UserTierRecordAdmin(ModelView, model=UserTierRecord):
    name = "User Tier"
    name_plural = "User Tiers"
    icon = "fa-solid fa-award"
    category = "Rewards & Gamification"

    column_list = [
        UserTierRecord.user_id,
        UserTierRecord.current_tier,
        UserTierRecord.points_balance,
        UserTierRecord.points_lifetime,
        UserTierRecord.tier_updated_at,
    ]
    column_sortable_list = [UserTierRecord.user_id, UserTierRecord.points_balance, UserTierRecord.tier_updated_at]
    column_filters = [UserTierRecord.current_tier]


class ComplianceScoreAdmin(ModelView, model=ComplianceScore):
    name = "Compliance Score"
    name_plural = "Compliance Scores"
    icon = "fa-solid fa-gauge-high"
    category = "Rewards & Gamification"

    column_list = [
        ComplianceScore.user_id,
        ComplianceScore.rolling_score,
        ComplianceScore.total_pickups,
        ComplianceScore.verified_pickups,
        ComplianceScore.updated_at,
    ]
    column_sortable_list = [ComplianceScore.user_id, ComplianceScore.rolling_score, ComplianceScore.updated_at]


class RedemptionCatalogAdmin(ModelView, model=RedemptionCatalog):
    name = "Catalog Item"
    name_plural = "Catalog Items"
    icon = "fa-solid fa-gift"
    category = "Rewards & Gamification"

    column_list = [RedemptionCatalog.id, RedemptionCatalog.item_name, RedemptionCatalog.category, RedemptionCatalog.points_cost, RedemptionCatalog.active]
    column_searchable_list = [RedemptionCatalog.item_name]
    column_sortable_list = [RedemptionCatalog.id, RedemptionCatalog.points_cost, RedemptionCatalog.active]
    column_filters = [RedemptionCatalog.category, RedemptionCatalog.active]


class BrandAccountAdmin(ModelView, model=BrandAccount):
    name = "Brand Account"
    name_plural = "Brand Accounts"
    icon = "fa-solid fa-briefcase"
    category = "Accounts & Identity"

    column_list = [BrandAccount.id, BrandAccount.org_name, BrandAccount.contact_email, BrandAccount.created_at]
    column_searchable_list = [BrandAccount.org_name, BrandAccount.contact_email]


class NotificationAdmin(ModelView, model=Notification):
    name = "Notification"
    name_plural = "Notifications"
    icon = "fa-solid fa-bell"
    category = "Accounts & Identity"

    column_list = [Notification.id, Notification.user_id, Notification.message, Notification.sent_at, Notification.created_at]
    column_sortable_list = [Notification.id, Notification.sent_at, Notification.created_at]


class ReferralAdmin(ModelView, model=Referral):
    name = "Referral"
    name_plural = "Referrals"
    icon = "fa-solid fa-share-nodes"
    category = "Rewards & Gamification"

    column_list = [
        Referral.id,
        Referral.referrer_id,
        Referral.referred_user_id,
        Referral.referral_code,
        Referral.status,
        Referral.points_awarded,
        Referral.created_at,
    ]
    column_filters = [Referral.status, Referral.points_awarded]


class LeaderboardOptInAdmin(ModelView, model=LeaderboardOptIn):
    name = "Leaderboard Opt-In"
    name_plural = "Leaderboard Opt-Ins"
    icon = "fa-solid fa-ranking-star"
    category = "Rewards & Gamification"

    column_list = [
        LeaderboardOptIn.user_id,
        LeaderboardOptIn.opted_in,
        LeaderboardOptIn.display_handle,
        LeaderboardOptIn.opted_in_at,
    ]
    column_filters = [LeaderboardOptIn.opted_in]


# =============================================================================
# READ-ONLY LEDGERS & AUDIT TABLES
# =============================================================================

class OTPChallengeAdmin(ModelView, model=OTPChallenge):
    name = "OTP Challenge"
    name_plural = "OTP Challenges"
    icon = "fa-solid fa-shield-halved"
    category = "Audit & Security"

    column_list = [
        OTPChallenge.id,
        OTPChallenge.phone,
        OTPChallenge.attempts,
        OTPChallenge.expires_at,
        OTPChallenge.created_at,
    ]
    column_searchable_list = [OTPChallenge.phone]
    column_sortable_list = [OTPChallenge.id, OTPChallenge.attempts, OTPChallenge.expires_at, OTPChallenge.created_at]
    column_details_exclude_list = [OTPChallenge.code_hash]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class IdempotencyKeyAdmin(ModelView, model=IdempotencyKey):
    name = "Idempotency Key"
    name_plural = "Idempotency Keys"
    icon = "fa-solid fa-fingerprint"
    category = "Audit & Security"

    column_list = [
        IdempotencyKey.key,
        IdempotencyKey.endpoint,
        IdempotencyKey.response_status,
        IdempotencyKey.created_at,
        IdempotencyKey.expires_at,
    ]
    column_searchable_list = [IdempotencyKey.key, IdempotencyKey.endpoint]
    column_sortable_list = [IdempotencyKey.created_at, IdempotencyKey.expires_at]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class RecyclingReceiptAdmin(ModelView, model=RecyclingReceipt):
    name = "Recycling Receipt"
    name_plural = "Recycling Receipts (Ledger)"
    icon = "fa-solid fa-receipt"
    category = "Recycling & EPR"

    column_list = [
        RecyclingReceipt.id,
        RecyclingReceipt.receipt_number,
        RecyclingReceipt.transaction_id,
        RecyclingReceipt.material,
        RecyclingReceipt.weight_kg,
        RecyclingReceipt.amount_credited,
        RecyclingReceipt.issued_at,
    ]
    column_searchable_list = [RecyclingReceipt.receipt_number]
    column_sortable_list = [RecyclingReceipt.id, RecyclingReceipt.amount_credited, RecyclingReceipt.issued_at]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class EPRCreditAdmin(ModelView, model=EPRCredit):
    name = "EPR Credit"
    name_plural = "EPR Credits (Ledger)"
    icon = "fa-solid fa-certificate"
    category = "Recycling & EPR"

    column_list = [
        EPRCredit.id,
        EPRCredit.receipt_id,
        EPRCredit.credit_amount,
        EPRCredit.status,
        EPRCredit.brand_id,
        EPRCredit.created_at,
    ]
    column_sortable_list = [EPRCredit.id, EPRCredit.credit_amount, EPRCredit.created_at]
    column_filters = [EPRCredit.status]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class PointsTransactionAdmin(ModelView, model=PointsTransaction):
    name = "Points Transaction"
    name_plural = "Points Ledger"
    icon = "fa-solid fa-coins"
    category = "Rewards & Gamification"

    column_list = [
        PointsTransaction.id,
        PointsTransaction.user_id,
        PointsTransaction.pickup_id,
        PointsTransaction.points,
        PointsTransaction.reason,
        PointsTransaction.status,
        PointsTransaction.created_at,
    ]
    column_sortable_list = [PointsTransaction.id, PointsTransaction.points, PointsTransaction.created_at]
    column_filters = [PointsTransaction.status]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class RewardAdmin(ModelView, model=Reward):
    name = "Reward"
    name_plural = "Rewards Ledger"
    icon = "fa-solid fa-trophy"
    category = "Rewards & Gamification"

    column_list = [Reward.id, Reward.user_id, Reward.points, Reward.source, Reward.redeemed, Reward.created_at]
    column_sortable_list = [Reward.id, Reward.points, Reward.created_at]
    column_filters = [Reward.source, Reward.redeemed]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class RedemptionAdmin(ModelView, model=Redemption):
    name = "Redemption"
    name_plural = "Redemptions (Ledger)"
    icon = "fa-solid fa-hand-holding-dollar"
    category = "Rewards & Gamification"

    column_list = [
        Redemption.id,
        Redemption.user_id,
        Redemption.catalog_item_id,
        Redemption.points_spent,
        Redemption.status,
        Redemption.created_at,
    ]
    column_sortable_list = [Redemption.id, Redemption.points_spent, Redemption.created_at]
    column_filters = [Redemption.status]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


class RecyclingTransactionAdmin(ModelView, model=RecyclingTransaction):
    name = "Recycling Transaction"
    name_plural = "Recycling Transactions"
    icon = "fa-solid fa-scale-balanced"
    category = "Recycling & EPR"

    column_list = [
        RecyclingTransaction.id,
        RecyclingTransaction.citizen_id,
        RecyclingTransaction.recycler_id,
        RecyclingTransaction.material,
        RecyclingTransaction.weight_kg,
        RecyclingTransaction.amount_credited,
        RecyclingTransaction.status,
        RecyclingTransaction.created_at,
    ]
    column_sortable_list = [RecyclingTransaction.id, RecyclingTransaction.created_at]
    column_filters = [RecyclingTransaction.status, RecyclingTransaction.material]

    # Strictly Read-Only
    can_create = False
    can_edit = False
    can_delete = False


# =============================================================================
# Admin Initialization Factory
# =============================================================================

def init_admin(app: FastAPI) -> Admin:
    """Initialize SQLAdmin with custom authentication backend and all ModelViews."""
    secret_key = get_admin_session_secret()
    auth_backend = AdminAuth(secret_key=secret_key)

    admin = Admin(
        app=app,
        engine=engine,
        authentication_backend=auth_backend,
        title="EcoSync Administration",
        base_url="/admin",
    )

    # Register ModelViews
    views = [
        UserAdmin,
        ZoneAdmin,
        VehicleAdmin,
        DriverAdmin,
        DriverLocationAdmin,
        PickupRequestAdmin,
        ComplaintAdmin,
        ComplaintHotspotAdmin,
        ComplaintUpvoteAdmin,
        RecyclerAdmin,
        RecyclerRateCardAdmin,
        BulkGeneratorAdmin,
        RouteAdmin,
        RouteStopAdmin,
        CompostBatchAdmin,
        SocietyAdmin,
        SocietyMembershipAdmin,
        UserTierRecordAdmin,
        ComplianceScoreAdmin,
        RedemptionCatalogAdmin,
        BrandAccountAdmin,
        NotificationAdmin,
        ReferralAdmin,
        LeaderboardOptInAdmin,
        # Read-only audit & ledger views
        OTPChallengeAdmin,
        IdempotencyKeyAdmin,
        RecyclingReceiptAdmin,
        EPRCreditAdmin,
        PointsTransactionAdmin,
        RewardAdmin,
        RedemptionAdmin,
        RecyclingTransactionAdmin,
    ]

    for view in views:
        admin.add_view(view)

    return admin
