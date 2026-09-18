from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import MaterialType, RecyclerVerificationStatus


class RateCardCreate(BaseModel):
    material: MaterialType
    rate_per_kg: Decimal = Field(gt=0, decimal_places=2, description="Price offered per kilogram in INR")


class RateCardRead(BaseModel):
    id: int
    recycler_id: int
    material: MaterialType
    rate_per_kg: Decimal
    effective_from: datetime
    active: bool

    model_config = {"from_attributes": True}


class PublicRateRead(BaseModel):
    id: int
    recycler_id: int
    recycler_business_name: str
    service_zone_ids: list[int]
    material: MaterialType
    rate_per_kg: Decimal
    effective_from: datetime

    model_config = {"from_attributes": True}


class RecyclerVerifyRequest(BaseModel):
    status: RecyclerVerificationStatus = Field(description="New verification status: verified or rejected")


class RecyclerRead(BaseModel):
    id: int
    user_id: int
    business_name: str
    materials_accepted: list[MaterialType]
    service_zone_ids: list[int]
    verification_status: RecyclerVerificationStatus
    verification_doc_url: str | None
    rate_cards: list[RateCardRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
