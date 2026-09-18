from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import CatalogCategory, RedemptionStatus


class RedemptionCatalogRead(BaseModel):
    """Active item in the closed-loop rewards catalog."""

    id: int
    item_name: str
    points_cost: int
    category: CatalogCategory
    active: bool

    model_config = {"from_attributes": True}


class RedemptionCreate(BaseModel):
    """Request to spend points on a catalog item."""

    catalog_item_id: int = Field(gt=0)


class RedemptionRead(BaseModel):
    """Serialised view of a citizen redemption request."""

    id: int
    user_id: int
    catalog_item_id: int | None
    points_spent: int
    status: RedemptionStatus
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
