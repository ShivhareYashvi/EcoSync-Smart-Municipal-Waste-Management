from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.phone import normalize_phone
from app.core.security import get_current_user
from app.db import get_db
from app.models.user import User
from app.schemas.auth import (
    EmailLoginRequest,
    EmailSignupRequest,
    EmailVerifyRequest,
    ForgotPasswordEmailRequest,
    ForgotPasswordResetRequest,
    LinkEmailRequest,
    LinkPhoneRequest,
    LoginRequest,
    OTPRequest,
    OTPResponse,
    OTPVerifyRequest,
    PhoneOTPRequest,
    PhoneOTPVerifyRequest,
    ProfileAddressRequest,
    RefreshTokenRequest,
    RegisterRequest,
    ResetPasswordTokenRequest,
    TokenResponse,
)
from app.schemas.user import UserRead
from app.services.auth_service import auth_service
from app.services.otp_service import otp_service

router = APIRouter(prefix="/auth", tags=["authentication"])


# -----------------------------------------------------------------------------
# Option 1: Phone Login (OTP, No Password)
# -----------------------------------------------------------------------------

@router.post("/phone/otp/request", response_model=OTPResponse)
def request_phone_otp(payload: PhoneOTPRequest, session: Session = Depends(get_db)) -> OTPResponse:
    """Request a 6-digit OTP for a 10-digit Indian mobile number."""
    data = auth_service.request_phone_otp(session, payload.phone)
    return OTPResponse(**data)


@router.post("/phone/otp/verify", response_model=TokenResponse)
def verify_phone_otp(payload: PhoneOTPVerifyRequest, session: Session = Depends(get_db)) -> TokenResponse:
    """Verify OTP and authenticate user. Creates new citizen account if phone not found."""
    return auth_service.verify_phone_otp_and_login(session, payload.phone, payload.code)


# -----------------------------------------------------------------------------
# Option 2: Email + Password Authentication
# -----------------------------------------------------------------------------

@router.post("/email/signup", status_code=status.HTTP_201_CREATED)
def email_signup(payload: EmailSignupRequest, session: Session = Depends(get_db)) -> dict:
    """Sign up with email and password (minimum 8 characters). Sends verification link."""
    return auth_service.signup_email(session, payload)


@router.post("/email/verify", response_model=TokenResponse)
def email_verify(payload: EmailVerifyRequest, session: Session = Depends(get_db)) -> TokenResponse:
    """Verify email via token link and log user in."""
    return auth_service.verify_email(session, payload.token)


@router.post("/email/login", response_model=TokenResponse)
def email_login(payload: EmailLoginRequest, session: Session = Depends(get_db)) -> TokenResponse:
    """Sign in with email and password. Requires verified email; locks after 5 wrong attempts."""
    return auth_service.login_email(session, payload)


@router.post("/email/forgot-password")
def email_forgot_password(payload: ForgotPasswordEmailRequest, session: Session = Depends(get_db)) -> dict:
    """Request a password reset link sent to the user's email."""
    return auth_service.forgot_password_email(session, payload.email)


@router.post("/email/reset-password", response_model=TokenResponse)
def email_reset_password(payload: ResetPasswordTokenRequest, session: Session = Depends(get_db)) -> TokenResponse:
    """Reset password using email token."""
    return auth_service.reset_password_with_token(session, payload.token, payload.new_password)


# -----------------------------------------------------------------------------
# Token Refresh
# -----------------------------------------------------------------------------

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, session: Session = Depends(get_db)) -> TokenResponse:
    """Exchange a valid refresh token (30-day expiry) for fresh tokens."""
    return auth_service.refresh_tokens(session, payload.refresh_token)


# -----------------------------------------------------------------------------
# User Profile & Structured Indian Government Address Setup (Post-Login)
# -----------------------------------------------------------------------------

@router.post("/profile-address", response_model=UserRead)
def complete_profile_and_address(
    payload: ProfileAddressRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    """Save full name, mobile number, and Indian government structured address (House/Flat, Street, Locality, Landmark, Ward, Pincode, GPS pin)."""
    return auth_service.update_profile_and_address(session, current_user.id, payload)


# -----------------------------------------------------------------------------
# Account Linking (Link Phone & Email into Single Account)
# -----------------------------------------------------------------------------

@router.post("/link-phone", response_model=UserRead)
def link_phone(
    payload: LinkPhoneRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    """Link a verified Indian phone number to an email-created account."""
    return auth_service.link_phone(session, current_user.id, payload.phone, payload.code)


@router.post("/link-email", response_model=UserRead)
def link_email(
    payload: LinkEmailRequest,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserRead:
    """Link an email and password to a phone-created account."""
    return auth_service.link_email(session, current_user.id, payload.email, payload.password)


# -----------------------------------------------------------------------------
# Legacy Compatibility Endpoints
# -----------------------------------------------------------------------------

@router.post("/otp/request", response_model=OTPResponse)
def request_otp(payload: OTPRequest, session: Session = Depends(get_db)) -> OTPResponse:
    try:
        normalized_phone = normalize_phone(payload.phone)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    try:
        record = otp_service.create_code(session, normalized_phone)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=str(exc))
    session.commit()
    message = "OTP sent to your phone number."
    if record.delivery_channel != "sms":
        message = "OTP generated. In local mode, enter 1234 or inspect console logs."
    return OTPResponse(
        phone=normalized_phone,
        expires_in_seconds=otp_service.ttl_seconds,
        delivery_channel=record.delivery_channel,
        message=message,
    )


@router.post("/otp/verify", response_model=OTPResponse)
def verify_otp(payload: OTPVerifyRequest, session: Session = Depends(get_db)) -> OTPResponse:
    try:
        normalized_phone = normalize_phone(payload.phone)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not otp_service.verify_code(session, normalized_phone, payload.code):
        session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
    auth_service.mark_phone_verified(session, normalized_phone)
    session.commit()
    return OTPResponse(phone=normalized_phone, expires_in_seconds=0, message="Phone number verified")


@router.post("/forgot-password", response_model=OTPResponse)
def forgot_password(payload: OTPRequest, session: Session = Depends(get_db)) -> OTPResponse:
    try:
        normalized_phone = normalize_phone(payload.phone)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if auth_service.get_user_by_phone(session, normalized_phone) is None:
        return OTPResponse(
            phone=normalized_phone,
            expires_in_seconds=otp_service.ttl_seconds,
            delivery_channel="sms",
            message="If this phone number is registered, an OTP verification code has been sent.",
        )
    return request_otp(OTPRequest(phone=normalized_phone), session)


@router.post("/forgot-password/reset", response_model=TokenResponse)
def reset_password(payload: ForgotPasswordResetRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.reset_password(session, payload.phone, payload.code, payload.new_password)


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, session: Session = Depends(get_db)) -> UserRead:
    return auth_service.register(session, payload)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, session: Session = Depends(get_db)) -> TokenResponse:
    return auth_service.login(session, payload)
