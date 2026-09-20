"""Compliance score endpoint."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.compliance import ComplianceScoreRead
from app.services.compliance_service import compliance_service

router = APIRouter(tags=["compliance"])


@router.get("/users/{user_id}/compliance", response_model=ComplianceScoreRead)
def get_compliance_score(
    user_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> ComplianceScoreRead:
    """Return the rolling 90-day compliance score for a citizen.

    Used by the citizen's own dashboard and admin per-user view.
    Returns 404 if the user has no pickup history yet.
    """
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view compliance for this user",
        )

    score = compliance_service.get(session, user_id)
    if score is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No compliance record found. Complete a pickup first.",
        )
    return score

