import re
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.core.config import get_settings
from app.core.phone import normalize_phone
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password, verify_refresh_token
from app.models.driver import Driver
from app.models.enums import DriverAvailability, RecyclerVerificationStatus, UserRole
from app.models.recycler import Recycler
from app.models.user import User
from app.models.zone import Zone
from app.schemas.auth import (
    EmailLoginRequest,
    EmailSignupRequest,
    LoginRequest,
    ProfileAddressRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services.otp_service import otp_service

_settings = get_settings()


class AuthService:
    """Authentication and identity service supporting Phone OTP and Email+Password."""

    def get_user_by_phone(self, session: Session, phone: str) -> User | None:
        """Look up a user by phone number, supporting multiple phone formats for backward compatibility."""
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError:
            return None

        # First try exact normalized match
        user = session.scalar(select(User).where(User.phone == normalized_phone))
        if user:
            return user

        # For backward compatibility with older database records
        digits = re.sub(r"\D", "", normalized_phone)
        if digits.startswith("91") and len(digits) == 12:
            digits = digits[2:]

        alternative_formats = [digits, f"0{digits}", f"91{digits}", f"+91{digits}"]
        return session.scalar(select(User).where(User.phone.in_(alternative_formats)))

    def _load_user(self, session: Session, user_id: int) -> User | None:
        """Load user eagerly with attached driver and recycler profiles."""
        return session.scalar(
            select(User)
            .options(selectinload(User.driver_profile), selectinload(User.recycler_profile))
            .where(User.id == user_id)
        )

    # -------------------------------------------------------------------------
    # Option 1: Phone Login (OTP, No Password)
    # -------------------------------------------------------------------------

    def request_phone_otp(self, session: Session, phone: str):
        """Generate and send a 6-digit OTP to a 10-digit Indian mobile number."""
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        try:
            record = otp_service.create_code(session, normalized_phone)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc))

        session.commit()
        message = "OTP sent to your mobile number."
        if record.delivery_channel != "sms":
            message = "OTP generated. In local mode, enter 1234 or inspect console logs."

        return {
            "phone": normalized_phone,
            "expires_in_seconds": otp_service.ttl_seconds,
            "delivery_channel": record.delivery_channel,
            "message": message,
        }

    def verify_phone_otp_and_login(self, session: Session, phone: str, code: str) -> TokenResponse:
        """Verify the 6-digit OTP. If user is new, creates the account; if exists, logs in.
        
        Returns 15-minute access token and 30-day refresh token.
        """
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        if not otp_service.verify_code(session, normalized_phone, code):
            session.rollback()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP code")

        now = datetime.now(timezone.utc)
        user = self.get_user_by_phone(session, normalized_phone)
        is_new_user = False

        if user is None:
            # Create user account for new phone number
            user = User(
                name="Citizen",
                phone=normalized_phone,
                role=UserRole.CITIZEN,
                phone_verified=True,
                email_verified=False,
                verified=True,
                profile_completed=False,
                address="",
                password_hash="",
                created_at=now,
                updated_at=now,
            )
            session.add(user)
            session.flush()
            user.household_id = f"ECO-{now.year}-{user.id:06d}"
            session.commit()
            is_new_user = True
        else:
            user.phone_verified = True
            user.verified = True
            user.failed_login_attempts = 0
            user.locked_until = None
            user.updated_at = now
            session.commit()

        loaded_user = self._load_user(session, user.id) or user
        read_model = self._to_read_model(loaded_user)

        access_token = create_access_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value, "phone": read_model.phone or ""},
            expires_delta=timedelta(minutes=15),
        )
        refresh_token = create_refresh_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value},
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            is_new_user=is_new_user,
            profile_completed=bool(loaded_user.profile_completed),
            user=read_model,
        )

    # -------------------------------------------------------------------------
    # Option 2: Email + Password Authentication
    # -------------------------------------------------------------------------

    def signup_email(self, session: Session, payload: EmailSignupRequest) -> dict:
        """Register via email and password (min 8 chars) and issue an email verification link."""
        if payload.password != payload.confirm_password:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

        if len(payload.password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")

        email = payload.email.lower().strip()
        existing_user = session.scalar(select(User).where(User.email == email))

        if existing_user is not None and existing_user.password_hash:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists")

        token = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)

        if existing_user is not None:
            # User previously signed up via phone and is now adding email+password
            existing_user.password_hash = hash_password(payload.password)
            existing_user.email_verification_token = token
            existing_user.email_verified = False
            existing_user.updated_at = now
            user = existing_user
        else:
            user = User(
                email=email,
                password_hash=hash_password(payload.password),
                role=payload.role,
                phone=None,
                name="Citizen",
                phone_verified=False,
                email_verified=False,
                verified=False,
                profile_completed=False,
                address="",
                email_verification_token=token,
                created_at=now,
                updated_at=now,
            )
            session.add(user)
            session.flush()
            user.household_id = f"ECO-{now.year}-{user.id:06d}"

        session.commit()

        base_origin = str(_settings.frontend_origin).rstrip("/")
        verification_link = f"{base_origin}/verify-email?token={token}"
        print(f"\n==========================================")
        print(f"[Email Verification for {email}]")
        print(f"Link: {verification_link}")
        print(f"==========================================\n")

        return {
            "message": "Signup successful. Please verify your email using the verification link sent.",
            "email": email,
            "verification_link": verification_link,
        }

    def verify_email(self, session: Session, token: str) -> TokenResponse:
        """Verify user's email address via link token and sign them in."""
        user = session.scalar(select(User).where(User.email_verification_token == token))
        if user is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired email verification link")

        user.email_verified = True
        user.verified = True
        user.email_verification_token = None
        user.updated_at = datetime.now(timezone.utc)
        session.commit()

        loaded_user = self._load_user(session, user.id) or user
        read_model = self._to_read_model(loaded_user)

        access_token = create_access_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value, "email": read_model.email or ""},
            expires_delta=timedelta(minutes=15),
        )
        refresh_token = create_refresh_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value},
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            is_new_user=False,
            profile_completed=bool(loaded_user.profile_completed),
            user=read_model,
        )

    def login_email(self, session: Session, payload: EmailLoginRequest) -> TokenResponse:
        """Log in with email and password. Enforces email verification and 5-attempt lockout."""
        email = payload.email.lower().strip()
        user = session.scalar(select(User).where(User.email == email))

        if user is None or not user.password_hash:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        now = datetime.now(timezone.utc)

        # Check account lockout
        if user.locked_until:
            locked_until = user.locked_until.replace(tzinfo=timezone.utc) if user.locked_until.tzinfo is None else user.locked_until
            if locked_until > now:
                mins_left = int((locked_until - now).total_seconds() / 60) + 1
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Account temporarily locked due to 5 failed attempts. Please try again in {mins_left} minutes or reset password.",
                )

        # Verify password
        if not verify_password(payload.password, user.password_hash):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
                session.commit()
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account locked for 15 minutes due to 5 consecutive wrong password attempts.",
                )
            session.commit()
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

        # Block login if email is not verified
        if not user.email_verified:
            token = user.email_verification_token or secrets.token_urlsafe(32)
            user.email_verification_token = token
            session.commit()
            base_origin = str(_settings.frontend_origin).rstrip("/")
            verify_link = f"{base_origin}/verify-email?token={token}"
            print(f"\n[Email Verification Link for {email}]: {verify_link}\n")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email is not verified. Please click the verification link sent to your email before logging in.",
            )

        # Successful login: reset failed attempts
        user.failed_login_attempts = 0
        user.locked_until = None
        user.updated_at = now
        session.commit()

        loaded_user = self._load_user(session, user.id) or user
        read_model = self._to_read_model(loaded_user)

        access_token = create_access_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value, "email": read_model.email or ""},
            expires_delta=timedelta(minutes=15),
        )
        refresh_token = create_refresh_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value},
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            is_new_user=False,
            profile_completed=bool(loaded_user.profile_completed),
            user=read_model,
        )

    def forgot_password_email(self, session: Session, email: str) -> dict:
        """Send a password reset link to user's registered email."""
        clean_email = email.lower().strip()
        user = session.scalar(select(User).where(User.email == clean_email))

        if user is not None and user.password_hash:
            token = secrets.token_urlsafe(32)
            user.password_reset_token = token
            user.password_reset_token_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
            session.commit()

            base_origin = str(_settings.frontend_origin).rstrip("/")
            reset_link = f"{base_origin}/reset-password?token={token}"
            print(f"\n==========================================")
            print(f"[Password Reset Link for {clean_email}]")
            print(f"Link: {reset_link}")
            print(f"==========================================\n")

        return {"message": "If this email is registered, password reset instructions have been sent."}

    def reset_password_with_token(self, session: Session, token: str, new_password: str) -> TokenResponse:
        """Reset password using the email reset token."""
        if len(new_password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")

        user = session.scalar(select(User).where(User.password_reset_token == token))
        if user is None or not user.password_reset_token_expires_at:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired password reset link")

        now = datetime.now(timezone.utc)
        expires_at = user.password_reset_token_expires_at.replace(tzinfo=timezone.utc) if user.password_reset_token_expires_at.tzinfo is None else user.password_reset_token_expires_at

        if expires_at < now:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password reset link has expired. Please request a new one.")

        user.password_hash = hash_password(new_password)
        user.password_reset_token = None
        user.password_reset_token_expires_at = None
        user.failed_login_attempts = 0
        user.locked_until = None
        user.updated_at = now
        session.commit()

        loaded_user = self._load_user(session, user.id) or user
        read_model = self._to_read_model(loaded_user)

        access_token = create_access_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value, "phone": read_model.phone or ""},
            expires_delta=timedelta(minutes=15),
        )
        refresh_token = create_refresh_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value},
        )

        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            is_new_user=False,
            profile_completed=bool(loaded_user.profile_completed),
            user=read_model,
        )

    # -------------------------------------------------------------------------
    # Token Refresh
    # -------------------------------------------------------------------------

    def refresh_tokens(self, session: Session, refresh_token_str: str) -> TokenResponse:
        """Issue fresh access token and refresh token from a valid refresh token."""
        user_id = verify_refresh_token(refresh_token_str)
        user = self._load_user(session, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found")

        read_model = self._to_read_model(user)
        new_access_token = create_access_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value, "phone": read_model.phone or ""},
            expires_delta=timedelta(minutes=15),
        )
        new_refresh_token = create_refresh_token(
            subject=str(read_model.id),
            claims={"role": read_model.role.value},
        )

        return TokenResponse(
            access_token=new_access_token,
            refresh_token=new_refresh_token,
            is_new_user=False,
            profile_completed=bool(user.profile_completed),
            user=read_model,
        )

    # -------------------------------------------------------------------------
    # User Profile & Structured Indian Government Address Setup
    # -------------------------------------------------------------------------

    def update_profile_and_address(self, session: Session, user_id: int, payload: ProfileAddressRequest) -> UserRead:
        """Save user profile and structured Indian government address after first login."""
        user = self._load_user(session, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        # Full name
        user.name = payload.name.strip()

        # Phone number: Mandatory for collectors to reach residents
        if payload.phone:
            try:
                clean_phone = normalize_phone(payload.phone)
            except ValueError as exc:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

            existing_phone = session.scalar(select(User).where(User.phone == clean_phone, User.id != user_id))
            if existing_phone:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This phone number is already registered to another account")
            user.phone = clean_phone
        elif not user.phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is required so collection drivers can call for pickups",
            )

        # Email
        if payload.email:
            clean_email = payload.email.lower().strip()
            existing_email = session.scalar(select(User).where(User.email == clean_email, User.id != user_id))
            if existing_email:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This email is already associated with another account")
            user.email = clean_email

        # Structured Indian Address
        user.house_flat_number = payload.house_flat_number.strip()
        user.street_colony = payload.street_colony.strip()
        user.locality = payload.locality.strip()
        user.landmark = payload.landmark.strip()
        user.ward_number = payload.ward_number.strip()
        user.pincode = payload.pincode.strip()
        user.latitude = payload.latitude
        user.longitude = payload.longitude

        # Automatically format the comprehensive single address string
        user.update_formatted_address()
        user.profile_completed = True
        user.updated_at = datetime.now(timezone.utc)

        # Attempt to map to municipal operational zone if matching ward
        if payload.ward_number:
            try:
                zone = session.scalar(
                    select(Zone).where(
                        (Zone.code == payload.ward_number) | (Zone.name.ilike(f"%{payload.ward_number}%"))
                    )
                )
                if zone:
                    user.zone_id = zone.id
            except Exception:
                pass

        session.commit()
        return self._to_read_model(user)

    # -------------------------------------------------------------------------
    # Account Linking (Link Phone & Email to Single Account)
    # -------------------------------------------------------------------------

    def link_phone(self, session: Session, user_id: int, phone: str, code: str) -> UserRead:
        """Link and verify an Indian mobile number to an existing email-based account."""
        try:
            normalized_phone = normalize_phone(phone)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

        if not otp_service.verify_code(session, normalized_phone, code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP code")

        existing = session.scalar(select(User).where(User.phone == normalized_phone, User.id != user_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This phone number is already linked to another account")

        user = self._load_user(session, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.phone = normalized_phone
        user.phone_verified = True
        user.verified = True
        user.updated_at = datetime.now(timezone.utc)
        session.commit()
        return self._to_read_model(user)

    def link_email(self, session: Session, user_id: int, email: str, password: str) -> UserRead:
        """Link an email and password to an existing phone-based account."""
        clean_email = email.lower().strip()
        if len(password) < 8:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")

        existing = session.scalar(select(User).where(User.email == clean_email, User.id != user_id))
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This email is already linked to another account")

        user = self._load_user(session, user_id)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.email = clean_email
        user.password_hash = hash_password(password)
        user.email_verified = True
        user.updated_at = datetime.now(timezone.utc)
        session.commit()
        return self._to_read_model(user)

    # -------------------------------------------------------------------------
    # Legacy Compatibility Methods
    # -------------------------------------------------------------------------

    def register(self, session: Session, payload: RegisterRequest) -> UserRead:
        """Legacy public registration flow for backward compatibility."""
        phone = normalize_phone(payload.phone)
        if payload.role == UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator accounts cannot be created through public registration",
            )
        existing_by_phone = self.get_user_by_phone(session, phone)
        if existing_by_phone is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Phone number is already registered")

        email = payload.email.lower() if payload.email else None
        if email:
            existing_by_email = session.scalar(select(User).where(User.email == email))
            if existing_by_email is not None:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

        if payload.role == UserRole.DRIVER and not payload.vehicle_number:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Driver registrations require a vehicle number")
        if payload.role == UserRole.RECYCLER and not payload.business_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recycler registrations require a business name")

        now = datetime.now(timezone.utc)
        user = User(
            name=payload.name,
            phone=phone,
            email=email,
            password_hash=hash_password(payload.password),
            role=payload.role,
            address=payload.address,
            verified=True,
            phone_verified=True,
            profile_completed=True,
            zone_id=payload.zone_id,
            electricity_bill_path=payload.electricity_bill_path,
            locale_preference=payload.locale_preference or "en",
            created_at=now,
            updated_at=now,
        )
        session.add(user)
        try:
            session.flush()
            user.household_id = f"ECO-{now.year}-{user.id:06d}"
            if payload.referral_code:
                from app.services.referral_service import referral_service
                referral_service.process_referral_on_registration(session, user.id, payload.referral_code)
            if payload.role == UserRole.DRIVER and payload.vehicle_number:
                session.add(
                    Driver(
                        user_id=user.id,
                        vehicle_number=payload.vehicle_number,
                        availability=DriverAvailability.AVAILABLE,
                    )
                )
            elif payload.role == UserRole.RECYCLER:
                accepted_materials = [
                    m.value if hasattr(m, "value") else str(m)
                    for m in (payload.materials_accepted or [])
                ]
                session.add(
                    Recycler(
                        user_id=user.id,
                        business_name=payload.business_name or payload.name,
                        materials_accepted=accepted_materials,
                        service_zone_ids=payload.service_zone_ids or [],
                        verification_status=RecyclerVerificationStatus.PENDING,
                        verification_doc_url=payload.verification_doc_url,
                    )
                )
            session.commit()
        except IntegrityError as exc:
            session.rollback()
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Registration conflicts with an existing record") from exc

        persisted = self._load_user(session, user.id)
        if persisted is None:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Unable to load registered user")
        return self._to_read_model(persisted)

    def login(self, session: Session, payload: LoginRequest) -> TokenResponse:
        """Legacy login endpoint."""
        user = self.get_user_by_phone(session, payload.phone)
        if user is None or not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid phone or password")
        
        user = self._load_user(session, user.id) or user
        read_model = self._to_read_model(user)
        token = create_access_token(subject=str(read_model.id), claims={"role": read_model.role.value, "phone": read_model.phone or ""})
        refresh = create_refresh_token(subject=str(read_model.id), claims={"role": read_model.role.value})
        return TokenResponse(access_token=token, refresh_token=refresh, profile_completed=bool(user.profile_completed), user=read_model)

    def mark_phone_verified(self, session: Session, phone: str) -> None:
        user = self.get_user_by_phone(session, phone)
        if user is not None:
            user.verified = True
            user.phone_verified = True
            user.updated_at = datetime.now(timezone.utc)
            session.flush()

    def reset_password(self, session: Session, phone: str, code: str, new_password: str) -> TokenResponse:
        normalized_phone = normalize_phone(phone)
        if not otp_service.verify_code(session, normalized_phone, code):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
        self.mark_phone_verified(session, normalized_phone)
        user = self.get_user_by_phone(session, normalized_phone)
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        user.password_hash = hash_password(new_password)
        user.failed_login_attempts = 0
        user.locked_until = None
        user.updated_at = datetime.now(timezone.utc)
        session.commit()

        loaded_user = self._load_user(session, user.id) or user
        read_model = self._to_read_model(loaded_user)
        token = create_access_token(subject=str(read_model.id), claims={"role": read_model.role.value, "phone": read_model.phone or ""})
        refresh = create_refresh_token(subject=str(read_model.id), claims={"role": read_model.role.value})
        return TokenResponse(access_token=token, refresh_token=refresh, user=read_model)

    def _to_read_model(self, user: User) -> UserRead:
        recycler = getattr(user, "recycler_profile", None)
        driver = getattr(user, "driver_profile", None)
        return UserRead(
            id=user.id,
            name=user.name,
            phone=user.phone,
            email=user.email,
            role=user.role if isinstance(user.role, UserRole) else UserRole(str(user.role)),
            address=user.address,
            verified=user.verified,
            phone_verified=getattr(user, "phone_verified", False),
            email_verified=getattr(user, "email_verified", False),
            profile_completed=getattr(user, "profile_completed", False),
            house_flat_number=getattr(user, "house_flat_number", None),
            street_colony=getattr(user, "street_colony", None),
            locality=getattr(user, "locality", None),
            landmark=getattr(user, "landmark", None),
            ward_number=getattr(user, "ward_number", None),
            pincode=getattr(user, "pincode", None),
            latitude=getattr(user, "latitude", None),
            longitude=getattr(user, "longitude", None),
            zone_id=user.zone_id,
            household_id=user.household_id,
            electricity_bill_path=user.electricity_bill_path,
            driver_id=driver.id if driver else None,
            vehicle_number=driver.vehicle_number if driver else None,
            recycler_id=recycler.id if recycler else None,
            business_name=recycler.business_name if recycler else None,
            verification_status=recycler.verification_status if recycler else None,
            materials_accepted=recycler.materials_accepted if recycler else None,
            service_zone_ids=recycler.service_zone_ids if recycler else None,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


auth_service = AuthService()
