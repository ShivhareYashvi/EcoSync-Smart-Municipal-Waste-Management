from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.tracking import DriverLocationCreate, DriverLocationRead
from app.services.operations_service import operations_service
from app.services.tracking_hub import tracking_hub

router = APIRouter(prefix="/tracking", tags=["tracking"])


@router.get("/pickups/{pickup_id}/locations", response_model=list[DriverLocationRead])
def list_location_updates(
    pickup_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[DriverLocationRead]:
    return operations_service.list_location_updates(session, pickup_id)


@router.post("/pickups/{pickup_id}/locations", response_model=DriverLocationRead, status_code=status.HTTP_201_CREATED)
async def create_location_update(
    pickup_id: int,
    payload: DriverLocationCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> DriverLocationRead:
    update = operations_service.create_location_update(session, pickup_id, payload)
    await tracking_hub.broadcast(pickup_id, {"type": "driver-location", "payload": update.model_dump(mode="json")})
    return update


@router.websocket("/pickups/{pickup_id}/ws")
async def pickup_tracking_socket(
    websocket: WebSocket,
    pickup_id: int,
    token: str | None = Query(default=None),
) -> None:
    await tracking_hub.connect(pickup_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except (WebSocketDisconnect, Exception):
        pass
    finally:
        tracking_hub.disconnect(pickup_id, websocket)

