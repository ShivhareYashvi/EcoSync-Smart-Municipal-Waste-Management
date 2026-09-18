from app.models.bulk_generator import BulkGenerator
from app.models.complaint import Complaint
from app.models.complaint_hotspot import ComplaintHotspot
from app.models.compliance_score import ComplianceScore
from app.models.driver import Driver
from app.models.driver_location import DriverLocation
from app.models.enums import (
    BillingStatus,
    BulkGeneratorCategory,
    CatalogCategory,
    ComplaintCategory,
    ComplaintStatus,
    DriverAvailability,
    FuelType,
    HotspotStatus,
    PickupStatus,
    PointsTransactionStatus,
    RedemptionStatus,
    RewardSource,
    RouteStatus,
    RouteStopStatus,
    UserRole,
    UserTier,
    WasteCategory,
    WasteType,
)
from app.models.notification import Notification
from app.models.otp_challenge import OTPChallenge
from app.models.pickup_request import PickupRequest
from app.models.points_transaction import PointsTransaction
from app.models.redemption import Redemption
from app.models.redemption_catalog import RedemptionCatalog
from app.models.reward import Reward
from app.models.route import Route, RouteStop
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
    "Notification",
    "OTPChallenge",
    "PickupRequest",
    "PickupStatus",
    "Reward",
    "RewardSource",
    "User",
    "UserRole",
    "WasteType",
    # Phase 1
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
    # Phase 2
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
]

