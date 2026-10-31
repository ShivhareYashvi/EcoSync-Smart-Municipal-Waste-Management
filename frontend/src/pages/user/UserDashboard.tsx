import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
  Compass,
  Cpu,
  Gift,
  Info,
  Layers,
  Leaf,
  LocateFixed,
  MapPin,
  MapPinned,
  MessageSquareWarning,
  Navigation,
  Package,
  Phone,
  Recycle,
  RotateCcw,
  Scale,
  Send,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Truck,
  UserCheck,
  Users,
  X,
  XCircle,
  Zap
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { TrackingMap } from '../../components/TrackingMap';
import { LocationPickerMap } from '../../components/LocationPickerMap';
import { CitizenRecyclingMarketplace } from '../../components/user/CitizenRecyclingMarketplace';
import { CommunityHubPanel } from '../../components/community/CommunityHubPanel';
import { CitizenProfilePanel } from '../../components/user/CitizenProfilePanel';
import { api, buildTrackingSocketUrl } from '../../lib/api';
import type {
  CatalogItem,
  ComplianceScore,
  Complaint,
  DriverLocation,
  Pickup,
  PickupStatus,
  Redemption,
  Reward,
  UserTierInfo,
  WasteType
} from '../../lib/types';
import { useSessionStore } from '../../store/session';

export const formatPickupCode = (id: number) => `PKP-${String(id).padStart(3, '0')}`;
export const formatComplaintCode = (id: number) => `CMP-${String(id).padStart(3, '0')}`;

const activePickupStatuses: PickupStatus[] = ['assigned', 'in_progress'];

const WASTE_CATEGORIES: Array<{
  type: WasteType;
  title: string;
  badge: string;
  description: string;
  icon: typeof Recycle;
  color: string;
  activeBorder: string;
  activeBg: string;
}> = [
  {
    type: 'wet',
    title: 'Wet / Organic Waste',
    badge: 'Compostable',
    description: 'Kitchen scraps, vegetable peels, leftover food, fruit rinds & coffee grounds.',
    icon: Leaf,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    activeBorder: 'border-emerald-600 ring-2 ring-emerald-500/20',
    activeBg: 'bg-emerald-50/70'
  },
  {
    type: 'dry',
    title: 'Dry / Recyclables',
    badge: 'Circular Economy',
    description: 'Clean paper, cardboard boxes, PET bottles, shampoo tubs & tin cans.',
    icon: Layers,
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    activeBorder: 'border-blue-600 ring-2 ring-blue-500/20',
    activeBg: 'bg-blue-50/70'
  },
  {
    type: 'e-waste',
    title: 'Electronic Waste',
    badge: 'Hazardous / Valuable',
    description: 'Decommissioned phones, chargers, circuit boards, batteries & cables.',
    icon: Cpu,
    color: 'text-purple-700 bg-purple-50 border-purple-200',
    activeBorder: 'border-purple-600 ring-2 ring-purple-500/20',
    activeBg: 'bg-purple-50/70'
  },
  {
    type: 'bulky',
    title: 'Bulky Household',
    badge: 'Special Vehicle',
    description: 'Old furniture, mattresses, broken appliances, wooden crates & debris.',
    icon: Package,
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    activeBorder: 'border-amber-600 ring-2 ring-amber-500/20',
    activeBg: 'bg-amber-50/70'
  }
];

const QUICK_INSTRUCTION_CHIPS = [
  'Near front gate',
  'Call upon arrival',
  'Ground floor porch',
  'Packed in sealed bags',
  'Security desk drop-off'
];

const getInitialSchedule = (userLat?: number | null, userLng?: number | null) => ({
  waste_type: 'wet' as WasteType,
  scheduled_date: new Date().toISOString().slice(0, 10),
  scheduled_time: '09:00',
  latitude: userLat ? String(userLat) : '',
  longitude: userLng ? String(userLng) : '',
  notes: ''
});

function tierColour(tier: string) {
  if (tier === 'gold') return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  if (tier === 'silver') return 'text-slate-700 bg-slate-100 border-slate-200';
  return 'text-amber-800 bg-amber-50 border-amber-200';
}

