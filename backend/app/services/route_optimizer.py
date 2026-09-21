"""Route optimization engine - pluggable interface + nearest-neighbor heuristic.

Architecture
------------
``RouteOptimizer`` is an abstract interface. Swap in OR-Tools or any external
solver by subclassing it and passing the instance to ``RouteService``.

The ``NearestNeighborRouteOptimizer`` implements the interface using a classic
greedy nearest-neighbor heuristic starting from a configurable depot coordinate.

Stop dictionaries have the shape::

    {
        "pickup_id": int,
        "lat": float,
        "lng": float,
    }

The optimizer returns the same list sorted by visitation order, each item
augmented with::

    {
        ...,
        "sequence_order": int,          # 1-based
        "estimated_arrival": datetime,  # UTC, assuming 30 km/h average speed
    }
"""

from __future__ import annotations

import math
from abc import ABC, abstractmethod
from datetime import datetime, timedelta, timezone
from typing import Any


class RouteOptimizer(ABC):
    """Abstract interface for route ordering strategies."""

    @abstractmethod
    def optimize_stops(
        self,
        depot: tuple[float, float],
        stops: list[dict[str, Any]],
        start_time: datetime | None = None,
    ) -> list[dict[str, Any]]:
        """
        Order ``stops`` starting from ``depot`` and return them annotated with
        ``sequence_order`` (1-based) and ``estimated_arrival`` (datetime UTC).

        Parameters
        ----------
        depot:      (lat, lng) of the route starting point.
        stops:      List of dicts with at minimum {"pickup_id", "lat", "lng"}.
        start_time: Route start datetime (UTC). Defaults to now.

        Returns
        -------
        Ordered list of the same dicts, each augmented with
        ``sequence_order`` and ``estimated_arrival``.
        """


# ---------------------------------------------------------------------------
# Haversine distance helpers
# ---------------------------------------------------------------------------

_EARTH_RADIUS_KM = 6371.0
_AVG_SPEED_KMPH = 30.0  # conservative urban collection speed


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return great-circle distance in km between two lat/lng points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * _EARTH_RADIUS_KM * math.asin(math.sqrt(a))


# ---------------------------------------------------------------------------
# Nearest-neighbor implementation
# ---------------------------------------------------------------------------

class NearestNeighborRouteOptimizer(RouteOptimizer):
    """
    Greedy nearest-neighbor heuristic.

    Time complexity: O(n²) - suitable for up to ~200 stops per route.
    Replace with ``NNOrToolsRouteOptimizer`` (or similar) for larger fleets.
    """

    def optimize_stops(
        self,
        depot: tuple[float, float],
        stops: list[dict[str, Any]],
        start_time: datetime | None = None,
    ) -> list[dict[str, Any]]:
        if not stops:
            return []

        start = start_time or datetime.now(timezone.utc)
        unvisited = list(stops)
        ordered: list[dict[str, Any]] = []
        current_lat, current_lng = depot
        current_time = start

        while unvisited:
            # Find closest unvisited stop from current position
            best_idx = min(
                range(len(unvisited)),
                key=lambda i: _haversine_km(
                    current_lat, current_lng,
                    unvisited[i]["lat"], unvisited[i]["lng"],
                ),
            )
            stop = unvisited.pop(best_idx)
            dist_km = _haversine_km(current_lat, current_lng, stop["lat"], stop["lng"])
            travel_minutes = (dist_km / _AVG_SPEED_KMPH) * 60
            current_time = current_time + timedelta(minutes=travel_minutes)

            ordered.append({
                **stop,
                "sequence_order": len(ordered) + 1,
                "estimated_arrival": current_time,
            })
            current_lat, current_lng = stop["lat"], stop["lng"]

        return ordered
