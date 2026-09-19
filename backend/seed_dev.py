"""Seed dev database with starter accounts for manual and browser verification."""

from datetime import datetime, timezone

from app.core.security import hash_password
from app.db import SessionLocal
from app.models.brand_account import BrandAccount
from app.models.enums import UserRole
from app.models.user import User
from app.models.zone import Zone


def seed():
    session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)

        # 1. Zone
        zone = session.query(Zone).filter_by(code="BLR-W01").first()
        if not zone:
            zone = Zone(name="Indiranagar Ward", code="BLR-W01", city="Bengaluru", created_at=now)
            session.add(zone)
            session.flush()

        # 2. Admin
        admin = session.query(User).filter_by(phone="+910000000001").first()
        if not admin:
            admin = User(
                name="Admin User",
                phone="+910000000001",
                email="admin@ecosync.org",
                password_hash=hash_password("password123"),
                role=UserRole.ADMIN,
                address="Municipal Headquarters, Indiranagar",
                verified=True,
                zone_id=zone.id,
                created_at=now,
                updated_at=now,
            )
            session.add(admin)

        # 3. Citizen
        citizen = session.query(User).filter_by(phone="+910000000002").first()
        if not citizen:
            citizen = User(
                name="Aarav Patel",
                phone="+910000000002",
                email="aarav@citizen.org",
                password_hash=hash_password("password123"),
                role=UserRole.CITIZEN,
                address="12, 100ft Road, Indiranagar",
                verified=True,
                zone_id=zone.id,
                created_at=now,
                updated_at=now,
            )
            session.add(citizen)

        # 4. Brands
        default_brands = [
            ("Hindustan Unilever Ltd", "sustainability@hul.co.in"),
            ("Nestlé India Ltd", "epr@nestle.in"),
            ("ITC Limited", "circularity@itc.in"),
        ]
        for name, email in default_brands:
            b = session.query(BrandAccount).filter_by(org_name=name).first()
            if not b:
                session.add(BrandAccount(org_name=name, contact_email=email, created_at=now))

        session.commit()
        print("Dev database seeded successfully!")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
