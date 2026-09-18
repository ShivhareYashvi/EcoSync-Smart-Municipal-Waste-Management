"""Bulk generator registration and management service."""

from __future__ import annotations

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.bulk_generator import BulkGenerator
from app.models.enums import BillingStatus
from app.models.user import User
from app.models.zone import Zone
from app.schemas.phase2 import BulkGeneratorCreate, BulkGeneratorRead, BulkGeneratorStatusUpdate


class BulkGeneratorService:
    """Manage high-volume commercial waste producer registrations."""

    def register(self, session: Session, payload: BulkGeneratorCreate) -> BulkGeneratorRead:
        # Validate zone and contact user exist
        zone = session.scalar(select(Zone).where(Zone.id == payload.zone_id))
        if zone is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
        user = session.scalar(select(User).where(User.id == payload.contact_user_id))
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact user not found")

        # Prevent duplicate registrations at the same address
        existing = session.scalar(
            select(BulkGenerator).where(
                BulkGenerator.address == payload.address,
                BulkGenerator.zone_id == payload.zone_id,
            )
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A bulk generator is already registered at this address in this zone",
            )

        from datetime import datetime, timezone
        bg = BulkGenerator(
            org_name=payload.org_name,
            category=payload.category,
            address=payload.address,
            zone_id=payload.zone_id,
            contact_user_id=payload.contact_user_id,
            threshold_kg=payload.threshold_kg,
            billing_status=BillingStatus.ACTIVE,
            created_at=datetime.now(timezone.utc),
        )
        session.add(bg)
        session.commit()
        session.refresh(bg)
        return BulkGeneratorRead.model_validate(bg)

    def list_bulk_generators(
        self,
        session: Session,
        zone_id: int | None = None,
    ) -> list[BulkGeneratorRead]:
        query = select(BulkGenerator).order_by(BulkGenerator.org_name)
        if zone_id is not None:
            query = query.where(BulkGenerator.zone_id == zone_id)
        results = session.scalars(query).all()
        return [BulkGeneratorRead.model_validate(bg) for bg in results]

    def get_bulk_generator(self, session: Session, bg_id: int) -> BulkGenerator:
        bg = session.scalar(select(BulkGenerator).where(BulkGenerator.id == bg_id))
        if bg is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bulk generator not found")
        return bg

    def update_status(
        self,
        session: Session,
        bg_id: int,
        payload: BulkGeneratorStatusUpdate,
    ) -> BulkGeneratorRead:
        bg = self.get_bulk_generator(session, bg_id)
        bg.billing_status = payload.billing_status
        session.commit()
        session.refresh(bg)
        return BulkGeneratorRead.model_validate(bg)


bulk_generator_service = BulkGeneratorService()
