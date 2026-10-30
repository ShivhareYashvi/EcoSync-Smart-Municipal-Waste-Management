from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from app.models.enums import MaterialType, RecyclerVerificationStatus, UserRole


class UserBase(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    role: UserRole = UserRole.CITIZEN
    address: str | None = None
    phone_verified: bool = False
    email_verified: bool = False
    profile_completed: bool = False
    house_flat_number: str | None = None
    street_colony: str | None = None
    locality: str | None = None
    landmark: str | None = None
    ward_number: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    zone_id: int | None = None


class UserCreate(UserBase):
    password: str | None = Field(default=None, min_length=8, max_length=128)
    electricity_bill_path: str | None = None
    vehicle_number: str | None = None
    business_name: str | None = None
    materials_accepted: list[MaterialType] | None = None
    service_zone_ids: list[int] | None = None
    verification_doc_url: str | None = None


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None
    verified: bool | None = None
    phone_verified: bool | None = None
    email_verified: bool | None = None
    profile_completed: bool | None = None
    house_flat_number: str | None = None
    street_colony: str | None = None
    locality: str | None = None
    landmark: str | None = None
    ward_number: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    household_id: str | None = None
    electricity_bill_path: str | None = None


class UserRead(UserBase):
    id: int
    verified: bool
    household_id: str | None = None
    electricity_bill_path: str | None = None
    driver_id: int | None = None
    vehicle_number: str | None = None
    recycler_id: int | None = None
    business_name: str | None = None
    verification_status: RecyclerVerificationStatus | None = None
    materials_accepted: list[MaterialType] | None = None
    service_zone_ids: list[int] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
