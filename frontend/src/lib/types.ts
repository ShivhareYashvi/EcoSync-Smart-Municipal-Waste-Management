export type UserRole = 'citizen' | 'driver' | 'admin' | 'recycler';
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
  recycler_id?: number | null;
  business_name?: string | null;
  verification_status?: RecyclerVerificationStatus | null;
  materials_accepted?: MaterialType[] | null;
  service_zone_ids?: number[] | null;
  zone_id?: number | null;
  locale_preference?: string;
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
  zone_id?: number | null;
  category: string;
  description: string;
  image: string | null;
  status: ComplaintStatus;
  upvote_count?: number;
  user_has_upvoted?: boolean;
  resolved_at?: string | null;
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

// ── Phase 1 types ─

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

// ── Phase 2 types ─

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

// ── Phase 3 Marketplace Types ──────────────────────────────────────────────

export type MaterialType = 'plastic' | 'paper' | 'metal' | 'e_waste' | 'glass';
export type RecyclerVerificationStatus = 'pending' | 'verified' | 'rejected';
export type RecyclingTransactionStatus = 'requested' | 'logged' | 'confirmed' | 'disputed';
export type EPRCreditStatus = 'available' | 'claimed';
export type CompostBatchStatus = 'collected' | 'composting' | 'completed';

export interface RateCard {
  id: number;
  recycler_id: number;
  material: MaterialType;
  rate_per_kg: string | number;
  effective_from: string;
  active: boolean;
}

export interface PublicRate {
  id: number;
  recycler_id: number;
  recycler_business_name: string;
  service_zone_ids: number[];
  material: MaterialType;
  rate_per_kg: string | number;
  effective_from: string;
}

export interface Recycler {
  id: number;
  user_id: number;
  business_name: string;
  materials_accepted: MaterialType[];
  service_zone_ids: number[];
  verification_status: RecyclerVerificationStatus;
  verification_doc_url: string | null;
  rate_cards?: RateCard[];
  created_at: string;
  updated_at: string;
}

export interface RecyclingReceipt {
  id: number;
  transaction_id: number;
  receipt_number: string;
  material: MaterialType;
  weight_kg: string | number;
  amount_credited: string | number;
  issued_at: string;
}

export interface RecyclingTransaction {
  id: number;
  citizen_id: number;
  citizen_name?: string | null;
  citizen_phone?: string | null;
  recycler_id: number;
  recycler_business_name?: string | null;
  material: MaterialType;
  estimated_weight_kg?: string | number | null;
  weight_kg?: string | number | null;
  rate_applied?: string | number | null;
  amount_credited?: string | number | null;
  photo_url?: string | null;
  status: RecyclingTransactionStatus;
  created_at: string;
  receipt?: RecyclingReceipt | null;
}

export interface BrandAccount {
  id: number;
  org_name: string;
  contact_email: string;
  created_at: string;
}

export interface EPRCredit {
  id: number;
  receipt_id: number;
  receipt_number?: string | null;
  material?: MaterialType | null;
  credit_amount: string | number;
  status: EPRCreditStatus;
  brand_id?: number | null;
  brand_name?: string | null;
  created_at: string;
  claimed_at?: string | null;
}

export interface CompostBatch {
  id: number;
  zone_id: number;
  zone_name?: string | null;
  period_start: string;
  period_end: string;
  total_weight_kg: string | number;
  status: CompostBatchStatus;
  buyer_note?: string | null;
  created_at: string;
}

// ── Phase 4: Citizen Engagement & Community ──────────────
export type SocietyMemberRole = 'member' | 'rwa_admin';
export type SocietyMemberStatus = 'pending' | 'active' | 'rejected';
export type ReferralStatus = 'pending' | 'completed';

export interface Society {
  id: number;
  name: string;
  address: string;
  zone_id: number;
  created_at: string;
}

export interface SocietyMembership {
  id: number;
  user_id: number;
  society_id: number;
  role: SocietyMemberRole;
  status: SocietyMemberStatus;
  registration_doc_path?: string | null;
  joined_at: string;
  user_name?: string | null;
  user_email?: string | null;
  society_name?: string | null;
}

export interface SocietyDashboard {
  society_id: number;
  society_name: string;
  zone_id: number;
  total_members: number;
  active_members: number;
  privacy_suppressed: boolean;
  message?: string | null;
  average_compliance?: number | null;
  total_verified_pickups?: number | null;
  total_points_earned?: number | null;
  zone_rank?: number | null;
}

export interface LeaderboardSettings {
  user_id: number;
  opted_in: boolean;
  display_handle?: string | null;
  opted_in_at?: string | null;
}

export interface IndividualLeaderboardEntry {
  rank: number;
  user_id: number;
  display_handle: string;
  points: number;
  compliance_score: number;
  verified_pickups: number;
  zone_id?: number | null;
  society_id?: number | null;
}

export interface SocietyLeaderboardEntry {
  rank: number;
  society_id: number;
  society_name: string;
  zone_id: number;
  active_members: number;
  average_compliance: number;
  total_verified_pickups: number;
  total_points: number;
}

export interface ReferralCodeResponse {
  referral_code: string;
  referral_link: string;
  bonus_points: number;
}

export interface ReferralItem {
  id: number;
  referred_user_id: number;
  referred_user_name?: string | null;
  status: ReferralStatus;
  points_awarded: boolean;
  created_at: string;
}

export interface ReferralSummary {
  referral_code: string;
  referral_link: string;
  bonus_points_per_referral: number;
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_points_earned: number;
  referrals: ReferralItem[];
}

