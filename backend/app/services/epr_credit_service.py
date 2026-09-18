from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.orm import Session, selectinload

from app.models.brand_account import BrandAccount
from app.models.enums import EPRCreditStatus
from app.models.epr_credit import EPRCredit
from app.schemas.epr_credit import BrandAccountCreate, BrandAccountRead, EPRCreditRead


class EPRCreditService:
    """Service managing Extended Producer Responsibility (EPR) credit ledger and simulated brand claims."""

    DEFAULT_BRANDS = [
        {"org_name": "Hindustan Unilever Ltd", "contact_email": "epr@hul.co.in"},
        {"org_name": "Nestlé India Ltd", "contact_email": "sustainability@nestle.in"},
        {"org_name": "ITC Limited — Packaging Div", "contact_email": "circularity@itc.in"},
        {"org_name": "Parle Agro Pvt Ltd", "contact_email": "esg@parleagro.com"},
    ]

    def seed_default_brands(self, session: Session) -> None:
        """Seed starter brand accounts if table is empty for internal claim simulation."""
        count = session.scalar(select(BrandAccount.id).limit(1))
        if count is None:
            now = datetime.now(timezone.utc)
            for b in self.DEFAULT_BRANDS:
                session.add(
                    BrandAccount(
                        org_name=b["org_name"],
                        contact_email=b["contact_email"],
                        created_at=now,
                    )
                )
            session.commit()

    def list_brands(self, session: Session) -> list[BrandAccountRead]:
        self.seed_default_brands(session)
        brands = session.scalars(select(BrandAccount).order_by(BrandAccount.org_name)).all()
        return [BrandAccountRead.model_validate(b) for b in brands]

    def create_brand(self, session: Session, payload: BrandAccountCreate) -> BrandAccountRead:
        now = datetime.now(timezone.utc)
        brand = BrandAccount(
            org_name=payload.org_name,
            contact_email=payload.contact_email,
            created_at=now,
        )
        session.add(brand)
        session.commit()
        session.refresh(brand)
        return BrandAccountRead.model_validate(brand)

    def get_available_credits(self, session: Session) -> list[EPRCreditRead]:
        credits = session.scalars(
            select(EPRCredit)
            .options(selectinload(EPRCredit.receipt), selectinload(EPRCredit.brand))
            .where(EPRCredit.status == EPRCreditStatus.AVAILABLE)
            .order_by(desc(EPRCredit.created_at))
        ).all()
        return [self._to_read_model(c) for c in credits]

    def list_all_credits(self, session: Session) -> list[EPRCreditRead]:
        credits = session.scalars(
            select(EPRCredit)
            .options(selectinload(EPRCredit.receipt), selectinload(EPRCredit.brand))
            .order_by(desc(EPRCredit.created_at))
        ).all()
        return [self._to_read_model(c) for c in credits]

    def claim_credit(self, session: Session, credit_id: int, brand_id: int) -> EPRCreditRead:
        credit = session.scalar(
            select(EPRCredit)
            .options(selectinload(EPRCredit.receipt), selectinload(EPRCredit.brand))
            .where(EPRCredit.id == credit_id)
        )
        if credit is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="EPR Credit not found")

        if credit.status == EPRCreditStatus.CLAIMED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="EPR Credit is already claimed"
            )

        brand = session.scalar(select(BrandAccount).where(BrandAccount.id == brand_id))
        if brand is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand account not found")

        now = datetime.now(timezone.utc)
        credit.brand_id = brand_id
        credit.status = EPRCreditStatus.CLAIMED
        credit.claimed_at = now

        session.commit()
        session.refresh(credit)
        return self._to_read_model(credit)

    def _to_read_model(self, credit: EPRCredit) -> EPRCreditRead:
        receipt = credit.receipt
        brand = credit.brand
        return EPRCreditRead(
            id=credit.id,
            receipt_id=credit.receipt_id,
            receipt_number=receipt.receipt_number if receipt else None,
            material=receipt.material if receipt else None,
            credit_amount=credit.credit_amount,
            status=credit.status,
            brand_id=credit.brand_id,
            brand_name=brand.org_name if brand else None,
            created_at=credit.created_at,
            claimed_at=credit.claimed_at,
        )


epr_credit_service = EPRCreditService()
