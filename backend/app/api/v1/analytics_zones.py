"""Zone analytics API endpoints."""

from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.operations import CityWideAnalytics, ZoneAnalytics
from app.services.zone_analytics_service import zone_analytics_service
router = APIRouter(prefix="/analytics/zones", tags=["analytics-zones"])


@router.get("", response_model=CityWideAnalytics)
def city_wide_analytics(session: Session = Depends(get_db)) -> CityWideAnalytics:
    """Return city-wide comparison analytics across all zones."""
    return zone_analytics_service.get_city_wide_analytics(session)


@router.get("/{zone_id}", response_model=ZoneAnalytics)
def zone_analytics(zone_id: int, session: Session = Depends(get_db)) -> ZoneAnalytics:
    """Return operational KPIs for a single zone."""
    return zone_analytics_service.get_zone_analytics(session, zone_id)


@router.get("/{zone_id}/export.csv")
def zone_analytics_csv(zone_id: int, session: Session = Depends(get_db)) -> Response:
    """Export zone analytics as CSV."""
    csv_content = zone_analytics_service.export_zone_csv(session, zone_id)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="zone-{zone_id}-analytics.csv"'},
    )
