"""Route generation and driver stop management API endpoints."""

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.operations import RouteGenerateRequest, RouteRead, RouteStopStatusUpdate
from app.services.route_service import route_service

router = APIRouter(prefix="/routes", tags=["routes"])


@router.post(
    "/generate",
    response_model=RouteRead,
    status_code=status.HTTP_201_CREATED,
)
def generate_route(
    payload: RouteGenerateRequest,
    session: Session = Depends(get_db),
) -> RouteRead:
    """
    Admin: generate an optimized route for a driver/zone/date.
    Uses nearest-neighbor heuristic; swap optimizer in route_service.py for
    production-grade VRP solver (e.g., OR-Tools) without changing this API.
    """
    return route_service.generate_route(session, payload)


@router.get("", response_model=list[RouteRead])
def list_driver_routes(
    driver_id: int = Query(...),
    session: Session = Depends(get_db),
) -> list[RouteRead]:
    """Return all routes for a given driver (most recent first)."""
    return route_service.get_routes_for_driver(session, driver_id)


@router.get("/{route_id}", response_model=RouteRead)
def get_route(route_id: int, session: Session = Depends(get_db)) -> RouteRead:
    """Get ordered stop list for a route."""
    return route_service.get_route(session, route_id)


@router.patch(
    "/{route_id}/stops/{stop_id}/status",
    response_model=RouteRead,
)
def update_stop_status(
    route_id: int,
    stop_id: int,
    payload: RouteStopStatusUpdate,
    session: Session = Depends(get_db),
) -> RouteRead:
    """Driver: mark a route stop as arrived or skipped."""
    return route_service.update_stop_status(session, route_id, stop_id, payload)