function getStatusBadge(status: PickupStatus) {
  switch (status) {
    case 'in_progress':
      return {
        label: 'Driver En Route',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        dot: 'bg-blue-500 animate-pulse'
      };
    case 'assigned':
      return {
        label: 'Driver Assigned',
        color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500'
      };
    case 'completed':
      return {
        label: 'Completed & Verified',
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500'
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        color: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500'
      };
    default:
      return {
        label: 'Scheduled (Pending Dispatch)',
        color: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500'
      };
  }
}

// ── Confirm / Dispute Row Controls ───────────────────────────────────────────
interface PickupActionsProps {
  pickup: Pickup;
  onDone: () => void;
}

function PickupConfirmDispute({ pickup, onDone }: PickupActionsProps) {
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const confirm = useMutation({
    mutationFn: () => api.post<Pickup>(`/pickups/${pickup.id}/confirm`),
    onSuccess: () => {
      setMsg('Pickup confirmed! Points credited to your balance.');
      onDone();
    },
    onError: () => setErr('Confirmation failed. Please try again.')
  });

  const dispute = useMutation({
    mutationFn: () => api.post<Pickup>(`/pickups/${pickup.id}/dispute`, { reason }),
    onSuccess: () => {
      setMsg('Dispute submitted for municipal review.');
      setDisputeOpen(false);
      onDone();
    },
    onError: () => setErr('Dispute submission failed. Please try again.')
  });

  if (pickup.weight_kg === null) return null;

  return (
    <div className="mt-3 rounded-2xl bg-blue-50/70 border border-blue-100 p-4 grid gap-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
          <Scale className="h-4 w-4 text-blue-600" />
          <span>
            Collector Weighed: <strong>{pickup.weight_kg} kg · {pickup.waste_category}</strong>
          </span>
        </p>
        {pickup.photo_url && (
          <span className="text-[11px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded-full border border-blue-200">
            📷 Scale Proof Attached
          </span>
        )}
      </div>

      {!msg && (
        <div className="flex gap-2 flex-wrap pt-1">
          <button
            type="button"
            disabled={confirm.isPending}
            onClick={() => void confirm.mutateAsync()}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-60"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Confirm Weight & Approve Points
          </button>
          <button
            type="button"
            onClick={() => setDisputeOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-xl bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition"
          >
            <XCircle className="h-3.5 w-3.5" /> Dispute Weight
          </button>
        </div>
      )}

      {disputeOpen && !msg && (
        <div className="mt-2 grid gap-2">
          <textarea
            className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-rose-500"
            rows={2}
            placeholder="Briefly describe what's incorrect (e.g. scale read 12kg, logged as 6kg)..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <button
            type="button"
            disabled={dispute.isPending || reason.trim().length < 5}
            onClick={() => void dispute.mutateAsync()}
            className="self-start rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
          >
            {dispute.isPending ? 'Submitting...' : 'Submit Grievance Dispute'}
          </button>
        </div>
      )}

      {msg && <p className="text-xs font-bold text-emerald-700">{msg}</p>}
      {err && <p className="text-xs font-bold text-rose-700">{err}</p>}
    </div>
  );
}

// ── Points & Tier Card ────────────────────────────────────────────────────────
function PointsTierCard({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['user-points', userId],
    queryFn: async () => {
      const resp = await api.get<UserTierInfo>(`/users/${userId}/points`);
      return resp.data;
    },
    retry: false
  });

  if (isLoading) return <div className="glass-card rounded-[2rem] p-6 animate-pulse h-48" />;
  if (!data) return null;

  return (
    <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <Award className="h-4 w-4" /> EcoSync Points Ledger
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-0.5">
            Reward Balance & Civic Tier
          </h2>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
          <Coins className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4 text-center">
          <span className="text-3xl font-black text-emerald-700 leading-none">
            {data.points_balance}
          </span>
          <p className="text-xs font-bold text-slate-600 mt-1">Available Points</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
          <span className="text-3xl font-black text-slate-800 leading-none">
            {data.points_lifetime}
          </span>
          <p className="text-xs font-bold text-slate-500 mt-1">Lifetime Earned</p>
        </div>
        <div className={`rounded-2xl border p-4 text-center capitalize ${tierColour(data.current_tier)}`}>
          <span className="text-2xl font-black leading-none block">{data.current_tier}</span>
          <p className="text-xs font-bold mt-1">Citizen Tier</p>
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-center">
          <span className="text-2xl font-black text-slate-700 leading-none">
            {data.flags_count}
          </span>
          <p className="text-xs font-bold text-slate-500 mt-1">Disputes Logged</p>
        </div>
      </div>

      {data.recent_transactions.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Recent Points Activity
          </p>
          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
            {data.recent_transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs border border-slate-200/60"
              >
                <span className="text-slate-700 truncate flex-1 mr-2 font-medium">{tx.reason}</span>
                <span
                  className={`font-black shrink-0 ${
                    tx.status === 'flagged'
                      ? 'text-rose-600'
                      : tx.status === 'pending'
                      ? 'text-amber-600'
                      : 'text-emerald-700'
                  }`}
                >
                  +{tx.points} pts {tx.status !== 'approved' ? `(${tx.status})` : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

// ── Compliance Score Card ────────────────────────────────────────────────────
function ComplianceCard({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ['compliance', userId],
    queryFn: async () => {
      const resp = await api.get<ComplianceScore>(`/users/${userId}/compliance`);
      return resp.data;
    },
    retry: false
  });

  if (isLoading) return <div className="glass-card rounded-[2rem] p-6 animate-pulse h-48" />;
  if (!data) return null;

  const score = data.rolling_score;
  const colour = score >= 80 ? 'text-emerald-700' : score >= 50 ? 'text-amber-700' : 'text-rose-700';
  const bg = score >= 80 ? 'bg-emerald-50 border-emerald-200' : score >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" /> Swachhata Segregation Index
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-0.5">
            Compliance Score
          </h2>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
          <ShieldCheck className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-6">
        <div className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border ${bg}`}>
          <span className={`text-3xl font-black leading-none ${colour}`}>{score.toFixed(0)}%</span>
          <span className="text-[10px] font-bold text-slate-500 uppercase mt-1">Rating</span>
        </div>
        <div className="space-y-1.5 text-xs">
          <p className="text-slate-800 font-semibold">
            <strong>{data.verified_pickups}</strong> verified clean segregations out of{' '}
            <strong>{data.total_pickups}</strong> household pickups.
          </p>
          <p className="text-slate-500 text-[11px]">
            Bhopal Municipal Ward 48 Benchmark: <strong>78%</strong> · Rolling 90-day window
          </p>
          {score < 50 ? (
            <p className="flex items-center gap-1 text-[11px] text-rose-600 font-bold mt-1">
              <AlertTriangle className="h-3.5 w-3.5" /> High contamination rate. Please keep wet and dry bins separate.
            </p>
          ) : (
            <p className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Excellent! Eligible for municipal property tax rebates.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

// ── Redeem Rewards Card ───────────────────────────────────────────────────────
function RedeemCard({ userId }: { userId: number }) {
  const queryClient = useQueryClient();
  const [redeemMsg, setRedeemMsg] = useState<Record<number, string>>({});

  const catalogQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const resp = await api.get<CatalogItem[]>('/redemptions/catalog');
      return resp.data;
    }
  });

  const redeem = useMutation({
    mutationFn: (catalogItemId: number) =>
      api.post<Redemption>('/redemptions', { catalog_item_id: catalogItemId }),
    onSuccess: (_, catalogItemId) => {
      setRedeemMsg((prev) => ({ ...prev, [catalogItemId]: '✅ Redeemed! Status: approved.' }));
      void queryClient.invalidateQueries({ queryKey: ['user-points', userId] });
    },
    onError: (err, catalogItemId) => {
      const msg =
        err instanceof Error
          ? err.message.includes('Insufficient')
            ? '❌ Insufficient points.'
            : '❌ Redemption failed.'
          : '❌ Redemption failed.';
      setRedeemMsg((prev) => ({ ...prev, [catalogItemId]: msg }));
    }
  });

  if (catalogQuery.isLoading) return <div className="glass-card rounded-[2rem] p-6 animate-pulse h-48" />;
  const items = catalogQuery.data ?? [];
  if (items.length === 0) return null;

  return (
    <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
            <ShoppingBag className="h-4 w-4" /> Civic Reward Catalog
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-0.5">
            Redeem EcoSync Points
          </h2>
          <p className="text-xs text-slate-500">
            Convert clean segregation habits into real utility vouchers and municipal benefits.
          </p>
        </div>
        <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
          <Gift className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-emerald-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {item.category.replace('_', ' ')}
                </span>
                <span className="text-base font-black text-emerald-700">
                  {item.points_cost} pts
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">{item.item_name}</h4>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              {redeemMsg[item.id] ? (
                <p className="text-xs font-bold text-emerald-700">{redeemMsg[item.id]}</p>
              ) : (
                <button
                  type="button"
                  disabled={redeem.isPending}
                  onClick={() => void redeem.mutateAsync(item.id)}
                  className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-60"
                >
                  Redeem Reward
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

// ── Main User Dashboard ───────────────────────────────────────────────────────
export function UserDashboard() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab state (synced with URL ?tab=...)
  const activeTab = searchParams.get('tab') || 'console';
  const handleTabChange = (newTab: string) => {
    setSearchParams({ tab: newTab });
  };

  // Schedule Pickup state
  const [schedule, setSchedule] = useState(() => getInitialSchedule(user?.latitude, user?.longitude));

  useEffect(() => {
    if (user?.latitude && user?.longitude && !schedule.latitude && !schedule.longitude) {
      setSchedule((prev) => ({
        ...prev,
        latitude: String(user.latitude),
        longitude: String(user.longitude)
      }));
    }
  }, [user?.latitude, user?.longitude]);

  const [liveLocation, setLiveLocation] = useState<DriverLocation | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackedPickupId, setTrackedPickupId] = useState<number | null>(null);
  const trackingPanelRef = useRef<HTMLElement | null>(null);

  // Queries
  const pickupsQuery = useQuery({
    queryKey: ['pickups', user?.id],
    queryFn: async () => {
      const response = await api.get<Pickup[]>('/pickups', { params: { user_id: user?.id } });
      return response.data;
    },
    enabled: Boolean(user)
  });

  const rewardsQuery = useQuery({
    queryKey: ['rewards', user?.id],
    queryFn: async () => {
      const response = await api.get<Reward[]>('/rewards', { params: { user_id: user?.id } });
      return response.data;
    },
    enabled: Boolean(user)
  });

  const complaintsQuery = useQuery({
    queryKey: ['complaints', user?.id],
    queryFn: async () => {
      const response = await api.get<Complaint[]>('/complaints', { params: { user_id: user?.id } });
      return response.data;
    },
    enabled: Boolean(user)
  });

  const defaultTrackedPickup = useMemo(
    () =>
      pickupsQuery.data?.find((p) => activePickupStatuses.includes(p.status)) ??
      pickupsQuery.data?.[0] ??
      null,
    [pickupsQuery.data]
  );

  const trackedPickup = useMemo(
    () => pickupsQuery.data?.find((p) => p.id === trackedPickupId) ?? defaultTrackedPickup,
    [pickupsQuery.data, trackedPickupId, defaultTrackedPickup]
  );

  useEffect(() => {
    if (!trackedPickupId && defaultTrackedPickup) {
      setTrackedPickupId(defaultTrackedPickup.id);
    }
  }, [defaultTrackedPickup, trackedPickupId]);

  const trackingQuery = useQuery({
    queryKey: ['tracking', trackedPickup?.id],
    queryFn: async () => {
      const response = await api.get<DriverLocation[]>(`/tracking/pickups/${trackedPickup?.id}/locations`);
      return response.data;
    },
    enabled: Boolean(trackedPickup),
    refetchInterval: 5000
  });

  const activeTrackedId = trackedPickup?.id;

  // Live WebSocket tracking
  useEffect(() => {
    setLiveLocation(null);
    if (!activeTrackedId) return undefined;
    let socket: WebSocket;
    let alive = true;

    function connect() {
      if (!alive) return;
      socket = new WebSocket(buildTrackingSocketUrl(activeTrackedId!));
      socket.onopen = () => {
        try {
          socket.send('subscribe');
        } catch {
          /* ignore */
        }
      };
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { type?: string; payload?: DriverLocation };
          if (data.type === 'driver-location' && data.payload) {
            setLiveLocation(data.payload);
          }
        } catch {
          /* ignore */
        }
      };
      socket.onclose = () => {
        if (alive) setTimeout(connect, 3000);
      };
      socket.onerror = () => socket.close();
    }

    connect();
    return () => {
      alive = false;
      socket?.close();
    };
  }, [activeTrackedId]);

  // Mutation: Schedule Pickup
  const createPickup = useMutation({
    mutationFn: async () => {
      if (!user) return;
      setError(null);
      setMessage(null);
      const res = await api.post<Pickup>('/pickups', {
        user_id: user.id,
        waste_type: schedule.waste_type,
        scheduled_date: schedule.scheduled_date || new Date().toISOString().slice(0, 10),
        scheduled_time: schedule.scheduled_time || '09:00',
        coordinates:
          schedule.latitude && schedule.longitude
            ? {
                latitude: Number(schedule.latitude),
                longitude: Number(schedule.longitude)
              }
            : user.latitude && user.longitude
            ? {
                latitude: Number(user.latitude),
                longitude: Number(user.longitude)
              }
            : null,
        notes: schedule.notes || null
      });
      return res.data;
    },
    onSuccess: async (data) => {
      setMessage('✅ Pickup scheduled successfully! A driver will be assigned to your zone.');
      if (data?.id) {
        setTrackedPickupId(data.id);
      }
      setSchedule(getInitialSchedule(user?.latitude, user?.longitude));
      await queryClient.invalidateQueries({ queryKey: ['pickups', user?.id] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to schedule pickup.');
    }
  });

  if (!user) {
    return (
      <EmptyState
        title="Login required"
        description="Sign in to schedule pickups, track collection vehicles, and view your points."
      />
    );
  }

  const rewards = rewardsQuery.data ?? [];
  const complaints = complaintsQuery.data ?? [];
  const pickups = pickupsQuery.data ?? [];
  const latestDriverLocation = liveLocation ?? trackingQuery.data?.at(-1) ?? null;
  const rewardPoints = rewards.reduce((total, reward) => total + reward.points, 0);
  const pickupLocation = trackedPickup?.coordinates ?? null;
  const currentBadge = trackedPickup ? getStatusBadge(trackedPickup.status) : null;

  return (
    <section className="space-y-6">
      {/* ── Welcome Banner & Sub-Tabs ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
              Welcome back, {user.name} 👋
            </h1>
            <button
              type="button"
              onClick={() => handleTabChange('profile')}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition shadow-sm"
              title="Click to view Civic Profile & Household ID"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{user.ward_number ? `Ward ${user.ward_number} Node` : 'Bhopal Resident'}</span>
              <span className="text-[10px] text-emerald-600 underline ml-0.5">Edit Gate</span>
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Doorstep municipal waste management, live GPS tracking, and CPCB circular economy rewards.
          </p>
        </div>

        {/* Action Pills */}
        <div className="flex items-center gap-2">
          <Link
            to="/price-board"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition"
          >
            <Coins className="h-4 w-4 text-emerald-600" />
            <span>Check Scrap Rates</span>
          </Link>
          <a
            href="tel:155304"
            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition"
          >
            <Phone className="h-4 w-4 text-emerald-600" />
            <span>Helpline: 155304</span>
          </a>
        </div>
      </div>

      {/* ── Metric Stat Cards ─────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          onClick={() => handleTabChange('history')}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            label="Upcoming Pickups"
            value={String(pickups.filter((p) => p.status !== 'completed' && p.status !== 'cancelled').length)}
            icon={Truck}
            tone="green"
          />
        </div>

        <div
          onClick={() => handleTabChange('rewards')}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            label="Reward Points"
            value={`${rewardPoints} pts`}
            icon={Gift}
            tone="amber"
          />
        </div>

        <div
          onClick={() => {
            handleTabChange('console');
            trackingPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            label="Vehicle Telemetry"
            value={latestDriverLocation ? 'Driver Active' : (trackedPickup?.status === 'assigned' ? 'En Route' : 'Scheduled')}
            icon={MapPinned}
            tone="blue"
          />
        </div>

        <div
          onClick={() => handleTabChange('community')}
          className="cursor-pointer transition hover:scale-[1.01]"
        >
          <StatCard
            label="Civic Grievances"
            value={String(complaints.filter((item) => item.status === 'open').length)}
            icon={MessageSquareWarning}
            tone="rose"
          />
        </div>
      </div>

      {/* ── Sub-Navigation Segment Tabs ───────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => handleTabChange('console')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === 'console'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Compass className="h-4 w-4" />
          <span>Operations Console</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('history')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Truck className="h-4 w-4" />
          <span>My Pickups ({pickups.length})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('marketplace')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === 'marketplace'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Coins className="h-4 w-4" />
          <span>Sell Scrap & Recyclables</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('rewards')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === 'rewards'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award className="h-4 w-4" />
          <span>Rewards & Compliance</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('community')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === 'community'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Community & Grievances</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('profile')}
          className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2.5 text-xs font-black transition ${
            activeTab === 'profile'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="h-4 w-4" />
          <span>Civic Profile & ID</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TAB 1: OPERATIONS CONSOLE (Schedule Pickup & Live Tracking)    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'console' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            {/* Left Column: Smart Schedule Pickup Form */}
            <article className="lg:col-span-7 glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-5 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" /> Municipal Doorstep Dispatch
                  </span>
                  <h2 className="text-2xl font-black text-slate-950 mt-0.5">
                    Schedule Doorstep Pickup
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select your waste category, pickup time, and confirm your precise gate location.
                  </p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Recycle className="h-5 w-5" />
                </div>
              </div>

              <form
                className="mt-6 space-y-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void createPickup.mutateAsync();
                }}
              >
                {/* Registered Doorstep Gate Banner */}
                <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        Registered Doorstep Gate · Ward {user.ward_number || '25'}
                      </p>
                      <p className="text-xs font-bold text-slate-800 leading-snug">
                        {user.house_flat_number
                          ? `${user.house_flat_number}, ${user.street_colony}, ${user.locality}`
                          : user.address || 'Bhopal Municipal Network'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('profile')}
                    className="shrink-0 text-xs font-bold text-emerald-700 underline hover:text-emerald-900"
                  >
                    Edit Gate
                  </button>
                </div>

                {/* 1. Visual Waste Category Tiles */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2.5">
                    1. Select Waste Category *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {WASTE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = schedule.waste_type === cat.type;
                      return (
                        <button
                          key={cat.type}
                          type="button"
                          onClick={() =>
                            setSchedule((prev) => ({ ...prev, waste_type: cat.type }))
                          }
                          className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left transition-all ${
                            isSelected
                              ? `${cat.activeBorder} ${cat.activeBg} shadow-sm`
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cat.color}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-slate-900">{cat.title}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 block">
                              {cat.badge}
                            </span>
                            <p className="text-[11px] text-slate-600 leading-snug mt-1">
                              {cat.description}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Date and Time Window */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      2. Collection Date *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={schedule.scheduled_date}
                        min={new Date().toISOString().slice(0, 10)}
                        onChange={(e) =>
                          setSchedule((prev) => ({ ...prev, scheduled_date: e.target.value }))
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                      3. Preferred Time Window *
                    </label>
                    <select
                      value={schedule.scheduled_time}
                      onChange={(e) =>
                        setSchedule((prev) => ({ ...prev, scheduled_time: e.target.value }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="09:00">09:00 AM - 11:00 AM (Morning)</option>
                      <option value="11:30">11:30 AM - 01:30 PM (Mid-Day)</option>
                      <option value="14:00">02:00 PM - 04:00 PM (Afternoon)</option>
                      <option value="16:30">04:30 PM - 06:30 PM (Evening)</option>
                    </select>
                  </div>
                </div>

                {/* 3. Doorstep Location Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    4. Confirm Doorstep Gate Pin *
                  </label>
                  <LocationPickerMap
                    latitude={schedule.latitude}
                    longitude={schedule.longitude}
                    onLocationChange={(lat, lng) => {
                      setSchedule((current) => ({
                        ...current,
                        latitude: lat,
                        longitude: lng
                      }));
                    }}
                  />
                </div>

                {/* 4. Instructions & Helper Chips */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      5. Instructions / Landmark (Optional)
                    </label>
                    <span className="text-[11px] text-slate-400">Click chips to append</span>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {QUICK_INSTRUCTION_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setSchedule((prev) => ({
                            ...prev,
                            notes: prev.notes ? `${prev.notes}, ${chip}` : chip
                          }));
                        }}
                        className="rounded-xl bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={2}
                    placeholder="e.g. Blue gate, ground floor porch, call when 5 mins away..."
                    value={schedule.notes}
                    onChange={(e) =>
                      setSchedule((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Feedback Banners */}
                {message && (
                  <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>{message}</span>
                  </div>
                )}
                {error && (
                  <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={createPickup.isPending}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-sm text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <Truck className="h-5 w-5" />
                  <span>
                    {createPickup.isPending
                      ? 'Dispatching Request to Ward...'
                      : 'Schedule Doorstep Collection'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </article>

            {/* Right Column: Live Route Tracking & Driver Telemetry */}
            <article
              ref={trackingPanelRef}
              className="lg:col-span-5 glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-5"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                    <Navigation className="h-4 w-4" /> Live OpenStreetMap Feed
                  </span>
                  <h2 className="text-2xl font-black text-slate-950 mt-0.5">
                    Live Route Tracking
                  </h2>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <MapPin className="h-5 w-5" />
                </div>
              </div>

              {/* Pickup Selector Dropdown */}
              {pickups.length > 0 ? (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Select Active Pickup to Track:
                  </label>
                  <select
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                    value={trackedPickupId ?? ''}
                    onChange={(e) => setTrackedPickupId(Number(e.target.value))}
                  >
                    {pickups.map((p) => {
                      const icon =
                        p.waste_type === 'wet'
                          ? '🌿'
                          : p.waste_type === 'dry'
                          ? '📦'
                          : p.waste_type === 'bulky'
                          ? '🛋️'
                          : '⚡';
                      const label = p.waste_type.charAt(0).toUpperCase() + p.waste_type.slice(1);
                      return (
                        <option key={p.id} value={p.id}>
                          {icon} {label} Waste ({p.scheduled_date}) · {p.status.toUpperCase()} · [{formatPickupCode(p.id)}]
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : null}

              {/* Current Tracked Status Strip */}
              {trackedPickup && currentBadge && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Pickup [{formatPickupCode(trackedPickup.id)}] · {trackedPickup.waste_type.toUpperCase()} WASTE
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${currentBadge.color}`}
                    >
                      <span className={`h-2 w-2 rounded-full ${currentBadge.dot}`} />
                      {currentBadge.label}
                    </span>
                  </div>

                  {/* 4-Step Visual Progress Stepper */}
                  <div className="grid grid-cols-4 gap-1 text-center pt-2 border-t border-slate-200/60">
                    <div className="flex flex-col items-center">
                      <div className="h-6 w-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                        ✓
                      </div>
                      <span className="text-[10px] font-bold text-emerald-800 mt-1">Booked</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          trackedPickup.status !== 'pending'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {trackedPickup.status !== 'pending' ? '✓' : '2'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Assigned</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          trackedPickup.status === 'in_progress' || trackedPickup.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        {trackedPickup.status === 'completed' ? '✓' : '3'}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">En Route</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          trackedPickup.status === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        4
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-1">Collected</span>
                    </div>
                  </div>

                  {/* Driver / ETA message */}
                  <p className="text-[11px] text-slate-500 pt-1">
                    {trackedPickup.driver_id
                      ? `Municipal Driver ID #${trackedPickup.driver_id} assigned · Live GPS active.`
                      : 'Municipal collection vehicle will be assigned before your time slot.'}
                  </p>
                </div>
              )}

              {/* Leaflet Map Widget */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <TrackingMap
                  pickupLocation={pickupLocation}
                  driverLocation={
                    latestDriverLocation
                      ? {
                          latitude: latestDriverLocation.latitude,
                          longitude: latestDriverLocation.longitude
                        }
                      : null
                  }
                  focusMode="both"
                />
              </div>

              {!pickupLocation && (
                <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                  ⚠️ No GPS coordinates saved for this request. Pin your doorstep when scheduling to enable live routing.
                </p>
              )}
            </article>
          </div>

          {/* Active & Recent Pickups Strip */}
          <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900">Active & Scheduled Pickups</h3>
                <p className="text-xs text-slate-500">Overview of recent collection requests</p>
              </div>
              <button
                type="button"
                onClick={() => handleTabChange('history')}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>View Full History</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {pickups.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {pickups.slice(0, 3).map((p) => {
                  const badge = getStatusBadge(p.status);
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {formatPickupCode(p.id)}
                          </span>
                          <span className="text-sm font-bold text-slate-900 capitalize">
                            {p.waste_type} Waste Pickup
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Scheduled for {p.scheduled_date} at {p.scheduled_time}
                        </p>
                        {p.notes && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            &quot;{p.notes}&quot;
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setTrackedPickupId(p.id);
                            trackingPanelRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
                            trackedPickupId === p.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <MapPinned className="h-3.5 w-3.5" />
                          <span>{trackedPickupId === p.id ? 'Tracking Live' : 'Track'}</span>
                        </button>
                      </div>

                      {p.status === 'completed' && (
                        <PickupConfirmDispute
                          pickup={p}
                          onDone={() =>
                            void queryClient.invalidateQueries({ queryKey: ['pickups', user.id] })
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No active pickups scheduled. Use the form above to book your first doorstep collection.
              </div>
            )}
          </article>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MY PICKUPS & DISPUTES                                   */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'history' && (
        <article className="glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Truck className="h-4 w-4" /> Full Collection History
              </span>
              <h2 className="text-2xl font-black text-slate-950 mt-0.5">
                My Scheduled & Completed Pickups
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleTabChange('console')}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
            >
              + Book New Pickup
            </button>
          </div>

          {pickups.length > 0 ? (
            <div className="grid gap-4">
              {pickups.map((p) => {
                const badge = getStatusBadge(p.status);
                return (
                  <div
                    key={p.id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                            {formatPickupCode(p.id)}
                          </span>
                          <span className="text-base font-black text-slate-900 capitalize">
                            {p.waste_type} Waste Pickup
                          </span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Date: <strong>{p.scheduled_date}</strong> at{' '}
                          <strong>{p.scheduled_time}</strong> · Driver: {p.driver_id ?? 'Auto-dispatching'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setTrackedPickupId(p.id);
                          handleTabChange('console');
                        }}
                        className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                      >
                        <MapPinned className="h-4 w-4 text-emerald-600" />
                        <span>Track Route</span>
                      </button>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 italic">
                        &quot;{p.notes}&quot;
                      </p>
                    )}

                    {p.status === 'completed' && (
                      <PickupConfirmDispute
                        pickup={p}
                        onDone={() =>
                          void queryClient.invalidateQueries({ queryKey: ['pickups', user.id] })
                        }
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="No pickups found"
              description="You have not scheduled any pickups yet. Schedule your first collection in the Operations Console."
            />
          )}
        </article>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TAB 3: SELL SCRAP & RECYCLER MARKETPLACE                       */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'marketplace' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-6 sm:p-8 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1.5">
                <Coins className="h-4 w-4" /> CPCB Circular Economy Market
              </span>
              <h2 className="text-2xl font-black mt-1">Sell Recyclables to Verified MRFs</h2>
              <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                Turn segregated paper, plastic, metal, and e-waste into doorstep cash payouts and verifiable CPCB EPR credits.
              </p>
            </div>
            <Link
              to="/price-board"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-emerald-900 shadow-sm hover:bg-emerald-50 transition"
            >
              <span>View All Scrap Rates</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <CitizenRecyclingMarketplace userId={user.id} />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TAB 4: REWARDS & COMPLIANCE                                    */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <PointsTierCard userId={user.id} />
            <ComplianceCard userId={user.id} />
          </div>
          <RedeemCard userId={user.id} />
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TAB 5: COMMUNITY & GRIEVANCES                                  */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'community' && (
        <div className="space-y-6">
          <CommunityHubPanel currentUser={user} />

          {/* In-App SMS Dispatch */}
          <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="h-10 w-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageSquareWarning className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">In-App SMS Grievance Desk</h2>
                <p className="text-xs text-slate-500">Direct Fast2SMS gateway to driver or municipal ward coordinator</p>
              </div>
            </div>

            <form
              className="mt-5 grid gap-3 sm:grid-cols-[1fr_2fr_auto]"
              onSubmit={async (e) => {
                e.preventDefault();
                const target = e.currentTarget;
                const phone = (target.elements.namedItem('phone') as HTMLInputElement).value;
                const msg = (target.elements.namedItem('message') as HTMLInputElement).value;
                try {
                  await api.post('/chat/send', { phone, message: msg, user_id: user.id });
                  alert('SMS Message Sent successfully!');
                  target.reset();
                } catch {
                  alert('Failed to send SMS message.');
                }
              }}
            >
              <input
                name="phone"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-600"
                placeholder="Phone Number (10 digits)"
                required
              />
              <input
                name="message"
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold outline-none focus:border-emerald-600"
                placeholder="Type your message / grievance..."
                required
              />
              <button
                type="submit"
                className="rounded-2xl bg-slate-950 px-6 py-3 font-bold text-xs text-white shadow-sm hover:bg-slate-800 transition"
              >
                Send SMS
              </button>
            </form>
          </article>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* TAB 6: CIVIC PROFILE & MUNICIPAL ID                           */}
      {/* ─────────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <CitizenProfilePanel currentUser={user} />
      )}
    </section>
  );
}
