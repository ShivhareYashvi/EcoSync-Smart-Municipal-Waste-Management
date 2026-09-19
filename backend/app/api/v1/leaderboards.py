from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.leaderboard import (
    IndividualLeaderboardEntry,
    LeaderboardSettingsRead,
    LeaderboardSettingsUpdate,
    SocietyLeaderboardEntry,
)
from app.services.leaderboard_service import leaderboard_service

router = APIRouter(tags=["leaderboards"])


@router.get("/users/me/leaderboard-settings", response_model=LeaderboardSettingsRead)
@router.get("/leaderboards/settings/me", response_model=LeaderboardSettingsRead)
def get_my_leaderboard_settings(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> LeaderboardSettingsRead:
    """Retrieve the current user's leaderboard opt-in preferences."""
    settings = leaderboard_service.get_or_create_settings(session, current_user.id)
    return LeaderboardSettingsRead.model_validate(settings)


@router.patch("/users/me/leaderboard-settings", response_model=LeaderboardSettingsRead)
@router.patch("/leaderboards/settings/me", response_model=LeaderboardSettingsRead)
def update_my_leaderboard_settings(
    payload: LeaderboardSettingsUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> LeaderboardSettingsRead:
    """Update opt-in status and custom display handle."""
    updated = leaderboard_service.update_settings(session, current_user.id, payload)
    return LeaderboardSettingsRead.model_validate(updated)


@router.get("/leaderboards/individual", response_model=list[IndividualLeaderboardEntry])
def get_individual_leaderboard(
    scope: str = Query(default="city", pattern="^(city|zone|society)$"),
    zone_id: int | None = Query(default=None),
    society_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db),
) -> list[IndividualLeaderboardEntry]:
    """Rank opted-in citizens.

    Strict Privacy Enforcement:
    - Only users who explicitly set opted_in = True are returned.
    - Non-opted-in users are completely omitted.
    - Displays custom handle or fallback Resident #XXXX.
    """
    return leaderboard_service.get_individual_leaderboard(
        session=session,
        scope=scope,
        zone_id=zone_id,
        society_id=society_id,
        limit=limit,
    )


@router.get("/leaderboards/societies", response_model=list[SocietyLeaderboardEntry])
def get_society_leaderboard(
    zone_id: int | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    session: Session = Depends(get_db),
) -> list[SocietyLeaderboardEntry]:
    """Rank housing societies by compliance and volume.

    Privacy Enforcement:
    - Small cohort societies (<3 active members) are excluded.
    """
    return leaderboard_service.get_society_leaderboard(
        session=session,
        zone_id=zone_id,
        limit=limit,
    )
