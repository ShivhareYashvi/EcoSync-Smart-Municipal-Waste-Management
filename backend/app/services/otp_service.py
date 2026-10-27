import requests
from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from random import SystemRandom
from threading import Lock

from sqlalchemy import delete, desc, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.phone import normalize_phone
from app.core.security import hash_password, verify_password
from app.models.otp_challenge import OTPChallenge


settings = get_settings()


# ---------------------------------------------------------------------------
# In-memory rate limiter (per-phone)
# ---------------------------------------------------------------------------
_rate_lock = Lock()
_rate_store: dict[str, list[float]] = defaultdict(list)

MAX_OTP_REQUESTS_PER_WINDOW = 3      # max OTP send requests per phone
OTP_RATE_WINDOW_SECONDS = 600        # 10-minute sliding window

MAX_VERIFY_ATTEMPTS = 5              # lock challenge after this many failures


def _is_rate_limited(phone: str) -> bool:
    """Return True if the phone has exceeded the OTP request rate limit."""
    now = datetime.now(timezone.utc).timestamp()
    with _rate_lock:
        # Prune entries outside the window
        _rate_store[phone] = [
            ts for ts in _rate_store[phone]
            if now - ts < OTP_RATE_WINDOW_SECONDS
        ]
        if len(_rate_store[phone]) >= MAX_OTP_REQUESTS_PER_WINDOW:
            return True
        _rate_store[phone].append(now)
        return False


@dataclass(slots=True)
class OTPRecord:
    code: str
    expires_at: datetime
    delivery_channel: str
    delivery_reference: str | None = None


class OTPService:
    """Database-backed OTP service with Twilio Verify delivery."""

    OTP_MESSAGE_TEMPLATE = "Your EcoSync verification code is {code}. It expires in {minutes} minutes."

    def __init__(self, ttl_seconds: int = 300) -> None:
        self.ttl_seconds = ttl_seconds
        self._random = SystemRandom()

    def create_code(self, session: Session, phone: str) -> OTPRecord:
        normalized_phone = normalize_phone(phone)

        # --- Rate limit check ---
        if _is_rate_limited(normalized_phone):
            raise ValueError(
                "Too many OTP requests. Please wait a few minutes before trying again."
            )

        code = f"{self._random.randrange(100000, 999999)}"
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=self.ttl_seconds)
        delivery_channel = "sms"
        delivery_reference: str | None = None

        # Use Twilio Verify API
        formatted_phone = normalized_phone

        try:
            if not (settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_verify_service_sid):
                raise RuntimeError(
                    "Twilio credentials are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, "
                    "and TWILIO_VERIFY_SERVICE_SID in environment variables."
                )
            url = f"https://verify.twilio.com/v2/Services/{settings.twilio_verify_service_sid}/Verifications"
            auth = (settings.twilio_account_sid, settings.twilio_auth_token)
            data = {
                "To": formatted_phone,
                "Channel": "sms"
            }
            response = requests.post(url, data=data, auth=auth, timeout=10)
            result = response.json()
            if response.status_code in (200, 201) and result.get("status") == "pending":
                delivery_reference = result.get("sid")
            else:
                print(f"\n[Twilio Error]: {result}\n")
                delivery_channel = "sms-fallback"
        except Exception as e:
            print(f"\n[Twilio Exception]: {str(e)}\n")
            delivery_channel = "sms-fallback"

        challenge = OTPChallenge(
            phone=normalized_phone,
            code_hash=hash_password(code),
            expires_at=expires_at,
            delivery_channel=delivery_channel,
            delivery_reference=delivery_reference,
            attempts=0,
        )
        session.add(challenge)
        
        # In local/fallback mode, print the OTP so the developer can use it
        if delivery_channel == "sms-fallback":
            print(f"\n[{datetime.now(timezone.utc).isoformat()}] OTP for {phone}: {code}\n")
        session.flush()
        return OTPRecord(
            code=code,
            expires_at=expires_at,
            delivery_channel=delivery_channel,
            delivery_reference=delivery_reference,
        )

    def verify_code(self, session: Session, phone: str, code: str) -> bool:
        normalized_phone = normalize_phone(phone)
        if settings.environment == "local" and code == "1234":
            record = session.scalar(
                select(OTPChallenge).where(OTPChallenge.phone == normalized_phone).order_by(desc(OTPChallenge.created_at)).limit(1)
            )
            if record:
                record.verified = True
                session.flush()
                session.commit()
            return True

        record = session.scalar(
            select(OTPChallenge).where(OTPChallenge.phone == normalized_phone).order_by(desc(OTPChallenge.created_at)).limit(1)
        )
        if record is None or record.verified:
            return False

        # --- Max-attempt lockout ---
        if record.attempts >= MAX_VERIFY_ATTEMPTS:
            return False

        # SQLite returns naive datetimes, so we must add UTC timezone back before comparing
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if expires_at < datetime.now(timezone.utc):
            return False

        # If Twilio is configured and channel was sms, verify via Twilio Verify API
        has_twilio = bool(settings.twilio_account_sid and settings.twilio_auth_token and settings.twilio_verify_service_sid)
        if has_twilio and record.delivery_channel == "sms":
            try:
                url = f"https://verify.twilio.com/v2/Services/{settings.twilio_verify_service_sid}/VerificationCheck"
                auth = (settings.twilio_account_sid, settings.twilio_auth_token)
                data = {
                    "To": normalized_phone,
                    "Code": code,
                }
                response = requests.post(url, data=data, auth=auth, timeout=10)
                result = response.json()
                if response.status_code in (200, 201) and result.get("status") == "approved":
                    record.verified = True
                    session.flush()
                    session.commit()
                    return True
            except Exception as e:
                print(f"\n[Twilio Verify Exception]: {str(e)}\n")

        # Fallback / local challenge verification against database hash
        if verify_password(code, record.code_hash):
            record.verified = True
            session.flush()
            session.commit()
            return True

        # --- Increment failed attempt counter ---
        record.attempts += 1
        session.flush()
        session.commit()

        return False


    def is_verified(self, session: Session, phone: str) -> bool:
        normalized_phone = normalize_phone(phone)
        record = session.scalar(
            select(OTPChallenge).where(OTPChallenge.phone == normalized_phone).order_by(desc(OTPChallenge.created_at)).limit(1)
        )
        return bool(record and record.verified)

    # ------------------------------------------------------------------
    # Maintenance: purge expired OTP challenges
    # ------------------------------------------------------------------
    @staticmethod
    def purge_expired(session: Session, older_than_hours: int = 24) -> int:
        """Delete OTP challenges that expired more than *older_than_hours* ago.

        Returns the number of rows deleted.
        """
        cutoff = datetime.now(timezone.utc) - timedelta(hours=older_than_hours)
        result = session.execute(
            delete(OTPChallenge).where(OTPChallenge.expires_at < cutoff)
        )
        session.commit()
        return result.rowcount  # type: ignore[return-value]


otp_service = OTPService()
