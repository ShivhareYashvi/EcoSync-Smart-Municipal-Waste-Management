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

        # 1. Zones
        zones_data = [
            ("Indiranagar Ward", "BLR-W01"),
            ("Koramangala Ward", "BLR-W02"),
            ("Whitefield Ward", "BLR-W03"),
        ]
        zones = {}
        for name, code in zones_data:
            z = session.query(Zone).filter_by(code=code).first()
            if not z:
                z = Zone(name=name, code=code, city="Bengaluru", created_at=now)
                session.add(z)
                session.flush()
            zones[code] = z

        zone = zones["BLR-W01"]

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

        # 4. Driver
        driver_user = session.query(User).filter_by(phone="+910000000003").first()
        if not driver_user:
            driver_user = User(
                name="Rajesh Kumar",
                phone="+910000000003",
                email="rajesh.driver@ecosync.org",
                password_hash=hash_password("password123"),
                role=UserRole.DRIVER,
                address="Depot 4, Indiranagar Ward",
                verified=True,
                zone_id=zone.id,
                created_at=now,
                updated_at=now,
            )
            session.add(driver_user)
            session.flush()

            from app.models.driver import Driver
            from app.models.enums import DriverAvailability
            driver = Driver(
                user_id=driver_user.id,
                vehicle_number="KA-04-EC-2024",
                availability=DriverAvailability.ON_ROUTE,
                created_at=now,
                updated_at=now,
            )
            session.add(driver)

        # 5. Recyclers & Rates
        from app.models.recycler import Recycler
        from app.models.recycler_rate_card import RecyclerRateCard
        from app.models.enums import MaterialType, RecyclerVerificationStatus

        recycler_configs = [
            {
                "phone": "+910000000004",
                "name": "Vikram Malhotra",
                "business": "GreenEarth Recyclers Pvt Ltd",
                "materials": [m.value for m in MaterialType],
                "zone_ids": [z.id for z in zones.values()],
                "rates": [
                    (MaterialType.PLASTIC, 18.50),
                    (MaterialType.PAPER, 14.00),
                    (MaterialType.METAL, 115.00),
                    (MaterialType.E_WASTE, 85.00),
                    (MaterialType.GLASS, 4.50),
                ]
            },
            {
                "phone": "+910000000005",
                "name": "Ananya Rao",
                "business": "Apex Urban Upcyclers",
                "materials": [MaterialType.PLASTIC.value, MaterialType.METAL.value, MaterialType.E_WASTE.value],
                "zone_ids": [zone.id],
                "rates": [
                    (MaterialType.PLASTIC, 19.00),
                    (MaterialType.METAL, 120.00),
                    (MaterialType.E_WASTE, 90.00),
                ]
            }
        ]

        for rc in recycler_configs:
            u = session.query(User).filter_by(phone=rc["phone"]).first()
            if not u:
                u = User(
                    name=rc["name"],
                    phone=rc["phone"],
                    email=f"{rc['name'].lower().replace(' ', '.')}@recycler.org",
                    password_hash=hash_password("password123"),
                    role=UserRole.RECYCLER,
                    address="Industrial Area, Phase 1",
                    verified=True,
                    zone_id=zone.id,
                    created_at=now,
                    updated_at=now,
                )
                session.add(u)
                session.flush()

            rec = session.query(Recycler).filter_by(user_id=u.id).first()
            if not rec:
                rec = Recycler(
                    user_id=u.id,
                    business_name=rc["business"],
                    materials_accepted=rc["materials"],
                    service_zone_ids=rc["zone_ids"],
                    verification_status=RecyclerVerificationStatus.VERIFIED,
                    verification_doc_url="https://cpcb.nic.in/verified_license.pdf",
                    created_at=now,
                    updated_at=now,
                )
                session.add(rec)
                session.flush()

                for mat, rate in rc["rates"]:
                    card = RecyclerRateCard(
                        recycler_id=rec.id,
                        material=mat,
                        rate_per_kg=rate,
                        effective_from=now,
                        active=True,
                    )
                    session.add(card)

        # 6. Brands
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
        print("Dev database seeded successfully with all roles and live rates!")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
