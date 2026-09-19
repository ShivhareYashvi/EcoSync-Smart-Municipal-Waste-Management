from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class LeaderboardSettingsRead(BaseModel):
    """User's current leaderboard opt-in preferences."""

    user_id: int
    opted_in: bool
    display_handle: Optional[str] = None
    opted_in_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LeaderboardSettingsUpdate(BaseModel):
    """Payload to update leaderboard opt-in status and custom display handle."""

    opted_in: bool
    display_handle: Optional[str] = Field(default=None, max_length=50)


class IndividualLeaderboardEntry(BaseModel):
    """Ranked entry for opted-in citizen on individual leaderboard."""

    rank: int
    user_id: int
    display_handle: str
    points: int
    compliance_score: float
    verified_pickups: int
    zone_id: Optional[int] = None
    society_id: Optional[int] = None


class SocietyLeaderboardEntry(BaseModel):
    """Ranked entry for housing society on community leaderboard."""

    rank: int
    society_id: int
    society_name: str
    zone_id: int
    active_members: int
    average_compliance: float
    total_verified_pickups: int
    total_points: int
