from fastapi import APIRouter, Depends

from app.api.v1.auth import router as auth_router
from app.api.v1.operations import router as operations_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.chat import router as chat_router
from app.core.security import get_current_user

router = APIRouter()


@router.get("/status", tags=["system"])
def api_status() -> dict[str, str]:
    """Return API version status for load balancers and clients."""

    return {"status": "ready", "version": "v1"}


router.include_router(auth_router)
router.include_router(operations_router, dependencies=[Depends(get_current_user)])
router.include_router(tracking_router, dependencies=[Depends(get_current_user)])
router.include_router(uploads_router, dependencies=[Depends(get_current_user)])
router.include_router(chat_router, dependencies=[Depends(get_current_user)])
