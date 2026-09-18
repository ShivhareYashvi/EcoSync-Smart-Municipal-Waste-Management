from enum import StrEnum


class UserRole(StrEnum):
    CITIZEN = "citizen"
    DRIVER = "driver"
    ADMIN = "admin"
    RECYCLER = "recycler"


class WasteType(StrEnum):
    WET = "wet"
    DRY = "dry"
    E_WASTE = "e-waste"
    BULKY = "bulky"


class PickupStatus(StrEnum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ComplaintCategory(StrEnum):
    MISSED_PICKUP = "missed_pickup"
    ILLEGAL_DUMPING = "illegal_dumping"
    DAMAGED_BIN = "damaged_bin"
    DRIVER_BEHAVIOR = "driver_behavior"
    OTHER = "other"


class ComplaintStatus(StrEnum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    REJECTED = "rejected"


class RewardSource(StrEnum):
    PICKUP_COMPLETION = "pickup_completion"
    RECYCLING_PARTICIPATION = "recycling_participation"
    COMPLAINT_RESOLUTION = "complaint_resolution"
    ADMIN_ADJUSTMENT = "admin_adjustment"


class DriverAvailability(StrEnum):
    AVAILABLE = "available"
    ON_ROUTE = "on_route"
    OFF_DUTY = "off_duty"
    SUSPENDED = "suspended"


# ── Phase 1: Collection loop & rewards ───────────────────────────────────────


class WasteCategory(StrEnum):
    """Driver-logged waste classification at the point of collection.

    Distinct from WasteType (citizen scheduling category) — this captures
    the actual category verified by the driver during pickup.
    """

    WET = "wet"
    DRY = "dry"
    HAZARDOUS = "hazardous"
    E_WASTE = "e_waste"
    MIXED = "mixed"


class PointsTransactionStatus(StrEnum):
    """Lifecycle state of a points award in the ledger."""

    PENDING = "pending"      # segregation_verified=False; awaiting manual review
    APPROVED = "approved"    # citizen confirmed or auto-approved
    FLAGGED = "flagged"      # citizen disputed; excluded from compliance score


class UserTier(StrEnum):
    """Gamification tier derived from lifetime points and zero dispute flags."""

    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"


class CatalogCategory(StrEnum):
    """Functional category of a redemption catalog item."""

    UTILITY_CREDIT = "utility_credit"
    SERVICE_PERK = "service_perk"
    VOUCHER = "voucher"


class RedemptionStatus(StrEnum):
    """Processing state of a citizen redemption request."""

    REQUESTED = "requested"
    FULFILLED = "fulfilled"
    CANCELLED = "cancelled"


# ── Phase 2: Municipal Operations & Compliance ─────────────────────────────


class FuelType(StrEnum):
    """Vehicle powertrain fuel/energy classification."""

    DIESEL = "diesel"
    CNG = "cng"
    ELECTRIC = "electric"
    PETROL = "petrol"


class BulkGeneratorCategory(StrEnum):
    """Facility classification for high-volume commercial waste producers."""

    HOTEL = "hotel"
    MALL = "mall"
    APARTMENT_COMPLEX = "apartment_complex"
    OFFICE = "office"
    OTHER = "other"


class BillingStatus(StrEnum):
    """Administrative status of a commercial generator account."""

    ACTIVE = "active"
    SUSPENDED = "suspended"


class RouteStatus(StrEnum):
    """Lifecycle state of a driver's municipal route."""

    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class RouteStopStatus(StrEnum):
    """Progress status of an individual pickup stop on a route."""

    PENDING = "pending"
    ARRIVED = "arrived"
    SKIPPED = "skipped"


class HotspotStatus(StrEnum):
    """Resolution status of an identified high-density complaint hotspot."""

    ACTIVE = "active"
    RESOLVED = "resolved"


# ── Phase 3: Marketplace Mechanics (Ledger-Only) ──────────────────────────


class MaterialType(StrEnum):
    """Segregated recyclable materials accepted in marketplace."""

    PLASTIC = "plastic"
    PAPER = "paper"
    METAL = "metal"
    E_WASTE = "e_waste"
    GLASS = "glass"


class RecyclerVerificationStatus(StrEnum):
    """Administrative verification status of a registered recycler."""

    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class RecyclingTransactionStatus(StrEnum):
    """Lifecycle state of a citizen-to-recycler material sale."""

    REQUESTED = "requested"
    LOGGED = "logged"
    CONFIRMED = "confirmed"
    DISPUTED = "disputed"


class EPRCreditStatus(StrEnum):
    """Availability status of an Extended Producer Responsibility credit."""

    AVAILABLE = "available"
    CLAIMED = "claimed"


class CompostBatchStatus(StrEnum):
    """Processing stage of a municipal organic compost batch."""

    COLLECTED = "collected"
    COMPOSTING = "composting"
    COMPLETED = "completed"

