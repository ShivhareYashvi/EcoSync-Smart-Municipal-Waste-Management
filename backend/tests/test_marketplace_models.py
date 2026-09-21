"""Tests for marketplace models, relationships, and migration definitions."""

from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import select

from app.core.security import hash_password
from app.models import (
    BrandAccount,
    CompostBatch,
    CompostBatchStatus,
    EPRCredit,
    EPRCreditStatus,
    MaterialType,
    Recycler,
    RecyclerRateCard,
    RecyclerVerificationStatus,
    RecyclingReceipt,
    RecyclingTransaction,
    RecyclingTransactionStatus,
    User,
    UserRole,
    Zone,
)
from tests.conftest import TestingSessionLocal


def test_marketplace_recycler_and_rate_card(setup_db):
    """Test Recycler profile and RecyclerRateCard models and relationships."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        user = User(
            name="Green Earth Recyclers",
            phone="+919876543210",
            email="green@recyclers.org",
            password_hash=hash_password("secret123"),
            role=UserRole.RECYCLER,
            address="Plot 42, Industrial Area",
            verified=True,
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        session.flush()

        recycler = Recycler(
            user_id=user.id,
            business_name="Green Earth Recyclers Pvt Ltd",
            materials_accepted=[MaterialType.PLASTIC, MaterialType.PAPER, MaterialType.METAL],
            service_zone_ids=[1, 2],
            verification_status=RecyclerVerificationStatus.PENDING,
            verification_doc_url="/uploads/verification-docs/license.pdf",
            created_at=now,
            updated_at=now,
        )
        session.add(recycler)
        session.flush()

        # Add rate cards with Decimal precision
        rate_plastic = RecyclerRateCard(
            recycler_id=recycler.id,
            material=MaterialType.PLASTIC,
            rate_per_kg=Decimal("15.50"),
            effective_from=now,
            active=True,
        )
        rate_metal = RecyclerRateCard(
            recycler_id=recycler.id,
            material=MaterialType.METAL,
            rate_per_kg=Decimal("45.00"),
            effective_from=now,
            active=True,
        )
        session.add_all([rate_plastic, rate_metal])
        session.commit()

        # Query and verify
        reloaded_user = session.scalar(select(User).where(User.id == user.id))
        assert reloaded_user is not None
        assert reloaded_user.recycler_profile is not None
        assert reloaded_user.recycler_profile.business_name == "Green Earth Recyclers Pvt Ltd"
        assert MaterialType.PLASTIC in reloaded_user.recycler_profile.materials_accepted
        assert len(reloaded_user.recycler_profile.rate_cards) == 2

        # Verify rate precision
        plastic_card = next(rc for rc in reloaded_user.recycler_profile.rate_cards if rc.material == MaterialType.PLASTIC)
        assert isinstance(plastic_card.rate_per_kg, Decimal)
        assert plastic_card.rate_per_kg == Decimal("15.50")


def test_marketplace_transaction_receipt_and_epr_credit(setup_db):
    """Test full transaction -> receipt -> EPR credit lifecycle at model level."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        citizen = User(
            name="Priya Sharma",
            phone="+919876543211",
            email="priya@example.com",
            password_hash=hash_password("secret123"),
            role=UserRole.CITIZEN,
            address="12 MG Road",
            verified=True,
            created_at=now,
            updated_at=now,
        )
        recycler_user = User(
            name="City Recyclers",
            phone="+919876543212",
            email="city@recyclers.org",
            password_hash=hash_password("secret123"),
            role=UserRole.RECYCLER,
            address="45 Hub",
            verified=True,
            created_at=now,
            updated_at=now,
        )
        session.add_all([citizen, recycler_user])
        session.flush()

        recycler = Recycler(
            user_id=recycler_user.id,
            business_name="City Recyclers",
            materials_accepted=[MaterialType.PLASTIC],
            service_zone_ids=[1],
            verification_status=RecyclerVerificationStatus.VERIFIED,
            created_at=now,
            updated_at=now,
        )
        session.add(recycler)
        session.flush()

        # Citizen requests a transaction
        txn = RecyclingTransaction(
            citizen_id=citizen.id,
            recycler_id=recycler.id,
            material=MaterialType.PLASTIC,
            estimated_weight_kg=Decimal("12.00"),
            status=RecyclingTransactionStatus.REQUESTED,
            created_at=now,
        )
        session.add(txn)
        session.flush()

        # Recycler logs actual weight and snapshots rate
        actual_weight = Decimal("12.50")
        rate_snapshot = Decimal("18.00")
        amount_computed = (actual_weight * rate_snapshot).quantize(Decimal("0.01"))
        txn.weight_kg = actual_weight
        txn.rate_applied = rate_snapshot
        txn.amount_credited = amount_computed
        txn.photo_url = "/uploads/pickup-photos/photo123.jpg"
        txn.status = RecyclingTransactionStatus.LOGGED
        session.flush()

        # Citizen confirms -> Generate digital receipt
        txn.status = RecyclingTransactionStatus.CONFIRMED
        receipt = RecyclingReceipt(
            transaction_id=txn.id,
            receipt_number="RCP-20260918-ABCD1234",
            material=txn.material,
            weight_kg=actual_weight,
            amount_credited=amount_computed,
            issued_at=now,
        )
        session.add(receipt)
        session.flush()

        # Auto-generate EPR credit linked to receipt (placeholder 1:1 conversion)
        epr = EPRCredit(
            receipt_id=receipt.id,
            credit_amount=receipt.weight_kg,
            status=EPRCreditStatus.AVAILABLE,
            created_at=now,
        )
        session.add(epr)
        session.flush()

        # Seed brand account and simulate claim
        brand = BrandAccount(
            org_name="EcoFMCG India Ltd",
            contact_email="sustainability@ecofmcg.in",
            created_at=now,
        )
        session.add(brand)
        session.flush()

        epr.brand_id = brand.id
        epr.status = EPRCreditStatus.CLAIMED
        epr.claimed_at = now
        session.commit()

        # Assertions
        reloaded_receipt = session.scalar(select(RecyclingReceipt).where(RecyclingReceipt.id == receipt.id))
        assert reloaded_receipt is not None
        assert reloaded_receipt.receipt_number == "RCP-20260918-ABCD1234"
        assert reloaded_receipt.amount_credited == Decimal("225.00")
        assert reloaded_receipt.epr_credit is not None
        assert reloaded_receipt.epr_credit.credit_amount == Decimal("12.50")
        assert reloaded_receipt.epr_credit.status == EPRCreditStatus.CLAIMED
        assert reloaded_receipt.epr_credit.brand.org_name == "EcoFMCG India Ltd"


def test_marketplace_compost_batch(setup_db):
    """Test CompostBatch model with zone reference and status transitions."""
    now = datetime.now(timezone.utc)
    with TestingSessionLocal() as session:
        zone = Zone(name="Jayanagar Ward", code="BLR-W02", city="Bengaluru", created_at=now)
        session.add(zone)
        session.flush()

        batch = CompostBatch(
            zone_id=zone.id,
            period_start=date(2026, 9, 1),
            period_end=date(2026, 9, 15),
            total_weight_kg=Decimal("1540.75"),
            status=CompostBatchStatus.COLLECTED,
            buyer_note="Reserved for GreenFields Organic Nursery",
            created_at=now,
        )
        session.add(batch)
        session.commit()

        reloaded_batch = session.scalar(select(CompostBatch).where(CompostBatch.id == batch.id))
        assert reloaded_batch is not None
        assert reloaded_batch.total_weight_kg == Decimal("1540.75")
        assert reloaded_batch.zone.code == "BLR-W02"
        assert reloaded_batch.status == CompostBatchStatus.COLLECTED
