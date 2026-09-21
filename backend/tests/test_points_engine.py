"""Unit tests for the pure calculate_points function and PointsService logic.

These tests do NOT touch the database - the pure function is side-effect-free
and the service-layer tests use a minimal mock session where needed.
"""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.models.enums import PickupStatus, PointsTransactionStatus, WasteCategory
from app.models.pickup_request import PickupRequest
from app.services.points_engine import UserHistory, calculate_points


#  Helpers ─

def _make_pickup(
    *,
    segregation_verified: bool = True,
    weight_kg: float = 10.0,
    waste_category: WasteCategory = WasteCategory.DRY,
    status: PickupStatus = PickupStatus.COMPLETED,
) -> PickupRequest:
    pickup = MagicMock(spec=PickupRequest)
    pickup.id = 1
    pickup.user_id = 42
    pickup.segregation_verified = segregation_verified
    pickup.weight_kg = weight_kg
    pickup.waste_category = waste_category
    pickup.status = status
    return pickup


def _no_streak() -> UserHistory:
    return UserHistory(consecutive_clean_weeks=0)


def _streak() -> UserHistory:
    return UserHistory(consecutive_clean_weeks=4)


#  Pure function tests 

class TestCalculatePoints:
    """Test the pure calculate_points function in isolation."""

    def test_unverified_pickup_returns_zero(self) -> None:
        """segregation_verified=False must always yield 0."""
        pickup = _make_pickup(segregation_verified=False, weight_kg=50.0)
        result = calculate_points(pickup, _no_streak())
        assert result == 0

    def test_base_points_no_weight_no_streak(self) -> None:
        """Weight_kg=0 → weight_bonus=0, no streak → 50 pts."""
        pickup = _make_pickup(weight_kg=0.0)
        result = calculate_points(pickup, _no_streak())
        assert result == 50

    def test_weight_bonus_adds_correctly(self) -> None:
        """10 kg * 5 = 50 pts bonus, capped at 50, total = (50+50)*1.0 = 100."""
        pickup = _make_pickup(weight_kg=10.0)
        result = calculate_points(pickup, _no_streak())
        assert result == 100

    def test_weight_bonus_capped_at_50(self) -> None:
        """20 kg * 5 = 100, but weight_bonus is capped at 50 inside the formula."""
        pickup = _make_pickup(weight_kg=20.0)
        result = calculate_points(pickup, _no_streak())
        assert result == 100  # (50 + min(100, 50)) * 1.0 = 100

    def test_streak_multiplier_applied_at_4_weeks(self) -> None:
        """4 consecutive clean weeks → multiplier 1.2."""
        pickup = _make_pickup(weight_kg=0.0)  # base only: 50
        result = calculate_points(pickup, _streak())
        assert result == round(50 * 1.2)  # 60

    def test_streak_multiplier_with_weight_bonus(self) -> None:
        """Streak + weight: (50 + 50) * 1.2 = 120."""
        pickup = _make_pickup(weight_kg=10.0)
        result = calculate_points(pickup, _streak())
        assert result == round((50 + 50) * 1.2)  # 120

    def test_streak_not_applied_below_4_weeks(self) -> None:
        """3 consecutive weeks → multiplier stays 1.0."""
        pickup = _make_pickup(weight_kg=0.0)
        history = UserHistory(consecutive_clean_weeks=3)
        result = calculate_points(pickup, history)
        assert result == 50

    def test_zero_weight_with_streak(self) -> None:
        """Ensures streak still applies even with zero weight."""
        pickup = _make_pickup(weight_kg=0.0)
        result = calculate_points(pickup, _streak())
        assert result == 60

    def test_fractional_weight_rounds_correctly(self) -> None:
        """7.5 kg * 5 = 37.5 bonus: (50 + 37.5) * 1.0 = 87.5 → rounds to 88."""
        pickup = _make_pickup(weight_kg=7.5)
        result = calculate_points(pickup, _no_streak())
        assert result == round((50 + 37.5) * 1.0)


#  Weekly cap tests (service layer) ─

