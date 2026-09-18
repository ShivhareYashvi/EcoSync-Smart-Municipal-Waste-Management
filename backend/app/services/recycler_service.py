from datetime import datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.enums import MaterialType, RecyclerVerificationStatus
from app.models.recycler import Recycler
from app.models.recycler_rate_card import RecyclerRateCard
from app.schemas.recycler import PublicRateRead, RateCardRead, RecyclerRead


class RecyclerService:
    """Service handling recycler onboarding verification, rate card versioning, and the public price board."""

    def list_recyclers(
        self, session: Session, status_filter: RecyclerVerificationStatus | None = None
    ) -> list[RecyclerRead]:
        query = select(Recycler).options(selectinload(Recycler.rate_cards)).order_by(desc(Recycler.created_at))
        if status_filter is not None:
            query = query.where(Recycler.verification_status == status_filter)
        recyclers = session.scalars(query).all()
        return [self._to_recycler_read(r) for r in recyclers]

    def get_recycler_by_id(self, session: Session, recycler_id: int) -> Recycler | None:
        return session.scalar(
            select(Recycler)
            .options(selectinload(Recycler.rate_cards))
            .where(Recycler.id == recycler_id)
        )

    def get_recycler_by_user_id(self, session: Session, user_id: int) -> Recycler | None:
        return session.scalar(
            select(Recycler)
            .options(selectinload(Recycler.rate_cards))
            .where(Recycler.user_id == user_id)
        )

    def verify_recycler(
        self, session: Session, recycler_id: int, new_status: RecyclerVerificationStatus
    ) -> RecyclerRead:
        recycler = self.get_recycler_by_id(session, recycler_id)
        if recycler is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recycler not found")

        recycler.verification_status = new_status
        recycler.updated_at = datetime.now(timezone.utc)
        session.commit()
        session.refresh(recycler)
        return self._to_recycler_read(recycler)

    def set_rate(
        self, session: Session, recycler_id: int, material: MaterialType, rate_per_kg: Decimal
    ) -> RateCardRead:
        recycler = self.get_recycler_by_id(session, recycler_id)
        if recycler is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recycler not found")

        if recycler.verification_status != RecyclerVerificationStatus.VERIFIED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only verified recyclers are authorized to post rates",
            )

        now = datetime.now(timezone.utc)
        # Deactivate existing active rates for this recycler + material to maintain historical integrity
        existing_active = session.scalars(
            select(RecyclerRateCard).where(
                RecyclerRateCard.recycler_id == recycler_id,
                RecyclerRateCard.material == material,
                RecyclerRateCard.active == True,  # noqa: E712
            )
        ).all()
        for rate_card in existing_active:
            rate_card.active = False

        new_card = RecyclerRateCard(
            recycler_id=recycler_id,
            material=material,
            rate_per_kg=rate_per_kg,
            effective_from=now,
            active=True,
        )
        session.add(new_card)
        session.commit()
        session.refresh(new_card)
        return RateCardRead.model_validate(new_card)

    def list_rates_for_recycler(self, session: Session, recycler_id: int) -> list[RateCardRead]:
        cards = session.scalars(
            select(RecyclerRateCard)
            .where(RecyclerRateCard.recycler_id == recycler_id)
            .order_by(desc(RecyclerRateCard.effective_from))
        ).all()
        return [RateCardRead.model_validate(c) for c in cards]

    def get_active_rates(
        self,
        session: Session,
        zone_id: int | None = None,
        material: MaterialType | None = None,
    ) -> list[PublicRateRead]:
        """Fetch all active posted scrap rates from verified recyclers (public scrap price board)."""
        query = (
            select(RecyclerRateCard, Recycler)
            .join(Recycler, RecyclerRateCard.recycler_id == Recycler.id)
            .where(
                RecyclerRateCard.active == True,  # noqa: E712
                Recycler.verification_status == RecyclerVerificationStatus.VERIFIED,
            )
        )
        if material is not None:
            query = query.where(RecyclerRateCard.material == material)

        results = session.execute(query).all()
        output: list[PublicRateRead] = []
        for rate_card, recycler in results:
            service_zones = recycler.service_zone_ids or []
            if zone_id is not None and zone_id not in service_zones:
                continue
            output.append(
                PublicRateRead(
                    id=rate_card.id,
                    recycler_id=recycler.id,
                    recycler_business_name=recycler.business_name,
                    service_zone_ids=service_zones,
                    material=rate_card.material,
                    rate_per_kg=rate_card.rate_per_kg,
                    effective_from=rate_card.effective_from,
                )
            )
        # Sort by rate_per_kg descending so best prices appear first
        output.sort(key=lambda item: item.rate_per_kg, reverse=True)
        return output

    def _to_recycler_read(self, recycler: Recycler) -> RecyclerRead:
        return RecyclerRead(
            id=recycler.id,
            user_id=recycler.user_id,
            business_name=recycler.business_name,
            materials_accepted=[
                m if isinstance(m, MaterialType) else MaterialType(str(m))
                for m in (recycler.materials_accepted or [])
            ],
            service_zone_ids=recycler.service_zone_ids or [],
            verification_status=recycler.verification_status,
            verification_doc_url=recycler.verification_doc_url,
            rate_cards=[RateCardRead.model_validate(c) for c in (recycler.rate_cards or [])],
            created_at=recycler.created_at,
            updated_at=recycler.updated_at,
        )


recycler_service = RecyclerService()
