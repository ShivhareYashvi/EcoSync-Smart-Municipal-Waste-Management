from app.models.brand_account import BrandAccount
from app.models.bulk_generator import BulkGenerator
from app.models.complaint import Complaint
from app.models.complaint_hotspot import ComplaintHotspot
from app.models.complaint_upvote import ComplaintUpvote
from app.models.compliance_score import ComplianceScore
from app.models.compost_batch import CompostBatch
from app.models.driver import Driver
from app.models.driver_location import DriverLocation
from app.models.enums import (
    BillingStatus,
    BulkGeneratorCategory,
    CatalogCategory,
    ComplaintCategory,
    ComplaintStatus,
    CompostBatchStatus,
    DriverAvailability,
    EPRCreditStatus,
    FuelType,
    HotspotStatus,
    MaterialType,
    PickupStatus,
    PointsTransactionStatus,
    RecyclerVerificationStatus,
    RecyclingTransactionStatus,
    RedemptionStatus,
    ReferralStatus,
    RewardSource,
    RouteStatus,
    RouteStopStatus,
    SocietyMemberRole,
    SocietyMemberStatus,
    UserRole,
    UserTier,
    WasteCategory,
    WasteType,
)
from app.models.epr_credit import EPRCredit
from app.models.leaderboard_opt_in import LeaderboardOptIn
from app.models.notification import Notification
from app.models.otp_challenge import OTPChallenge
from app.models.pickup_request import PickupRequest
from app.models.points_transaction import PointsTransaction
from app.models.recycler import Recycler
from app.models.recycler_rate_card import RecyclerRateCard
from app.models.recycling_receipt import RecyclingReceipt
from app.models.recycling_transaction import RecyclingTransaction
from app.models.redemption import Redemption
from app.models.redemption_catalog import RedemptionCatalog
from app.models.idempotency_key import IdempotencyKey
from app.models.referral import Referral
from app.models.reward import Reward
from app.models.route import Route, RouteStop
from app.models.society import Society
from app.models.society_membership import SocietyMembership
from app.models.user import User
from app.models.user_tier import UserTierRecord
from app.models.vehicle import Vehicle
from app.models.zone import Zone

__all__ = [
    # Core
    "Complaint",
    "ComplaintCategory",
    "ComplaintStatus",
    "Driver",
    "DriverAvailability",
    "DriverLocation",
    "IdempotencyKey",
    "Notification",
    "OTPChallenge",
    "PickupRequest",
    "PickupStatus",
    "Reward",
    "RewardSource",
    "User",
    "UserRole",
    "WasteType",
    # Collection & Rewards
    "CatalogCategory",
    "ComplianceScore",
    "PointsTransaction",
    "PointsTransactionStatus",
    "Redemption",
    "RedemptionCatalog",
    "RedemptionStatus",
    "UserTier",
    "UserTierRecord",
    "WasteCategory",
    # Municipal Operations & Fleet
    "BillingStatus",
    "BulkGenerator",
    "BulkGeneratorCategory",
    "ComplaintHotspot",
    "FuelType",
    "HotspotStatus",
    "Route",
    "RouteStatus",
    "RouteStop",
    "RouteStopStatus",
    "Vehicle",
    "Zone",
    # Recycler Marketplace & EPR Ledger
    "BrandAccount",
    "CompostBatch",
    "CompostBatchStatus",
    "EPRCredit",
    "EPRCreditStatus",
    "MaterialType",
    "Recycler",
    "RecyclerRateCard",
    "RecyclerVerificationStatus",
    "RecyclingReceipt",
    "RecyclingTransaction",
    "RecyclingTransactionStatus",
    # Citizen Engagement & Community
    "ComplaintUpvote",
    "LeaderboardOptIn",
    "Referral",
    "ReferralStatus",
    "Society",
    "SocietyMemberRole",
    "SocietyMemberStatus",
    "SocietyMembership",
]

