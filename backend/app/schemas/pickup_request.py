from datetime import date, datetime, time
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import PickupStatus, WasteCategory, WasteType


class Coordinates(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class PickupRequestBase(BaseModel):
    waste_type: WasteType
    scheduled_date: date
    scheduled_time: time
    coordinates: Coordinates | dict[str, Any] | None = None
    notes: str | None = Field(default=None, max_length=1000)


class PickupRequestCreate(PickupRequestBase):
    user_id: int


class PickupAssignment(BaseModel):
    driver_id: int


class PickupStatusUpdate(BaseModel):
    status: PickupStatus
    notes: str | None = Field(default=None, max_length=1000)


class PickupLogPayload(BaseModel):
    """Payload submitted by a driver after completing a pickup."""

    weight_kg: float = Field(gt=0, lt=500, description="Collected weight in kg (0–500)")
    waste_category: WasteCategory
    photo_url: str | None = Field(default=None, max_length=512)


class PickupDisputePayload(BaseModel):
    """Citizen free-text reason for disputing a logged pickup."""

    reason: str = Field(min_length=5, max_length=1000)


class PickupRequestRead(PickupRequestBase):
    id: int
    user_id: int
    driver_id: int | None
    status: PickupStatus
    # Phase 1 fields — nullable until driver logs them
    weight_kg: float | None = None
    waste_category: WasteCategory | None = None
    segregation_verified: bool = False
    photo_url: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
