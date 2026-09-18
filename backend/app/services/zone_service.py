"""Zone service: seeding, listing, user assignment, and backfill."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.complaint import Complaint
from app.models.pickup_request import PickupRequest
from app.models.user import User
from app.models.zone import Zone


# ---------------------------------------------------------------------------
# Seed data — 6 Bengaluru municipal zones with placeholder depot coordinates.
# PLACEHOLDER: Replace with real ward boundaries / depot GPS from the client.
# ---------------------------------------------------------------------------
SEED_ZONES = [
    {"name": "Indiranagar Ward", "code": "BLR-W01", "city": "Bengaluru",
     "depot_lat": 12.9784, "depot_lng": 77.6408},
    {"name": "Koramangala Ward", "code": "BLR-W02", "city": "Bengaluru",
     "depot_lat": 12.9352, "depot_lng": 77.6245},
    {"name": "Whitefield Ward", "code": "BLR-W03", "city": "Bengaluru",
     "depot_lat": 12.9698, "depot_lng": 77.7499},
    {"name": "Jayanagar Ward", "code": "BLR-W04", "city": "Bengaluru",
     "depot_lat": 12.9255, "depot_lng": 77.5834},
    {"name": "Malleshwaram Ward", "code": "BLR-W05", "city": "Bengaluru",
     "depot_lat": 13.0035, "depot_lng": 77.5667},
    {"name": "HSR Layout Ward", "code": "BLR-W06", "city": "Bengaluru",
     "depot_lat": 12.9116, "depot_lng": 77.6389},
]

# Per-zone depot coordinates keyed by zone code.
# PLACEHOLDER: Replace with real depot GPS coordinates from the municipality.
ZONE_DEPOTS: dict[str, tuple[float, float]] = {
    z["code"]: (z["depot_lat"], z["depot_lng"])  # type: ignore[index]
    for z in SEED_ZONES
}


class ZoneService:
    """Zone management: seeding, listing, user assignment, and backfill."""

    def seed_zones(self, session: Session) -> int:
        """Insert seed zones if they don't already exist. Returns count inserted."""
        inserted = 0
        now = datetime.now(timezone.utc)
        for seed in SEED_ZONES:
            exists = session.scalar(select(Zone).where(Zone.code == seed["code"]))
            if exists is None:
                zone = Zone(
                    name=seed["name"],
                    code=seed["code"],
                    city=seed["city"],
                    created_at=now,
                )
                session.add(zone)
                inserted += 1
        session.commit()
        return inserted

    def list_zones(self, session: Session) -> list[Zone]:
        return list(session.scalars(select(Zone).order_by(Zone.name)).all())

    def get_zone(self, session: Session, zone_id: int) -> Zone:
        zone = session.scalar(select(Zone).where(Zone.id == zone_id))
        if zone is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Zone not found")
        return zone

    def assign_user_zone(self, session: Session, user_id: int, zone_id: int) -> User:
        user = session.scalar(select(User).where(User.id == user_id))
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        self.get_zone(session, zone_id)  # validates zone exists
        user.zone_id = zone_id
        session.commit()
        session.refresh(user)
        return user

    def backfill_zone_ids(self, session: Session) -> dict[str, int]:
        """
        Backfill zone_id on existing pickup_requests and complaints from the
        owning user's zone where the records don't already have one.
        Returns counts of records updated.
        """
        pickups_updated = 0
        complaints_updated = 0

        # Pickups missing zone_id whose user has a zone_id
        pickups = session.scalars(
            select(PickupRequest).where(PickupRequest.zone_id.is_(None))
        ).all()
        for pickup in pickups:
            user = session.scalar(select(User).where(User.id == pickup.user_id))
            if user and user.zone_id:
                pickup.zone_id = user.zone_id
                pickups_updated += 1

        # Complaints missing zone_id whose user has a zone_id
        complaints = session.scalars(
            select(Complaint).where(Complaint.zone_id.is_(None))
        ).all()
        for complaint in complaints:
            user = session.scalar(select(User).where(User.id == complaint.user_id))
            if user and user.zone_id:
                complaint.zone_id = user.zone_id
                complaints_updated += 1

        session.commit()
        return {"pickups_updated": pickups_updated, "complaints_updated": complaints_updated}


zone_service = ZoneService()
