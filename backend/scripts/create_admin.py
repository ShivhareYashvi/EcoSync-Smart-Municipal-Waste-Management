"""CLI script to create a municipal superuser/admin account.

Usage:
    cd backend
    python -m scripts.create_admin
"""

import getpass
import sys
from datetime import datetime, timezone

from sqlalchemy import or_, select

from app.core.phone import normalize_phone
from app.core.security import hash_password
from app.db import SessionLocal
from app.models.enums import UserRole
from app.models.user import User


def get_password(prompt: str) -> str:
    """Prompt for password using getpass when on a tty, falling back to readline."""
    if sys.stdin.isatty():
        return getpass.getpass(prompt)
    sys.stdout.write(prompt)
    sys.stdout.flush()
    return sys.stdin.readline().rstrip("\r\n")


def main() -> None:
    print("=" * 60)
    print("EcoSync -- Create Administrator Account (Superuser)")
    print("=" * 60)

    # 1. Ask for Phone or Email
    identifier = input("Email or Mobile Number: ").strip()
    if not identifier:
        print("Error: Email or Mobile Number cannot be blank.")
        sys.exit(1)

    email = None
    phone = None
    if "@" in identifier:
        email = identifier.lower()
    else:
        try:
            phone = normalize_phone(identifier, allow_dev_numbers=True)
        except Exception:
            phone = identifier

    # Also ask for the other if desired
    if email and not phone:
        phone_input = input("Mobile Number (optional, press Enter to skip): ").strip()
        if phone_input:
            try:
                phone = normalize_phone(phone_input, allow_dev_numbers=True)
            except Exception:
                phone = phone_input
    elif phone and not email:
        email_input = input("Email (optional, press Enter to skip): ").strip()
        if email_input:
            email = email_input.lower()

    name = input("Full Name [Administrator]: ").strip() or "Administrator"

    # 2. Ask for password via getpass with confirmation
    while True:
        password = get_password("Password: ")
        if len(password) < 8:
            print("Error: Password must be at least 8 characters long.")
            continue

        password_confirm = get_password("Password (again): ")
        if password != password_confirm:
            print("Error: Passwords do not match. Please try again.")
            continue
        break

    # 3. Check existing user
    with SessionLocal() as session:
        conditions = []
        if email:
            conditions.append(User.email == email)
        if phone:
            conditions.append(User.phone == phone)

        existing_user = session.scalar(select(User).where(or_(*conditions))) if conditions else None

        now = datetime.now(timezone.utc)
        if existing_user:
            print(f"\nUser already exists (ID: {existing_user.id}, Role: {existing_user.role}).")
            promote = input("Promote this existing user to active ADMIN and update password? [y/N]: ").strip().lower()
            if promote == "y":
                existing_user.name = name
                existing_user.role = UserRole.ADMIN
                existing_user.password_hash = hash_password(password)
                existing_user.verified = True
                existing_user.phone_verified = True
                existing_user.email_verified = True
                existing_user.locked_until = None
                existing_user.failed_login_attempts = 0
                session.commit()
                print(f"Successfully promoted user '{existing_user.email or existing_user.phone}' to active Administrator!")
                return
            else:
                print("Aborted.")
                sys.exit(1)

        # 4. Create active, verified admin
        admin_user = User(
            name=name,
            email=email,
            phone=phone,
            password_hash=hash_password(password),
            role=UserRole.ADMIN,
            verified=True,
            phone_verified=True if phone else False,
            email_verified=True if email else False,
            profile_completed=True,
            failed_login_attempts=0,
            locked_until=None,
            created_at=now,
            updated_at=now,
        )
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)

    print("\nSuccess! Administrator account created.")
    print(f"  ID: {admin_user.id}")
    print(f"  Name: {admin_user.name}")
    print(f"  Email: {admin_user.email or 'N/A'}")
    print(f"  Phone: {admin_user.phone or 'N/A'}")
    print(f"  Role: {admin_user.role.value}")
    print("  Status: Active & Verified")
    print("\nYou can now sign in at http://localhost:8000/admin")


if __name__ == "__main__":
    main()
