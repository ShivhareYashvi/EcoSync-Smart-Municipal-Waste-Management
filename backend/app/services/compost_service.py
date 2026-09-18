from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session, selectinload

from app.models.compost_batch import CompostBatch
from app.models.enums import CompostBatchStatus, PickupStatus, WasteCategory
from app.models.pickup_request import PickupRequest
from app.models.zone import Zone
from app.schemas.compost_batch import CompostBatchCreate, CompostBatchRead, CompostBatchStatusUpdate


class CompostService:
    """Service tracking municipal organic wet-waste aggregation into compost batches and curing stages."""

    def create_batch(self, session: Session, payload: CompostBatchCreate) -> CompostBatchRead:
        zone = session.scalar(select(Zone).where(Zone.id == payload.zone_id))
        if zone is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")

        total_weight: Decimal
        if payload.total_weight_kg is not None:
            total_weight = Decimal(str(payload.total_weight_kg))
        else:
            # Auto-aggregate verified wet waste from completed zone pickups in date range
            aggregated = session.scalar(
                select(func.sum(PickupRequest.weight_kg)).where(
                    PickupRequest.zone_id == payload.zone_id,
                    PickupRequest.waste_category == WasteCategory.WET,
                    PickupRequest.status == PickupStatus.COMPLETED,
                    PickupRequest.scheduled_date >= payload.period_start,
                    PickupRequest.scheduled_date <= payload.period_end,
                )
            )
            total_weight = Decimal(str(round(aggregated, 2))) if aggregated else Decimal("0.00")

        now = datetime.now(timezone.utc)
        batch = CompostBatch(
            zone_id=payload.zone_id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            total_weight_kg=total_weight,
            status=CompostBatchStatus.COLLECTED,
            buyer_note=payload.buyer_note,
            created_at=now,
        )
        session.add(batch)
        session.commit()
        session.refresh(batch)
        return self._to_read_model(batch, zone_name=zone.name)

    def update_batch_status(
        self, session: Session, batch_id: int, payload: CompostBatchStatusUpdate
    ) -> CompostBatchRead:
        batch = session.scalar(
            select(CompostBatch).options(selectinload(CompostBatch.zone)).where(CompostBatch.id == batch_id)
        )
        if batch is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Compost batch not found")

        batch.status = payload.status
        if payload.buyer_note is not None:
            batch.buyer_note = payload.buyer_note

        session.commit()
        session.refresh(batch)
        return self._to_read_model(batch, zone_name=batch.zone.name if batch.zone else None)

    def list_batches(
        self,
        session: Session,
        zone_id: int | None = None,
        status_filter: CompostBatchStatus | None = None,
    ) -> list[CompostBatchRead]:
        query = (
            select(CompostBatch)
            .options(selectinload(CompostBatch.zone))
            .order_by(desc(CompostBatch.created_at))
        )
        if zone_id is not None:
            query = query.where(CompostBatch.zone_id == zone_id)
        if status_filter is not None:
            query = query.where(CompostBatch.status == status_filter)

        batches = session.scalars(query).all()
        return [self._to_read_model(b, zone_name=b.zone.name if b.zone else None) for b in batches]

    def _to_read_model(self, batch: CompostBatch, zone_name: str | None = None) -> CompostBatchRead:
        return CompostBatchRead(
            id=batch.id,
            zone_id=batch.zone_id,
            zone_name=zone_name,
            period_start=batch.period_start,
            period_end=batch.period_end,
            total_weight_kg=batch.total_weight_kg,
            status=batch.status,
            buyer_note=batch.buyer_note,
            created_at=batch.created_at,
        )


compost_service = CompostService()
