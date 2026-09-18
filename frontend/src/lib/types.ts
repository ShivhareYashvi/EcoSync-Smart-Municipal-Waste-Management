export type UserRole = 'citizen' | 'driver' | 'admin';
export type PickupStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type WasteType = 'wet' | 'dry' | 'e-waste' | 'bulky';
export type WasteCategory = 'wet' | 'dry' | 'hazardous' | 'e_waste' | 'mixed';
export type ComplaintStatus = 'open' | 'in_review' | 'resolved' | 'rejected';
export type DriverAvailability = 'available' | 'on_route' | 'off_duty' | 'suspended';
export type PointsTransactionStatus = 'pending' | 'approved' | 'flagged';
export type UserTier = 'bronze' | 'silver' | 'gold';
export type CatalogCategory = 'utility_credit' | 'service_perk' | 'voucher';
export type RedemptionStatus = 'requested' | 'fulfilled' | 'cancelled';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  address: string;
  verified: boolean;
  household_id: string | null;
  electricity_bill_path: string | null;
  driver_id: number | null;
  vehicle_number: string | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Pickup {
  id: number;
  user_id: number;
  driver_id: number | null;
  waste_type: WasteType;
  status: PickupStatus;
  scheduled_date: string;
  scheduled_time: string;
  coordinates: Coordinates | null;
  notes: string | null;
  // Phase 1 fields
  weight_kg: number | null;
  waste_category: WasteCategory | null;
  segregation_verified: boolean;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: number;
  user_id: number;
  category: string;
  description: string;
  image: string | null;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
}

export interface Reward {
  id: number;
  user_id: number;
  points: number;
  source: string;
  redeemed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: number;
  user_id: number;
  vehicle_number: string;
  availability: DriverAvailability;
}

export interface DriverLocation {
  id: number;
  driver_id: number;
  pickup_id: number;
  latitude: number;
  longitude: number;
  status: PickupStatus;
  note: string | null;
  recorded_at: string;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsMetric {
  label: string;
  value: number;
}

export interface WasteDistributionPoint {
  waste_type: string;
  requests: number;
}

export interface AnalyticsSummary {
  waste_distribution: WasteDistributionPoint[];
  pickup_efficiency: AnalyticsMetric;
  area_wise_pickups: AnalyticsMetric[];
  complaint_trends: AnalyticsMetric[];
  recycling_participation: AnalyticsMetric;
}

export interface OTPResponse {
  phone: string;
  expires_in_seconds: number;
  delivery_channel: string;
  message: string;
}

export interface UploadResponse {
  file_name: string;
  stored_path: string;
  public_url: string;
}

// ── Phase 1 types ─────────────────────────────────────────────────────────────

export interface PointsTransaction {
  id: number;
  user_id: number;
  pickup_id: number | null;
  points: number;
  reason: string;
  status: PointsTransactionStatus;
  created_at: string;
}

export interface UserTierInfo {
  user_id: number;
  current_tier: UserTier;
  points_balance: number;
  points_lifetime: number;
  flags_count: number;
  tier_updated_at: string;
  recent_transactions: PointsTransaction[];
}

export interface ComplianceScore {
  user_id: number;
  rolling_score: number;
  total_pickups: number;
  verified_pickups: number;
  updated_at: string;
}

export interface CatalogItem {
  id: number;
  item_name: string;
  points_cost: number;
  category: CatalogCategory;
  active: boolean;
}

export interface Redemption {
  id: number;
  user_id: number;
  catalog_item_id: number | null;
  points_spent: number;
  status: RedemptionStatus;
  created_at: string;
  updated_at: string;
}

// ── Phase 2 types ─────────────────────────────────────────────────────────────

export interface Zone {
  id: number;
  name: string;
  code: string;
  city: string;
  created_at: string;
}

export type FuelType = 'diesel' | 'cng' | 'electric' | 'petrol';
export type BulkGeneratorCategory = 'hotel' | 'mall' | 'apartment_complex' | 'office' | 'other';
export type BillingStatus = 'active' | 'suspended';
export type RouteStatus = 'planned' | 'in_progress' | 'completed';
export type RouteStopStatus = 'pending' | 'arrived' | 'skipped';
export type HotspotStatus = 'active' | 'resolved';

export interface Vehicle {
  id: number;
  registration_number: string;
  capacity_kg: number;
  fuel_type: FuelType;
  maintenance_due_date: string;
  assigned_driver_id: number | null;
  active: boolean;
  maintenance_due_soon: boolean;
  pickups_completed_this_week: number;
}

export interface BulkGenerator {
  id: number;
  org_name: string;
  category: BulkGeneratorCategory;
  address: string;
  zone_id: number;
  contact_user_id: number;
  threshold_kg: number;
  billing_status: BillingStatus;
  created_at: string;
}

export interface RouteStop {
  id: number;
  pickup_id: number;
  sequence_order: number;
  estimated_arrival: string | null;
  actual_arrival: string | null;
  status: RouteStopStatus;
}

export interface Route {
  id: number;
  driver_id: number;
  vehicle_id: number | null;
  zone_id: number;
  route_date: string;
  status: RouteStatus;
  created_at: string;
  stops: RouteStop[];
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
  zone_id: number | null;
  zone_name: string | null;
}

export interface HeatmapResponse {
  points: HeatmapPoint[];
}

export interface ComplaintHotspot {
  id: number;
  zone_id: number;
  zone_name: string | null;
  complaint_count: number;
  first_flagged_at: string;
  status: HotspotStatus;
  resolved_at: string | null;
}

export interface ZoneAnalytics {
  zone_id: number;
  zone_name: string;
  segregation_compliance_pct: number;
  avg_complaint_sla_hours: number | null;
  missed_pickup_rate_pct: number;
  total_kg_collected: number;
  active_hotspot_count: number;
}

export interface CityWideAnalytics {
  zones: ZoneAnalytics[];
  city: string;
}

