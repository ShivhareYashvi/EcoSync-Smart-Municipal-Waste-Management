from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import get_current_user
from app.db import SessionLocal, get_db
from app.models.enums import UserRole
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.schemas.tracking import DriverLocationCreate, DriverLocationRead
from app.services.operations_service import operations_service
from app.services.tracking_hub import tracking_hub

settings = get_settings()
router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("/pickups/{pickup_id}/locations", response_model=list[DriverLocationRead])
def list_location_updates(
    pickup_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[DriverLocationRead]:
    pickup = session.get(PickupRequest, pickup_id)
    if not pickup:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pickup not found")
    if current_user.role == UserRole.CITIZEN and pickup.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view tracking data for this pickup.",
        )
    return operations_service.list_location_updates(session, pickup_id)


@router.post("/pickups/{pickup_id}/locations", response_model=DriverLocationRead, status_code=status.HTTP_201_CREATED)
async def create_location_update(
    pickup_id: int,
    payload: DriverLocationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> DriverLocationRead:
    if current_user.role not in (UserRole.ADMIN, UserRole.DRIVER):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only drivers and administrators can broadcast location updates.",
        )
    update = operations_service.create_location_update(session, pickup_id, payload)
    await tracking_hub.broadcast(pickup_id, {"type": "driver-location", "payload": update.model_dump(mode="json")})
    return update


@router.websocket("/pickups/{pickup_id}/ws")
async def pickup_tracking_socket(
    websocket: WebSocket,
    pickup_id: int,
    token: str | None = Query(default=None),
) -> None:
    # Authenticate token query param if supplied
    if token:
        try:
            claims = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            user_id = int(claims.get("sub", 0))
            with SessionLocal() as session:
                pickup = session.get(PickupRequest, pickup_id)
                if pickup and pickup.user_id != user_id:
                    user = session.get(User, user_id)
                    if not user or user.role not in (UserRole.ADMIN, UserRole.DRIVER):
                        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                        return
        except (JWTError, TypeError, ValueError):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    await tracking_hub.connect(pickup_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        tracking_hub.disconnect(pickup_id, websocket)
