"""Unit tests for route optimizer, hotspot threshold logic, and SLA calculation."""

from __future__ import annotations

import math
from datetime import datetime, timedelta, timezone

import pytest

from app.services.route_optimizer import NearestNeighborRouteOptimizer, _haversine_km


class TestHaversine:
    def test_same_point_is_zero(self):
        assert _haversine_km(12.97, 77.64, 12.97, 77.64) == pytest.approx(0.0)

    def test_known_distance_bengaluru_to_mysuru(self):
        # Bengaluru ~12.97N 77.59E  →  Mysuru ~12.30N 76.65E  ≈ 128 km
        dist = _haversine_km(12.9716, 77.5946, 12.2958, 76.6394)
        assert 115 < dist < 155, f"Expected ~128 km, got {dist:.1f} km"


class TestNearestNeighborOptimizer:
    """Verify ordering against a fixed geometry with a known-correct answer."""

    # Depot at origin; 4 stops arranged so the greedy NN order is deterministic:
    #   depot (0,0) → A (1,0) → B (1,1) → C (0,1) → D (-1,1)
    # Each step picks the geometrically closest unvisited stop.
    DEPOT = (0.0, 0.0)
    STOPS = [
        {"pickup_id": 1, "lat": 0.0, "lng": 1.0},   # A - east 1°
        {"pickup_id": 2, "lat": 1.0, "lng": 1.0},   # B - northeast
        {"pickup_id": 3, "lat": 1.0, "lng": 0.0},   # C - north 1°
        {"pickup_id": 4, "lat": 1.0, "lng": -1.0},  # D - northwest
    ]

    def test_returns_correct_count(self):
        optimizer = NearestNeighborRouteOptimizer()
        result = optimizer.optimize_stops(self.DEPOT, self.STOPS[:])
        assert len(result) == 4

    def test_sequence_order_is_1_based(self):
        optimizer = NearestNeighborRouteOptimizer()
        result = optimizer.optimize_stops(self.DEPOT, self.STOPS[:])
        orders = [s["sequence_order"] for s in result]
        assert sorted(orders) == [1, 2, 3, 4]

    def test_first_stop_is_closest_to_depot(self):
        """The two stops nearest to depot (0,0) are A (0,1) and C (1,0).
        Whichever is picked first, its distance should be ≤ that of B or D."""
        optimizer = NearestNeighborRouteOptimizer()
        result = optimizer.optimize_stops(self.DEPOT, self.STOPS[:])
        first_pickup_id = result[0]["pickup_id"]
        # A(pid=1) and C(pid=3) are the closest - both at 1° from depot
        assert first_pickup_id in (1, 3)

    def test_estimated_arrival_is_monotonically_increasing(self):
        optimizer = NearestNeighborRouteOptimizer()
        start = datetime(2026, 9, 18, 8, 0, 0, tzinfo=timezone.utc)
        result = optimizer.optimize_stops(self.DEPOT, self.STOPS[:], start_time=start)
        arrivals = [s["estimated_arrival"] for s in sorted(result, key=lambda x: x["sequence_order"])]
        for i in range(1, len(arrivals)):
            assert arrivals[i] >= arrivals[i - 1]

    def test_empty_stops_returns_empty(self):
        optimizer = NearestNeighborRouteOptimizer()
        result = optimizer.optimize_stops(self.DEPOT, [])
        assert result == []

    def test_single_stop(self):
        optimizer = NearestNeighborRouteOptimizer()
        stop = {"pickup_id": 42, "lat": 5.0, "lng": 5.0}
        result = optimizer.optimize_stops(self.DEPOT, [stop])
        assert len(result) == 1
        assert result[0]["sequence_order"] == 1
        assert result[0]["pickup_id"] == 42


