from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.enums import SocietyMemberRole, SocietyMemberStatus


class SocietyCreate(BaseModel):
    """Payload to register a new housing society."""

    name: str = Field(min_length=2, max_length=255)
    address: str = Field(min_length=5)
    zone_id: int
    registration_doc_path: Optional[str] = None


class SocietyRead(BaseModel):
    """Public read schema for a housing society."""

    id: int
    name: str
    address: str
    zone_id: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SocietyMembershipRead(BaseModel):
    """Read schema for a society membership."""

    id: int
    user_id: int
    society_id: int
    role: SocietyMemberRole
    status: SocietyMemberStatus
    registration_doc_path: Optional[str] = None
    joined_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    society_name: Optional[str] = None

    model_config = {"from_attributes": True}


class SocietyDashboardRead(BaseModel):
    """Strictly aggregated society dashboard.

    Never exposes individual household identifiers or row-level metrics.
    If active members < 3, metrics are suppressed to ensure k-anonymity.
    """

    society_id: int
    society_name: str
    zone_id: int
    total_members: int
    active_members: int
    privacy_suppressed: bool
    message: Optional[str] = None
    average_compliance: Optional[float] = None
    total_verified_pickups: Optional[int] = None
    total_points_earned: Optional[int] = None
    zone_rank: Optional[int] = None


class RWAAdminVerifyRequest(BaseModel):
    """Payload for municipal admin to approve or reject an RWA admin request."""

    status: SocietyMemberStatus = Field(
        description="Must be 'active' to approve or 'pending'/'rejected' to reject."
    )
