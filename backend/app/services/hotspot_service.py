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
from app.schemas.operations import (
    ComplaintHotspotRead,
    HeatmapPoint,
    HeatmapResponse,
    ZoneSLARead,
)
from app.services.zone_service import ZONE_DEPOTS

# Configurable threshold for hotspot flagging
HOTSPOT_COMPLAINT_THRESHOLD: int = 3
OVERDUE_DAYS: int = 1  # 24-hour statutory municipal grievance SLA
HOTSPOT_WINDOW_DAYS: int = 30


def _depot_coords_for_zone(zone: Zone | None) -> tuple[float, float]:
    """Return depot coordinates for a zone, or a default India center."""
    if zone and zone.code in ZONE_DEPOTS:
        return ZONE_DEPOTS[zone.code]
    return (20.5937, 78.9629)


class HotspotService:
    """Manages complaint heatmaps, hotspot flagging, and SLA tracking."""

    #  Heatmap ─

    def get_heatmap(self, session: Session) -> HeatmapResponse:
        """
        Return one heatmap point per complaint that has location data.
        Optimized with batched SQL queries to scale cleanly across thousands of complaints.
        """
        complaints = session.scalars(select(Complaint)).all()
        if not complaints:
            return HeatmapResponse(points=[])

        # Pre-fetch zones into memory map (avoids N queries)
        zones_map: dict[int, Zone] = {
            z.id: z for z in session.scalars(select(Zone)).all()
        }

        # Pre-fetch latest coordinates for all complaint authors (avoids N queries)
        user_ids = {c.user_id for c in complaints if c.user_id}
        latest_coords: dict[int, tuple[float, float]] = {}
        if user_ids:
            recent_pickups = session.scalars(
                select(PickupRequest)
                .where(
                    PickupRequest.user_id.in_(user_ids),
                    PickupRequest.coordinates.is_not(None),
                )
                .order_by(PickupRequest.created_at.desc())
            ).all()
            for p in recent_pickups:
                if p.user_id not in latest_coords and p.coordinates:
                    p_lat = p.coordinates.get("latitude")
                    p_lng = p.coordinates.get("longitude")
                    if p_lat is not None and p_lng is not None:
                        latest_coords[p.user_id] = (float(p_lat), float(p_lng))

        points: list[HeatmapPoint] = []
        for complaint in complaints:
            lat: float | None = None
            lng: float | None = None
            zone = zones_map.get(complaint.zone_id) if complaint.zone_id else None
            zone_name = zone.name if zone else None

            # Priority 1: User's latest pickup GPS coordinates
            if complaint.user_id and complaint.user_id in latest_coords:
                lat, lng = latest_coords[complaint.user_id]
            else:
                # Priority 2: Zone depot fallback
                lat, lng = _depot_coords_for_zone(zone)

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

    #  Hotspot detection (called by scheduler) ─

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

    #  Hotspot listing 

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

    #  SLA 

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
