from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.enums import CompostBatchStatus


class CompostBatchCreate(BaseModel):
    zone_id: int
    period_start: date
    period_end: date
    total_weight_kg: Decimal | None = Field(default=None, gt=0, decimal_places=2, description="Optional manual override; auto-calculated from wet pickups if omitted")
    buyer_note: str | None = Field(default=None, max_length=500)


class CompostBatchStatusUpdate(BaseModel):
    status: CompostBatchStatus
    buyer_note: str | None = Field(default=None, max_length=500)


class CompostBatchRead(BaseModel):
    id: int
    zone_id: int
    zone_name: str | None = None
    period_start: date
    period_end: date
    total_weight_kg: Decimal
    status: CompostBatchStatus
    buyer_note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
