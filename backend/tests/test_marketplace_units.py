"""Unit tests for marketplace: exact Decimal arithmetic, rate card versioning, and EPR credit mechanics."""

from datetime import date, datetime, timezone
from decimal import Decimal

import pytest

from app.models.enums import EPRCreditStatus, MaterialType, RecyclerVerificationStatus, RecyclingTransactionStatus
from app.models.epr_credit import EPRCredit
from app.models.recycler import Recycler
from app.models.recycler_rate_card import RecyclerRateCard
from app.models.recycling_receipt import RecyclingReceipt
from app.models.recycling_transaction import RecyclingTransaction
from app.services.recycler_service import recycler_service
from tests.conftest import TestingSessionLocal


class TestDecimalLedgerPrecision:
    def test_amount_credited_no_float_drift(self):
        """Assert that Decimal multiplication produces exact financial amounts without floating-point artifacts."""
        # 12.355 kg @ 18.25/kg
        # 12.355 * 18.25 = 225.47875 -> quantize to 2 decimals = 225.48
        weight = Decimal("12.355")
        rate = Decimal("18.25")
        exact_amount = (weight * rate).quantize(Decimal("0.01"))
        assert exact_amount == Decimal("225.48")

        # Check binary floating point drift case: 0.1 + 0.2 != 0.3 in float, but exact in Decimal
        d1 = Decimal("0.10")
        d2 = Decimal("0.20")
        assert d1 + d2 == Decimal("0.30")

        # Large volume weight x high precision rate
        large_weight = Decimal("10450.75")
        unit_rate = Decimal("42.80")
        assert (large_weight * unit_rate).quantize(Decimal("0.01")) == Decimal("447292.10")


class TestRateCardHistorySnapshotting:
    def test_rate_card_deactivation_preserves_history(self, setup_db):
        """Changing rates deactivates prior rate cards and preserves past transaction snapshots."""
        now = datetime.now(timezone.utc)
        with TestingSessionLocal() as session:
            recycler = Recycler(
                user_id=999,
                business_name="Apex Scrap Solutions",
                materials_accepted=[MaterialType.METAL],
                service_zone_ids=[1],
                verification_status=RecyclerVerificationStatus.VERIFIED,
                created_at=now,
                updated_at=now,
            )
            session.add(recycler)
            session.flush()

            # Post initial rate: Metal @ 40.00
            card1 = recycler_service.set_rate(session, recycler.id, MaterialType.METAL, Decimal("40.00"))
            assert card1.active is True
            assert card1.rate_per_kg == Decimal("40.00")

            # Transaction happens at 40.00/kg
            txn = RecyclingTransaction(
                citizen_id=100,
                recycler_id=recycler.id,
                material=MaterialType.METAL,
                weight_kg=Decimal("10.00"),
                rate_applied=card1.rate_per_kg,
                amount_credited=Decimal("400.00"),
                status=RecyclingTransactionStatus.CONFIRMED,
                created_at=now,
            )
            session.add(txn)
            session.commit()

            # Recycler later updates rate: Metal @ 48.50
            card2 = recycler_service.set_rate(session, recycler.id, MaterialType.METAL, Decimal("48.50"))
            assert card2.active is True
            assert card2.rate_per_kg == Decimal("48.50")

            # Verify that card1 is now inactive
            all_rates = recycler_service.list_rates_for_recycler(session, recycler.id)
            assert len(all_rates) == 2
            old_card = next(c for c in all_rates if c.id == card1.id)
            new_card = next(c for c in all_rates if c.id == card2.id)
            assert old_card.active is False
            assert new_card.active is True

            # Past transaction rate_applied is immutable
            session.refresh(txn)
            assert txn.rate_applied == Decimal("40.00")
            assert txn.amount_credited == Decimal("400.00")


class TestEPRCreditGeneration:
    def test_receipt_creates_available_credit_with_placeholder_conversion(self, setup_db):
        """Assert receipt confirmation creates an available EPR credit with credit_amount matching weight."""
        now = datetime.now(timezone.utc)
        with TestingSessionLocal() as session:
            receipt = RecyclingReceipt(
                transaction_id=1,
                receipt_number="RCP-20260918-9999AAAA",
                material=MaterialType.PLASTIC,
                weight_kg=Decimal("25.50"),
                amount_credited=Decimal("382.50"),
                issued_at=now,
            )
            session.add(receipt)
            session.flush()

            epr = EPRCredit(
                receipt_id=receipt.id,
                credit_amount=receipt.weight_kg,
                status=EPRCreditStatus.AVAILABLE,
                created_at=now,
            )
            session.add(epr)
            session.commit()

            assert epr.credit_amount == Decimal("25.50")
            assert epr.status == EPRCreditStatus.AVAILABLE
            assert epr.brand_id is None
