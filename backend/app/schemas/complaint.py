from datetime import datetime

from pydantic import BaseModel, Field

from app.models.enums import ComplaintCategory, ComplaintStatus


class ComplaintBase(BaseModel):
    category: ComplaintCategory
    description: str = Field(min_length=10, max_length=2000)
    image: str | None = Field(default=None, max_length=512)


class ComplaintCreate(ComplaintBase):
    user_id: int


class ComplaintStatusUpdate(BaseModel):
    status: ComplaintStatus


class ComplaintRead(ComplaintBase):
    id: int
    user_id: int
    zone_id: int | None = None
    status: ComplaintStatus
    resolved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    upvote_count: int = 0
    user_has_upvoted: bool = False

    model_config = {"from_attributes": True}


class ComplaintUpvoteResponse(BaseModel):
    """Response returned when a complaint upvote is toggled."""

    upvoted: bool
    upvote_count: int