class TestWeeklyCap:
    """Verify the weekly weight-bonus cap enforcement in _apply_weekly_cap."""

    def test_cap_reduces_weight_bonus_when_exhausted(self) -> None:
        """When the weekly cap is already used up, weight bonus is zeroed out."""
        from app.services.points_engine import PointsService

        service = PointsService()
        mock_session = MagicMock()
        # Simulate 100 pts already earned this week (cap is 50 above base)
        mock_session.scalar.return_value = 100  # weekly_earned

        result = service._apply_weekly_cap(mock_session, user_id=1, raw_points=100)
        # remaining_weight_cap = max(0, 50 - max(0, 100 - 50)) = max(0, 50-50) = 0
        # weight_component = 100 - 50 = 50; capped_weight = min(50, 0) = 0
        # result = 50 + 0 = 50
        assert result == 50

    def test_partial_cap_allows_remaining_bonus(self) -> None:
        """When 20 pts of cap remain, weight bonus is trimmed to 20."""
        from app.services.points_engine import PointsService

        service = PointsService()
        mock_session = MagicMock()
        mock_session.scalar.return_value = 80  # 80 pts earned this week

        raw_points = 100  # would award 50 base + 50 weight
        result = service._apply_weekly_cap(mock_session, user_id=1, raw_points=raw_points)
        # remaining_weight_cap = max(0, 50 - max(0, 80-50)) = max(0, 50-30) = 20
        # weight_component = 50; capped = min(50, 20) = 20; result = 50+20 = 70
        assert result == 70

    def test_cap_not_applied_when_no_prior_earnings(self) -> None:
        """Full weight bonus available when no prior earnings this week."""
        from app.services.points_engine import PointsService

        service = PointsService()
        mock_session = MagicMock()
        mock_session.scalar.return_value = 0  # nothing earned this week

        result = service._apply_weekly_cap(mock_session, user_id=1, raw_points=100)
        # remaining_weight_cap = max(0, 50 - 0) = 50
        # weight_component = 50; capped = min(50, 50) = 50; result = 100
        assert result == 100


#  Dispute reversal tests ─

class TestDisputeReversal:
    """Verify that disputing a pickup flags the transaction and reverses balance."""

    def test_flag_transaction_reverses_approved_points(self) -> None:
        """An approved transaction should be flagged and balance reversed."""
        from app.services.points_engine import PointsService
        from app.models.user_tier import UserTierRecord

        service = PointsService()
        mock_session = MagicMock()

        mock_tx = MagicMock()
        mock_tx.status = PointsTransactionStatus.APPROVED
        mock_tx.points = 100
        mock_tx.user_id = 1

        mock_tier = MagicMock(spec=UserTierRecord)
        mock_tier.points_balance = 100
        mock_tier.flags_count = 0

        mock_session.scalar.side_effect = [mock_tx, mock_tier]

        result = service.flag_transaction(mock_session, pickup_id=1)

        assert mock_tx.status == PointsTransactionStatus.FLAGGED
        assert mock_tier.flags_count == 1
        assert mock_tier.points_balance == 0  # 100 - 100
        assert result is mock_tx

    def test_flag_pending_transaction_does_not_reverse_balance(self) -> None:
        """A pending transaction (never credited) should be flagged without reversing."""
        from app.services.points_engine import PointsService
        from app.models.user_tier import UserTierRecord

        service = PointsService()
        mock_session = MagicMock()

        mock_tx = MagicMock()
        mock_tx.status = PointsTransactionStatus.PENDING
        mock_tx.points = 50
        mock_tx.user_id = 1

        mock_tier = MagicMock(spec=UserTierRecord)
        mock_tier.points_balance = 200
        mock_tier.flags_count = 0

        mock_session.scalar.side_effect = [mock_tx, mock_tier]

        service.flag_transaction(mock_session, pickup_id=1)

        assert mock_tx.status == PointsTransactionStatus.FLAGGED
        assert mock_tier.flags_count == 1
        assert mock_tier.points_balance == 200  # unchanged - was never credited

    def test_flag_returns_none_when_no_transaction(self) -> None:
        """Returns None gracefully when no transaction exists for the pickup."""
        from app.services.points_engine import PointsService

        service = PointsService()
        mock_session = MagicMock()
        mock_session.scalar.return_value = None  # no transaction found

        result = service.flag_transaction(mock_session, pickup_id=999)
        assert result is None