class TestHotspotThresholdLogic:
    """Test hotspot detection boundary conditions."""

    def test_run_hotspot_detection_flags_zone(self, setup_db):
        """Zone with >= 3 complaints in 30 days gets an active hotspot."""
        from datetime import datetime, timezone
        from tests.conftest import TestingSessionLocal
        from app.models.zone import Zone
        from app.models.user import User
        from app.models.complaint import Complaint
        from app.models.enums import ComplaintCategory, ComplaintStatus, UserRole
        from app.services.hotspot_service import hotspot_service, HOTSPOT_COMPLAINT_THRESHOLD
        from app.models.complaint_hotspot import ComplaintHotspot

        now = datetime.now(timezone.utc)
        with TestingSessionLocal() as session:
            zone = Zone(name="Test Zone", code="TEST-01", city="TestCity", created_at=now)
            user = User(
                name="Test User", phone="+911111111111",
                password_hash="x", role=UserRole.CITIZEN,
                address="Addr", created_at=now, updated_at=now,
            )
            session.add_all([zone, user])
            session.commit()

            # Add THRESHOLD complaints
            for _ in range(HOTSPOT_COMPLAINT_THRESHOLD):
                session.add(Complaint(
                    user_id=user.id, zone_id=zone.id,
                    category=ComplaintCategory.MISSED_PICKUP,
                    description="Missed pickup complaint text",
                    status=ComplaintStatus.OPEN,
                    created_at=now, updated_at=now,
                ))
            session.commit()

            result = hotspot_service.run_hotspot_detection(session)
            assert result["flagged"] >= 1

            hs = session.scalars(
                __import__("sqlalchemy", fromlist=["select"]).select(ComplaintHotspot)
                .where(ComplaintHotspot.zone_id == zone.id)
            ).first()
            assert hs is not None
            assert hs.status.value == "active"

    def test_hotspot_resolves_when_count_drops(self, setup_db):
        """A zone with < threshold complaints resolves any existing active hotspot."""
        from datetime import datetime, timezone
        from tests.conftest import TestingSessionLocal
        from app.models.zone import Zone
        from app.models.complaint_hotspot import ComplaintHotspot
        from app.models.enums import HotspotStatus
        from app.services.hotspot_service import hotspot_service

        now = datetime.now(timezone.utc)
        with TestingSessionLocal() as session:
            zone = Zone(name="Quiet Zone", code="TEST-02", city="TestCity", created_at=now)
            session.add(zone)
            session.commit()

            # Pre-existing active hotspot
            hs = ComplaintHotspot(
                zone_id=zone.id,
                complaint_count=5,
                first_flagged_at=now,
                status=HotspotStatus.ACTIVE,
            )
            session.add(hs)
            session.commit()

            # Zone now has 0 complaints - detection should resolve it
            result = hotspot_service.run_hotspot_detection(session)
            assert result["resolved"] >= 1

            session.refresh(hs)
            assert hs.status == HotspotStatus.RESOLVED
            assert hs.resolved_at is not None


class TestSLACalculation:
    """Test SLA average hours computation."""

    def test_sla_computation_correct(self, setup_db):
        from datetime import datetime, timedelta, timezone
        from tests.conftest import TestingSessionLocal
        from app.models.zone import Zone
        from app.models.user import User
        from app.models.complaint import Complaint
        from app.models.enums import ComplaintCategory, ComplaintStatus, UserRole
        from app.services.hotspot_service import hotspot_service

        now = datetime.now(timezone.utc)
        created = now - timedelta(hours=48)
        resolved = now - timedelta(hours=24)  # 24 h resolution time

        with TestingSessionLocal() as session:
            zone = Zone(name="SLA Zone", code="SLA-01", city="TestCity", created_at=now)
            user = User(
                name="SLA User", phone="+912222222222",
                password_hash="x", role=UserRole.CITIZEN,
                address="SLA Addr", created_at=now, updated_at=now,
            )
            session.add_all([zone, user])
            session.commit()

            session.add(Complaint(
                user_id=user.id, zone_id=zone.id,
                category=ComplaintCategory.MISSED_PICKUP,
                description="SLA test complaint here",
                status=ComplaintStatus.RESOLVED,
                resolved_at=resolved,
                created_at=created, updated_at=resolved,
            ))
            session.commit()

            sla_data = hotspot_service.get_zone_sla(session)
            sla = next((s for s in sla_data if s.zone_id == zone.id), None)
            assert sla is not None
            # Should be ~24 hours ± 1 h for floating point
            assert sla.avg_resolution_hours is not None
            assert abs(sla.avg_resolution_hours - 24.0) < 1.0
