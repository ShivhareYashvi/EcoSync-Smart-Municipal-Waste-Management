"""Complaint heatmap, hotspot, and SLA API endpoints."""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.complaint import Complaint
from app.models.enums import ComplaintStatus
from app.schemas.complaint import ComplaintRead
from app.schemas.phase2 import ComplaintHotspotRead, HeatmapResponse, ZoneSLARead
from app.services.hotspot_service import OVERDUE_DAYS, hotspot_service

router = APIRouter(tags=["complaints-phase2"])


@router.get("/complaints/heatmap", response_model=HeatmapResponse)
def complaint_heatmap(session: Session = Depends(get_db)) -> HeatmapResponse:
    """Return lat/lng heat-layer data for all complaints."""
    return hotspot_service.get_heatmap(session)


@router.get("/complaints/hotspots", response_model=list[ComplaintHotspotRead])
def list_hotspots(
    active_only: bool = Query(default=False),
    session: Session = Depends(get_db),
) -> list[ComplaintHotspotRead]:
    """List complaint hotspots, optionally filtered to active ones only."""
    return hotspot_service.list_hotspots(session, active_only=active_only)


@router.get("/complaints/sla", response_model=list[ZoneSLARead])
def complaint_sla(session: Session = Depends(get_db)) -> list[ZoneSLARead]:
    """Return average complaint resolution time and overdue counts per zone."""
    return hotspot_service.get_zone_sla(session)


@router.get("/complaints/overdue", response_model=list[ComplaintRead])
def list_overdue_complaints(session: Session = Depends(get_db)) -> list[ComplaintRead]:
    """Return complaints open longer than 7 days (for admin flagging UI)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=OVERDUE_DAYS)
    complaints = session.scalars(
        select(Complaint).where(
            Complaint.status == ComplaintStatus.OPEN,
            Complaint.created_at < cutoff,
        )
    ).all()
    return [ComplaintRead.model_validate(c) for c in complaints]
