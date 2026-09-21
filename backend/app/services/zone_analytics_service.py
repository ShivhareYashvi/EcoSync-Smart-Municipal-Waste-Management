"""Zone analytics service: per-zone compliance, SLA, missed pickups, kg collected."""

from __future__ import annotations

import csv
from io import StringIO

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.complaint_hotspot import ComplaintHotspot
from app.models.compliance_score import ComplianceScore
from app.models.enums import ComplaintStatus, HotspotStatus, PickupStatus
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.models.zone import Zone
from app.schemas.operations import CityWideAnalytics, ZoneAnalytics


class ZoneAnalyticsService:
    """Compute per-zone and city-wide operational KPIs."""

    def get_zone_analytics(self, session: Session, zone_id: int) -> ZoneAnalytics:
        zone = session.scalar(select(Zone).where(Zone.id == zone_id))
        if zone is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
        return self._compute_for_zone(session, zone)

    def get_city_wide_analytics(self, session: Session) -> CityWideAnalytics:
        zones = session.scalars(select(Zone)).all()
        if not zones:
            return CityWideAnalytics(zones=[], city="")
        city = zones[0].city
        zone_analytics = [self._compute_for_zone(session, z) for z in zones]
        return CityWideAnalytics(zones=zone_analytics, city=city)

    def export_zone_csv(self, session: Session, zone_id: int) -> str:
        analytics = self.get_zone_analytics(session, zone_id)
        buf = StringIO()
        writer = csv.DictWriter(buf, fieldnames=[
            "zone_id", "zone_name", "segregation_compliance_pct",
            "avg_complaint_sla_hours", "missed_pickup_rate_pct",
            "total_kg_collected", "active_hotspot_count",
        ])
        writer.writeheader()
        writer.writerow({
            "zone_id": analytics.zone_id,
            "zone_name": analytics.zone_name,
            "segregation_compliance_pct": analytics.segregation_compliance_pct,
            "avg_complaint_sla_hours": analytics.avg_complaint_sla_hours,
            "missed_pickup_rate_pct": analytics.missed_pickup_rate_pct,
            "total_kg_collected": analytics.total_kg_collected,
            "active_hotspot_count": analytics.active_hotspot_count,
        })
        return buf.getvalue()

    def _compute_for_zone(self, session: Session, zone: Zone) -> ZoneAnalytics:
        #  Users in this zone 
        user_ids = [
            u.id for u in session.scalars(select(User).where(User.zone_id == zone.id)).all()
        ]

        #  Segregation compliance: avg rolling_score of users in zone 
        compliance_records = session.scalars(
            select(ComplianceScore).where(ComplianceScore.user_id.in_(user_ids))
        ).all() if user_ids else []
        if compliance_records:
            avg_compliance = sum(c.rolling_score for c in compliance_records) / len(compliance_records)
        else:
            avg_compliance = 0.0

        #  Complaint SLA: avg resolution time in hours 
        zone_complaints = session.scalars(
            select(Complaint).where(Complaint.zone_id == zone.id)
        ).all()
        resolved = [c for c in zone_complaints if c.resolved_at is not None]
        avg_sla: float | None = None
        if resolved:
            total_hours = sum(
                (c.resolved_at - c.created_at).total_seconds() / 3600
                for c in resolved
                if c.resolved_at is not None
            )
            avg_sla = round(total_hours / len(resolved), 1)

        #  Pickups: missed rate and total kg ─
        zone_pickups = session.scalars(
            select(PickupRequest).where(PickupRequest.zone_id == zone.id)
        ).all()
        total_pickups = len(zone_pickups)
        cancelled = sum(1 for p in zone_pickups if p.status == PickupStatus.CANCELLED)
        missed_rate = round((cancelled / total_pickups * 100), 1) if total_pickups > 0 else 0.0
        total_kg = round(sum(p.weight_kg for p in zone_pickups if p.weight_kg is not None), 2)

        #  Active hotspots 
        active_hotspots = session.scalar(
            select(func.count(ComplaintHotspot.id)).where(
                ComplaintHotspot.zone_id == zone.id,
                ComplaintHotspot.status == HotspotStatus.ACTIVE,
            )
        ) or 0

        return ZoneAnalytics(
            zone_id=zone.id,
            zone_name=zone.name,
            segregation_compliance_pct=round(avg_compliance, 1),
            avg_complaint_sla_hours=avg_sla,
            missed_pickup_rate_pct=missed_rate,
            total_kg_collected=total_kg,
            active_hotspot_count=active_hotspots,
        )


zone_analytics_service = ZoneAnalyticsService()
