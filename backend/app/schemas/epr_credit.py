from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field

from app.models.enums import EPRCreditStatus, MaterialType


class BrandAccountCreate(BaseModel):
    org_name: str = Field(min_length=2, max_length=255)
    contact_email: EmailStr


class BrandAccountRead(BaseModel):
    id: int
    org_name: str
    contact_email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EPRClaimRequest(BaseModel):
    brand_id: int = Field(description="ID of the brand account to assign this EPR credit to")


class EPRCreditRead(BaseModel):
    id: int
    receipt_id: int
    receipt_number: str | None = None
    material: MaterialType | None = None
    credit_amount: Decimal
    status: EPRCreditStatus
    brand_id: int | None = None
    brand_name: str | None = None
    created_at: datetime
    claimed_at: datetime | None = None

    model_config = {"from_attributes": True}
