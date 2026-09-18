from fastapi import APIRouter, Depends

from app.api.v1.analytics_zones import router as analytics_zones_router
from app.api.v1.auth import router as auth_router
from app.api.v1.bulk_generators import router as bulk_generators_router
from app.api.v1.chat import router as chat_router
from app.api.v1.complaints_ext import router as complaints_ext_router
from app.api.v1.compliance import router as compliance_router
from app.api.v1.compost_batches import router as compost_batches_router
from app.api.v1.epr_credits import router as epr_credits_router
from app.api.v1.operations import router as operations_router
from app.api.v1.pickups_ext import router as pickups_ext_router
from app.api.v1.points import router as points_router
from app.api.v1.recyclers import router as recyclers_router
from app.api.v1.recycling_receipts import router as recycling_receipts_router
from app.api.v1.recycling_transactions import router as recycling_transactions_router
from app.api.v1.redemptions import router as redemptions_router
from app.api.v1.routes_api import router as routes_router
from app.api.v1.tracking import router as tracking_router
from app.api.v1.upload_pickup_photo import router as upload_photo_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.vehicles import router as vehicles_router
from app.api.v1.zones import router as zones_router
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
router.include_router(upload_photo_router, dependencies=[Depends(get_current_user)])
router.include_router(chat_router, dependencies=[Depends(get_current_user)])
# Phase 1 routers
router.include_router(pickups_ext_router, dependencies=[Depends(get_current_user)])
router.include_router(compliance_router, dependencies=[Depends(get_current_user)])
router.include_router(points_router, dependencies=[Depends(get_current_user)])
router.include_router(redemptions_router, dependencies=[Depends(get_current_user)])
# Phase 2 routers
router.include_router(zones_router, dependencies=[Depends(get_current_user)])
router.include_router(complaints_ext_router, dependencies=[Depends(get_current_user)])
router.include_router(analytics_zones_router, dependencies=[Depends(get_current_user)])
router.include_router(vehicles_router, dependencies=[Depends(get_current_user)])
router.include_router(bulk_generators_router, dependencies=[Depends(get_current_user)])
router.include_router(routes_router, dependencies=[Depends(get_current_user)])
# Phase 3 routers
router.include_router(recyclers_router)
router.include_router(recycling_transactions_router)
router.include_router(recycling_receipts_router)
router.include_router(epr_credits_router)
router.include_router(compost_batches_router)
