from datetime import datetime

from pydantic import BaseModel, Field


class ComplianceScoreRead(BaseModel):
    """Rolling 90-day compliance score for a citizen account."""

    user_id: int
    rolling_score: float = Field(ge=0, le=100)
    total_pickups: int
    verified_pickups: int
    updated_at: datetime

    model_config = {"from_attributes": True}
