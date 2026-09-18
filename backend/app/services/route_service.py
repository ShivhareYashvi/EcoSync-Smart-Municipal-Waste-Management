"""Route generation and management service."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.enums import PickupStatus, RouteStopStatus
from app.models.pickup_request import PickupRequest
from app.models.route import Route, RouteStop
from app.models.user import User
from app.models.vehicle import Vehicle
from app.models.zone import Zone
from app.schemas.phase2 import RouteGenerateRequest, RouteRead, RouteStopStatusUpdate
from app.services.route_optimizer import NearestNeighborRouteOptimizer, RouteOptimizer
from app.services.zone_service import ZONE_DEPOTS

# Default optimizer — swap for a different impl without changing this file
_default_optimizer: RouteOptimizer = NearestNeighborRouteOptimizer()


class RouteService:
    """Orchestrates batch route generation and stop-level driver progress."""

    def __init__(self, optimizer: RouteOptimizer | None = None) -> None:
        self._optimizer = optimizer or _default_optimizer

    def generate_route(self, session: Session, payload: RouteGenerateRequest) -> RouteRead:
        """
        Pull eligible pickups for (driver_id, zone_id, route_date),
        order with the configured optimizer, and persist Route + RouteStops.
        Raises 409 if a route already exists for the same driver/zone/date.
        Raises 422 if there are zero eligible pickups.
        """
        # Validate driver
        driver = session.scalar(select(User).where(User.id == payload.driver_id))
        if driver is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver user not found")

        # Validate zone
        zone = session.scalar(select(Zone).where(Zone.id == payload.zone_id))
        if zone is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

        # Prevent duplicate routes for same driver/zone/date
        existing = session.scalar(
            select(Route).where(
                Route.driver_id == payload.driver_id,
                Route.zone_id == payload.zone_id,
                Route.route_date == payload.route_date,
            )
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A route already exists for this driver/zone/date combination",
            )

        # Collect eligible pickups: scheduled for route_date, in zone, pending/assigned
        eligible_pickups = session.scalars(
            select(PickupRequest).where(
                PickupRequest.zone_id == payload.zone_id,
                PickupRequest.scheduled_date == payload.route_date,
                PickupRequest.status.in_([PickupStatus.PENDING, PickupStatus.ASSIGNED]),
                PickupRequest.route_id.is_(None),  # not already on a route
            )
        ).all()

        if not eligible_pickups:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No eligible pickups found for the given driver, zone, and date",
            )

        # Build stop dicts with coordinates (skip pickups lacking coordinates)
        depot = ZONE_DEPOTS.get(zone.code, (20.5937, 78.9629))
        stop_inputs = []
        no_coord = []
        for pickup in eligible_pickups:
            coords = pickup.coordinates or {}
            lat = coords.get("latitude")
            lng = coords.get("longitude")
            if lat is not None and lng is not None:
                stop_inputs.append({"pickup_id": pickup.id, "lat": float(lat), "lng": float(lng)})
            else:
                # Put pickups without coordinates at depot (they'll be visited last)
                no_coord.append({"pickup_id": pickup.id, "lat": depot[0], "lng": depot[1]})

        ordered = self._optimizer.optimize_stops(depot, stop_inputs + no_coord)

        # Persist route
        now = datetime.now(timezone.utc)
        route = Route(
            driver_id=payload.driver_id,
            vehicle_id=payload.vehicle_id,
            zone_id=payload.zone_id,
            route_date=payload.route_date,
            created_at=now,
        )
        session.add(route)
        session.flush()  # get route.id before creating stops

        for stop_dict in ordered:
            stop = RouteStop(
                route_id=route.id,
                pickup_id=stop_dict["pickup_id"],
                sequence_order=stop_dict["sequence_order"],
                estimated_arrival=stop_dict["estimated_arrival"],
                status=RouteStopStatus.PENDING,
            )
            session.add(stop)
            # Link pickup to this route
            pickup = session.scalar(select(PickupRequest).where(PickupRequest.id == stop_dict["pickup_id"]))
            if pickup:
                pickup.route_id = route.id

        session.commit()
        session.refresh(route)
        return self._route_to_read(route)

    def get_route(self, session: Session, route_id: int) -> RouteRead:
        route = self._get_route_entity(session, route_id)
        return self._route_to_read(route)

    def update_stop_status(
        self,
        session: Session,
        route_id: int,
        stop_id: int,
        payload: RouteStopStatusUpdate,
    ) -> RouteRead:
        route = self._get_route_entity(session, route_id)
        stop = next((s for s in route.stops if s.id == stop_id), None)
        if stop is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route stop not found")
        try:
            stop.status = RouteStopStatus(payload.status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid stop status '{payload.status}'",
            )
        if payload.status == RouteStopStatus.ARRIVED:
            stop.actual_arrival = datetime.now(timezone.utc)
        session.commit()
        session.refresh(route)
        return self._route_to_read(route)

    def get_routes_for_driver(self, session: Session, driver_user_id: int) -> list[RouteRead]:
        routes = session.scalars(
            select(Route).where(Route.driver_id == driver_user_id).order_by(Route.route_date.desc())
        ).all()
        return [self._route_to_read(r) for r in routes]

    def _get_route_entity(self, session: Session, route_id: int) -> Route:
        route = session.scalar(select(Route).where(Route.id == route_id))
        if route is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
        return route

    @staticmethod
    def _route_to_read(route: Route) -> RouteRead:
        return RouteRead.model_validate(route)


route_service = RouteService()
