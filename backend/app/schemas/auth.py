from pydantic import BaseModel, EmailStr, Field

from app.models.enums import MaterialType, UserRole
from app.schemas.user import UserRead


class OTPRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=30)


class OTPVerifyRequest(OTPRequest):
    code: str = Field(min_length=4, max_length=8)


class OTPResponse(BaseModel):
    phone: str
    expires_in_seconds: int
    delivery_channel: str = "sms"
    message: str


# --- Option 1: Phone Login (OTP, No Password) ---
class PhoneOTPRequest(BaseModel):
    phone: str = Field(description="10-digit Indian mobile number")


class PhoneOTPVerifyRequest(BaseModel):
    phone: str = Field(description="10-digit Indian mobile number")
    code: str = Field(min_length=4, max_length=8, description="6-digit OTP code")


# --- Option 2: Email + Password ---
class EmailSignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.CITIZEN


class EmailLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class EmailVerifyRequest(BaseModel):
    token: str


class ForgotPasswordEmailRequest(BaseModel):
    email: EmailStr


class ResetPasswordTokenRequest(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


# --- Token Management ---
class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str = ""
    token_type: str = "bearer"
    is_new_user: bool = False
    profile_completed: bool = False
    user: UserRead


# --- Profile & Address Setup (Collected after first login) ---
class ProfileAddressRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, description="Required if user registered via email")
    email: EmailStr | None = Field(default=None, description="Optional if user registered via phone")
    
    # Structured Indian Government Address Format
    house_flat_number: str = Field(min_length=1, max_length=120, description="House / Flat / Plot number")
    street_colony: str = Field(min_length=2, max_length=255, description="Street / Colony / Society name")
    locality: str = Field(min_length=2, max_length=120, description="Locality or Area (e.g. Arera Colony, MP Nagar)")
    landmark: str = Field(min_length=2, max_length=255, description="Prominent nearby landmark")
    ward_number: str = Field(min_length=1, max_length=50, description="Municipal ward number")
    pincode: str = Field(pattern=r"^\d{6}$", description="6-digit postal pincode")
    latitude: float | None = Field(default=None, description="GPS pin latitude")
    longitude: float | None = Field(default=None, description="GPS pin longitude")


# --- Method Linking ---
class LinkPhoneRequest(BaseModel):
    phone: str = Field(description="10-digit Indian mobile number")
    code: str = Field(min_length=4, max_length=8, description="OTP code")


class LinkEmailRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


# --- Legacy compatibility schemas ---
class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=7, max_length=30)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)
    address: str = Field(min_length=5)
    role: UserRole = UserRole.CITIZEN
    zone_id: int | None = None
    vehicle_number: str | None = Field(default=None, max_length=40)
    electricity_bill_path: str | None = Field(default=None, max_length=512)
    business_name: str | None = Field(default=None, max_length=255)
    materials_accepted: list[MaterialType] | None = None
    service_zone_ids: list[int] | None = None
    verification_doc_url: str | None = Field(default=None, max_length=512)
    referral_code: str | None = Field(default=None, max_length=50)
    locale_preference: str = Field(default="en", max_length=10)


class LoginRequest(BaseModel):
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)


class ForgotPasswordResetRequest(OTPVerifyRequest):
    new_password: str = Field(min_length=8, max_length=128)
