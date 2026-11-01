"""Fleet vehicle management API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.operations import VehicleCreate, VehicleMaintenanceRead, VehicleRead, VehicleUpdate
from app.services.fleet_service import fleet_service

router = APIRouter(prefix="/vehicles", tags=["fleet"])


@router.post("", response_model=VehicleRead, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> VehicleRead:
    """Register a new fleet vehicle (Admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to register fleet vehicles.",
        )
    return fleet_service.create_vehicle(session, payload)


@router.get("", response_model=list[VehicleRead])
def list_vehicles(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[VehicleRead]:
    """List all vehicles with maintenance status and utilization stats."""
    return fleet_service.list_vehicles(session)


@router.patch("/{vehicle_id}", response_model=VehicleRead)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> VehicleRead:
    """Update vehicle details or assign/reassign a driver (Admin only)."""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required to modify fleet vehicles.",
        )
    return fleet_service.update_vehicle(session, vehicle_id, payload)


@router.get("/{vehicle_id}/maintenance", response_model=VehicleMaintenanceRead)
def vehicle_maintenance(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> VehicleMaintenanceRead:
    """Get maintenance due date status for a vehicle."""
    return fleet_service.get_maintenance_status(session, vehicle_id)
