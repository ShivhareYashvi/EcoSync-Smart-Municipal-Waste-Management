from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import MaterialType, RecyclingTransactionStatus


class TransactionCreate(BaseModel):
    recycler_id: int
    material: MaterialType
    estimated_weight_kg: Decimal = Field(gt=0, decimal_places=2, description="Citizen-estimated weight in kg")


class TransactionLogRequest(BaseModel):
    weight_kg: Decimal = Field(gt=0, decimal_places=2, description="Recycler-verified actual weight in kg")
    material: MaterialType | None = Field(default=None, description="Material type (if adjusted upon physical verification)")
    photo_url: str | None = Field(default=None, max_length=512, description="Proof-of-collection photo URL")


class TransactionDisputeRequest(BaseModel):
    reason: str | None = Field(default=None, max_length=500, description="Reason for citizen dispute")


class ReceiptRead(BaseModel):
    id: int
    transaction_id: int
    receipt_number: str
    material: MaterialType
    weight_kg: Decimal
    amount_credited: Decimal
    issued_at: datetime

    model_config = {"from_attributes": True}


class TransactionRead(BaseModel):
    id: int
    citizen_id: int
    citizen_name: str | None = None
    citizen_phone: str | None = None
    recycler_id: int
    recycler_business_name: str | None = None
    material: MaterialType
    estimated_weight_kg: Decimal | None
    weight_kg: Decimal | None
    rate_applied: Decimal | None
    amount_credited: Decimal | None
    photo_url: str | None
    status: RecyclingTransactionStatus
    created_at: datetime
    receipt: ReceiptRead | None = None

    model_config = {"from_attributes": True}
