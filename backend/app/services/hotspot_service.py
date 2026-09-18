"""Complaint heatmap, hotspot detection, and SLA calculation service."""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.complaint_hotspot import ComplaintHotspot
from app.models.enums import ComplaintStatus, HotspotStatus
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.models.zone import Zone
from app.schemas.phase2 import (
    ComplaintHotspotRead,
    HeatmapPoint,
    HeatmapResponse,
    ZoneSLARead,
)
from app.services.zone_service import ZONE_DEPOTS

# Configurable threshold for hotspot flagging
HOTSPOT_COMPLAINT_THRESHOLD: int = 3
OVERDUE_DAYS: int = 7
HOTSPOT_WINDOW_DAYS: int = 30


def _depot_coords_for_zone(zone: Zone | None) -> tuple[float, float]:
    """Return depot coordinates for a zone, or a default India center."""
    if zone and zone.code in ZONE_DEPOTS:
        return ZONE_DEPOTS[zone.code]
    return (20.5937, 78.9629)


class HotspotService:
    """Manages complaint heatmaps, hotspot flagging, and SLA tracking."""

    # ── Heatmap ───

    def get_heatmap(self, session: Session) -> HeatmapResponse:
        """
        Return one heatmap point per complaint that has location data.
        Coordinates are sourced (in priority order):
          1. The associated pickup_request's coordinates
          2. The zone's depot coordinates (if the complaint has a zone_id)
          3. Default India center (20.59, 78.96)
        """
        complaints = session.scalars(select(Complaint)).all()
        points: list[HeatmapPoint] = []

        for complaint in complaints:
            lat: float | None = None
            lng: float | None = None
            zone_name: str | None = None

            # Try to get coords from a recent pickup of the same user
            pickup = session.scalar(
                select(PickupRequest)
                .where(
                    PickupRequest.user_id == complaint.user_id,
                    PickupRequest.coordinates.is_not(None),
                )
                .order_by(PickupRequest.created_at.desc())
                .limit(1)
            )
            if pickup and pickup.coordinates:
                lat = pickup.coordinates.get("latitude")
                lng = pickup.coordinates.get("longitude")

            if lat is None or lng is None:
                # Fall back to zone depot
                zone: Zone | None = None
                if complaint.zone_id:
                    zone = session.scalar(select(Zone).where(Zone.id == complaint.zone_id))
                fallback = _depot_coords_for_zone(zone)
                lat, lng = fallback
                zone_name = zone.name if zone else None
            else:
                if complaint.zone_id:
                    zone = session.scalar(select(Zone).where(Zone.id == complaint.zone_id))
                    zone_name = zone.name if zone else None

            if lat is not None and lng is not None:
                points.append(
                    HeatmapPoint(
                        latitude=lat,
                        longitude=lng,
                        weight=1,
                        zone_id=complaint.zone_id,
                        zone_name=zone_name,
                    )
                )
        return HeatmapResponse(points=points)

    # ── Hotspot detection (called by scheduler) ─

    def run_hotspot_detection(self, session: Session) -> dict[str, int]:
        """
        Group complaints by zone over a rolling 30-day window.
        Flag zones crossing HOTSPOT_COMPLAINT_THRESHOLD as active hotspots.
        Mark resolved when the count drops back below threshold.
        """
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(days=HOTSPOT_WINDOW_DAYS)
        flagged = 0
        resolved = 0

        zones = session.scalars(select(Zone)).all()
        for zone in zones:
            count = session.scalar(
                select(func.count(Complaint.id)).where(
                    Complaint.zone_id == zone.id,
                    Complaint.created_at >= window_start,
                )
            ) or 0

            hotspot = session.scalar(
                select(ComplaintHotspot).where(
                    ComplaintHotspot.zone_id == zone.id,
                    ComplaintHotspot.status == HotspotStatus.ACTIVE,
                )
            )

            if count >= HOTSPOT_COMPLAINT_THRESHOLD:
                if hotspot is None:
                    session.add(
                        ComplaintHotspot(
                            zone_id=zone.id,
                            complaint_count=count,
                            first_flagged_at=now,
                            status=HotspotStatus.ACTIVE,
                        )
                    )
                    flagged += 1
                else:
                    hotspot.complaint_count = count
            else:
                if hotspot is not None:
                    hotspot.status = HotspotStatus.RESOLVED
                    hotspot.resolved_at = now
                    resolved += 1

        session.commit()
        return {"flagged": flagged, "resolved": resolved}

    # ── Hotspot listing ─────────────────────────

    def list_hotspots(
        self,
        session: Session,
        active_only: bool = False,
    ) -> list[ComplaintHotspotRead]:
        query = select(ComplaintHotspot).order_by(ComplaintHotspot.first_flagged_at.desc())
        if active_only:
            query = query.where(ComplaintHotspot.status == HotspotStatus.ACTIVE)
        hotspots = session.scalars(query).all()
        result = []
        for hs in hotspots:
            zone = session.scalar(select(Zone).where(Zone.id == hs.zone_id))
            result.append(
                ComplaintHotspotRead(
                    id=hs.id,
                    zone_id=hs.zone_id,
                    zone_name=zone.name if zone else None,
                    complaint_count=hs.complaint_count,
                    first_flagged_at=hs.first_flagged_at,
                    status=hs.status.value,
                    resolved_at=hs.resolved_at,
                )
            )
        return result

    # ── SLA ──────

    def get_zone_sla(self, session: Session) -> list[ZoneSLARead]:
        zones = session.scalars(select(Zone)).all()
        now = datetime.now(timezone.utc)
        overdue_cutoff = now - timedelta(days=OVERDUE_DAYS)
        result = []

        for zone in zones:
            complaints = session.scalars(
                select(Complaint).where(Complaint.zone_id == zone.id)
            ).all()

            resolved = [c for c in complaints if c.resolved_at is not None]
            avg_hours: float | None = None
            if resolved:
                total_hours = sum(
                    (c.resolved_at - c.created_at).total_seconds() / 3600
                    for c in resolved
                    if c.resolved_at is not None
                )
                avg_hours = round(total_hours / len(resolved), 1)

            open_complaints = [c for c in complaints if c.status == ComplaintStatus.OPEN]
            overdue = [c for c in open_complaints if c.created_at < overdue_cutoff]

            result.append(
                ZoneSLARead(
                    zone_id=zone.id,
                    zone_name=zone.name,
                    avg_resolution_hours=avg_hours,
                    open_complaints=len(open_complaints),
                    overdue_complaints=len(overdue),
                )
            )
        return result


hotspot_service = HotspotService()
