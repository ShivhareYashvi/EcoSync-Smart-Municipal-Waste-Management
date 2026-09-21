"""Fleet management service for vehicle CRUD, assignment, and utilization."""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.enums import FuelType, PickupStatus
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.models.vehicle import Vehicle
from app.schemas.operations import VehicleCreate, VehicleMaintenanceRead, VehicleRead, VehicleUpdate

MAINTENANCE_WARN_DAYS = 7


def _enrich_vehicle(vehicle: Vehicle, session: Session) -> VehicleRead:
    today = date.today()
    days_until_due = (vehicle.maintenance_due_date - today).days
    maintenance_due_soon = days_until_due <= MAINTENANCE_WARN_DAYS


    # Completed pickups for this vehicle in the last 7 days via route_stops
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    # Simplified: count by driver's completed pickups since vehicle-to-pickup link
    # is via route -> route_stops -> pickup; use a scalar subquery for efficiency.
    driver_id = vehicle.assigned_driver_id
    completed_this_week = 0
    if driver_id:
        from app.models.route import Route, RouteStop
        from app.models.enums import RouteStopStatus
        completed_this_week = session.scalar(
            select(func.count(RouteStop.id))
            .join(Route, Route.id == RouteStop.route_id)
            .where(
                Route.driver_id == driver_id,
                Route.vehicle_id == vehicle.id,
                RouteStop.status == RouteStopStatus.ARRIVED,
                Route.route_date >= (date.today() - timedelta(days=7)),
            )
        ) or 0

    read = VehicleRead.model_validate(vehicle)
    read.maintenance_due_soon = maintenance_due_soon
    read.pickups_completed_this_week = completed_this_week
    return read


class FleetService:
    """CRUD operations and maintenance tracking for the municipal vehicle fleet."""

    def create_vehicle(self, session: Session, payload: VehicleCreate) -> VehicleRead:
        existing = session.scalar(
            select(Vehicle).where(Vehicle.registration_number == payload.registration_number)
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Vehicle {payload.registration_number} already registered",
            )
        if payload.assigned_driver_id:
            self._validate_driver(session, payload.assigned_driver_id)

        # Validate fuel_type
        try:
            fuel = FuelType(payload.fuel_type)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid fuel_type '{payload.fuel_type}'. Must be one of {[e.value for e in FuelType]}",
            )

        vehicle = Vehicle(
            registration_number=payload.registration_number,
            capacity_kg=payload.capacity_kg,
            fuel_type=fuel,
            maintenance_due_date=payload.maintenance_due_date,
            assigned_driver_id=payload.assigned_driver_id,
            active=True,
        )
        session.add(vehicle)
        session.commit()
        session.refresh(vehicle)
        return _enrich_vehicle(vehicle, session)

    def list_vehicles(self, session: Session) -> list[VehicleRead]:
        vehicles = session.scalars(select(Vehicle).order_by(Vehicle.id)).all()
        return [_enrich_vehicle(v, session) for v in vehicles]

    def get_vehicle(self, session: Session, vehicle_id: int) -> Vehicle:
        vehicle = session.scalar(select(Vehicle).where(Vehicle.id == vehicle_id))
        if vehicle is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Vehicle not found")
        return vehicle

    def update_vehicle(self, session: Session, vehicle_id: int, payload: VehicleUpdate) -> VehicleRead:
        vehicle = self.get_vehicle(session, vehicle_id)
        if payload.assigned_driver_id is not None:
            self._validate_driver(session, payload.assigned_driver_id)
        if payload.fuel_type is not None:
            try:
                vehicle.fuel_type = FuelType(payload.fuel_type)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"Invalid fuel_type '{payload.fuel_type}'",
                )
        if payload.capacity_kg is not None:
            vehicle.capacity_kg = payload.capacity_kg
        if payload.maintenance_due_date is not None:
            vehicle.maintenance_due_date = payload.maintenance_due_date
        if payload.assigned_driver_id is not None:
            vehicle.assigned_driver_id = payload.assigned_driver_id
        if payload.active is not None:
            vehicle.active = payload.active
        session.commit()
        session.refresh(vehicle)
        return _enrich_vehicle(vehicle, session)

    def get_maintenance_status(self, session: Session, vehicle_id: int) -> VehicleMaintenanceRead:
        vehicle = self.get_vehicle(session, vehicle_id)
        today = date.today()
        days_until_due = (vehicle.maintenance_due_date - today).days
        return VehicleMaintenanceRead(
            id=vehicle.id,
            registration_number=vehicle.registration_number,
            maintenance_due_date=vehicle.maintenance_due_date,
            days_until_due=days_until_due,
            active=vehicle.active,
        )

    def get_vehicles_due_for_maintenance(self, session: Session) -> list[Vehicle]:
        """Return vehicles with maintenance due within MAINTENANCE_WARN_DAYS days."""
        cutoff = date.today() + timedelta(days=MAINTENANCE_WARN_DAYS)
        return list(
            session.scalars(
                select(Vehicle).where(Vehicle.maintenance_due_date <= cutoff, Vehicle.active == True)
            ).all()
        )

    def _validate_driver(self, session: Session, driver_user_id: int) -> None:
        user = session.scalar(select(User).where(User.id == driver_user_id))
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Driver user not found")


fleet_service = FleetService()
