from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import BillingStatus, BulkGeneratorCategory


#  Zone schemas 

class ZoneRead(BaseModel):
    id: int
    name: str
    code: str
    city: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ZoneUserAssign(BaseModel):
    zone_id: int


#  Vehicle schemas 

class VehicleCreate(BaseModel):
    registration_number: str = Field(min_length=3, max_length=40)
    capacity_kg: float = Field(gt=0)
    fuel_type: str
    maintenance_due_date: date
    assigned_driver_id: int | None = None


class VehicleUpdate(BaseModel):
    capacity_kg: float | None = Field(default=None, gt=0)
    fuel_type: str | None = None
    maintenance_due_date: date | None = None
    assigned_driver_id: int | None = None
    active: bool | None = None


class VehicleRead(BaseModel):
    id: int
    registration_number: str
    capacity_kg: float
    fuel_type: str
    maintenance_due_date: date
    assigned_driver_id: int | None
    active: bool
    maintenance_due_soon: bool = False
    pickups_completed_this_week: int = 0

    model_config = {"from_attributes": True}


class VehicleMaintenanceRead(BaseModel):
    id: int
    registration_number: str
    maintenance_due_date: date
    days_until_due: int
    active: bool

    model_config = {"from_attributes": True}


#  Bulk generator schemas 

class BulkGeneratorCreate(BaseModel):
    org_name: str = Field(min_length=2, max_length=255)
    category: BulkGeneratorCategory
    address: str = Field(min_length=5)
    zone_id: int
    contact_user_id: int
    threshold_kg: float = Field(default=100.0, gt=0)


class BulkGeneratorRead(BaseModel):
    id: int
    org_name: str
    category: BulkGeneratorCategory
    address: str
    zone_id: int
    contact_user_id: int
    threshold_kg: float
    billing_status: BillingStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class BulkGeneratorStatusUpdate(BaseModel):
    billing_status: BillingStatus


#  Route schemas ─

class RouteGenerateRequest(BaseModel):
    driver_id: int
    zone_id: int
    route_date: date
    vehicle_id: int | None = None


class RouteStopRead(BaseModel):
    id: int
    pickup_id: int
    sequence_order: int
    estimated_arrival: datetime | None
    actual_arrival: datetime | None
    status: str

    model_config = {"from_attributes": True}


class RouteRead(BaseModel):
    id: int
    driver_id: int
    vehicle_id: int | None
    zone_id: int
    route_date: date
    status: str
    created_at: datetime
    stops: list[RouteStopRead] = []

    model_config = {"from_attributes": True}


class RouteStopStatusUpdate(BaseModel):
    status: str  # arrived | skipped


#  Complaint heatmap / hotspot schemas ─

class HeatmapPoint(BaseModel):
    latitude: float
    longitude: float
    weight: int
    zone_id: int | None
    zone_name: str | None


class HeatmapResponse(BaseModel):
    points: list[HeatmapPoint]


class ComplaintHotspotRead(BaseModel):
    id: int
    zone_id: int
    zone_name: str | None
    complaint_count: int
    first_flagged_at: datetime
    status: str
    resolved_at: datetime | None

    model_config = {"from_attributes": True}


class ZoneSLARead(BaseModel):
    zone_id: int
    zone_name: str
    avg_resolution_hours: float | None
    open_complaints: int
    overdue_complaints: int  # open > 7 days


#  Zone analytics schemas ─

class ZoneAnalytics(BaseModel):
    zone_id: int
    zone_name: str
    segregation_compliance_pct: float
    avg_complaint_sla_hours: float | None
    missed_pickup_rate_pct: float
    total_kg_collected: float
    active_hotspot_count: int


class CityWideAnalytics(BaseModel):
    zones: list[ZoneAnalytics]
    city: str
