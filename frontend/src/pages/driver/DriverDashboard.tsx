import { useEffect, useRef, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  CheckCircle2,
  Clock,
  LocateFixed,
  MapPinned,
  Navigation,
  PackageCheck,
  RefreshCw,
  SkipForward,
  Truck,
  Weight,
  WifiOff,
} from 'lucide-react';
import { EmptyState } from '../../components/EmptyState';
import { StatCard } from '../../components/StatCard';
import { TrackingMap } from '../../components/TrackingMap';
import { api } from '../../lib/api';
import type { DriverLocation, Pickup, PickupStatus, Route, WasteCategory } from '../../lib/types';
import {
  dismissConflict,
  getOfflineConflicts,
  savePendingPickupLog,
  savePendingStopUpdate,
  type OfflineConflict,
} from '../../lib/offlineStore';
import {
  generateIdempotencyKey,
  subscribeToConflicts,
  subscribeToSyncStatus,
  syncPendingMutations,
} from '../../lib/syncEngine';
import { useSessionStore } from '../../store/session';

//  Log Pickup Details sub-form ─

interface LogFormProps {
  pickup: Pickup;
  onSuccess: () => void;
}

function LogPickupForm({ pickup, onSuccess }: LogFormProps) {
  const [weightKg, setWeightKg] = useState('');
  const [wasteCategory, setWasteCategory] = useState<WasteCategory>('dry');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(pickup.photo_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [logMsg, setLogMsg] = useState<string | null>(null);
  const [logErr, setLogErr] = useState<string | null>(null);

  const alreadyLogged = pickup.weight_kg !== null;

  const uploadPhoto = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const resp = await api.post<{ public_url: string; stored_path: string }>(
      '/uploads/pickup-photos',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return resp.data.stored_path;
  };

  const logMutation = useMutation({
    mutationFn: async () => {
      const weight = parseFloat(weightKg);
      if (Number.isNaN(weight) || weight <= 0 || weight >= 500) {
        throw new Error('Weight must be between 0.1 and 499.9 kg.');
      }
      let resolvedPhotoUrl = photoUrl;
      if (photoFile) {
        setUploading(true);
        try {
          resolvedPhotoUrl = await uploadPhoto(photoFile);
        } catch {
          // If offline photo upload fails, proceed with null photo URL so weight logging isn't blocked
          resolvedPhotoUrl = null;
        } finally {
          setUploading(false);
        }
      }

      const idempotencyKey = generateIdempotencyKey();

      // Offline detection: save to IndexedDB mutation queue
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await savePendingPickupLog({
          idempotencyKey,
          pickupId: pickup.id,
          payload: {
            weight_kg: weight,
            waste_category: wasteCategory,
            photo_url: resolvedPhotoUrl || undefined,
          },
          createdAt: new Date().toISOString(),
          status: 'pending',
        });
        return {
          id: pickup.id,
          weight_kg: weight,
          waste_category: wasteCategory,
          photo_url: resolvedPhotoUrl,
          segregation_verified: Boolean(resolvedPhotoUrl),
        } as Pickup;
      }

      const resp = await api.post<Pickup>(
        `/pickups/${pickup.id}/log`,
        {
          weight_kg: weight,
          waste_category: wasteCategory,
          photo_url: resolvedPhotoUrl,
        },
        {
          headers: {
            'Idempotency-Key': idempotencyKey,
          },
        }
      );
      return resp.data;
    },
    onSuccess: () => {
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      setLogMsg(
        isOffline
          ? 'Offline mode: Pickup logged locally in IndexedDB. Will sync when reconnected.'
          : 'Pickup details logged successfully!'
      );
      setLogErr(null);
      onSuccess();
    },
    onError: (err: unknown) => {
      setLogErr(err instanceof Error ? err.message : 'Failed to log pickup details.');
      setLogMsg(null);
    },
  });

  if (alreadyLogged) {
    return (
      <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 shrink-0" />
        <span>
          Logged: <strong>{pickup.weight_kg} kg</strong> · <strong>{pickup.waste_category}</strong>
          {pickup.segregation_verified ? ' · ✅ Segregation verified' : ' · ⏳ Awaiting citizen confirmation'}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 grid gap-3">
      <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
        <Weight className="h-4 w-4" /> Log Collection Details
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor={`weight-${pickup.id}`}>
            Weight (kg)
          </label>
          <input
            id={`weight-${pickup.id}`}
            type="number"
            min="0.1"
            max="499.9"
            step="0.1"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="e.g. 12.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor={`cat-${pickup.id}`}>
            Waste Category
          </label>
          <select
            id={`cat-${pickup.id}`}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
            value={wasteCategory}
            onChange={(e) => setWasteCategory(e.target.value as WasteCategory)}
          >
            <option value="wet">Wet</option>
            <option value="dry">Dry</option>
            <option value="hazardous">Hazardous</option>
            <option value="e_waste">E-Waste</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor={`photo-${pickup.id}`}>
          <Camera className="mr-1 inline h-3 w-3" />Photo proof (optional — enables segregation-verified bonus)
        </label>
        <input
          id={`photo-${pickup.id}`}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="w-full text-xs text-slate-700"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setPhotoFile(f);
            if (f) setPhotoUrl(null); // will be uploaded on submit
          }}
        />
      </div>
      <button
        type="button"
        disabled={logMutation.isPending || uploading}
        className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
        onClick={() => void logMutation.mutateAsync()}
      >
        {logMutation.isPending || uploading ? 'Saving...' : 'Submit log'}
      </button>
      {logMsg && <p className="text-xs text-emerald-700">{logMsg}</p>}
      {logErr && <p className="text-xs text-rose-700">{logErr}</p>}
    </div>
  );
}

//  Today's Route stops panel ─

function TodaysRoute({ driverUserId }: { driverUserId: number }) {
  const queryClient = useQueryClient();

  const routesQuery = useQuery({
    queryKey: ['driver-routes', driverUserId],
    queryFn: async () => (await api.get<Route[]>(`/routes?driver_id=${driverUserId}`)).data,
    refetchInterval: 30_000,
  });

  const stopStatusMutation = useMutation({
    mutationFn: async ({ routeId, stopId, status }: { routeId: number; stopId: number; status: string }) => {
      const idempotencyKey = generateIdempotencyKey();
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        await savePendingStopUpdate({
          idempotencyKey,
          routeId,
          stopId,
          payload: { status },
          createdAt: new Date().toISOString(),
          status: 'pending',
        });
        return null;
      }
      return (
        await api.patch<Route>(
          `/routes/${routeId}/stops/${stopId}/status`,
          { status },
          {
            headers: { 'Idempotency-Key': idempotencyKey },
          }
        )
      ).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-routes', driverUserId] }),
  });

  const today = new Date().toISOString().slice(0, 10);
  const todayRoute = routesQuery.data?.find((r) => r.route_date === today) ?? null;

  if (routesQuery.isLoading) {
    return (
      <div className="glass-card rounded-[2rem] p-6">
        <div className="h-6 w-48 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  if (!todayRoute) {
    return (
      <article className="glass-card rounded-[2rem] p-6">
        <h2 className="text-2xl font-black text-slate-950">Today's Route</h2>
        <p className="mt-2 text-slate-500">No route assigned for today. Contact your supervisor.</p>
      </article>
    );
  }

  const stops = [...todayRoute.stops].sort((a, b) => a.sequence_order - b.sequence_order);
  const done = stops.filter((s) => s.status === 'arrived').length;
  const total = stops.length;

  return (
    <article className="glass-card rounded-[2rem] p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-950">Today's Route</h2>
          <p className="mt-1 text-sm text-slate-500">
            {done}/{total} stops completed · Route #{todayRoute.id}
          </p>
        </div>
        {/* Progress bar */}
        <div className="flex h-10 w-32 items-center">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-2">
        {stops.map((stop) => {
          const isPending = stop.status === 'pending';
          return (
            <div
              key={stop.id}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${stop.status === 'arrived'
                  ? 'border-emerald-200 bg-emerald-50'
                  : stop.status === 'skipped'
                    ? 'border-rose-100 bg-rose-50 opacity-70'
                    : 'border-slate-100 bg-white/60'
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">
                  {stop.sequence_order}
                </span>
                <div>
                  <p className="font-bold text-slate-900">Pickup #{stop.pickup_id}</p>
                  {stop.estimated_arrival && (
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <Clock className="h-3 w-3" />
                      ETA {new Date(stop.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                  {stop.actual_arrival && (
                    <p className="text-xs text-emerald-600 font-semibold">
                      Arrived {new Date(stop.actual_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isPending ? (
                  <>
                    <button
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                      type="button"
                      onClick={() => void stopStatusMutation.mutateAsync({ routeId: todayRoute.id, stopId: stop.id, status: 'arrived' })}
                    >
                      <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />Arrived
                    </button>
                    <button
                      className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      type="button"
                      onClick={() => void stopStatusMutation.mutateAsync({ routeId: todayRoute.id, stopId: stop.id, status: 'skipped' })}
                    >
                      <SkipForward className="mr-1 inline h-3.5 w-3.5" />Skip
                    </button>
                  </>
                ) : (
                  <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${stop.status === 'arrived' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'
                    }`}>
                    {stop.status.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}


//  Main driver dashboard 

export function DriverDashboard() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);
  const [selectedPickupId, setSelectedPickupId] = useState<number | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [status, setStatus] = useState<PickupStatus>('in_progress');
  const [note, setNote] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trackingActive, setTrackingActive] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);

  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latRef = useRef('');
  const lngRef = useRef('');
  const lastPostTimeRef = useRef<number>(0);

  const pickupsQuery = useQuery({
    queryKey: ['driver-pickups', user?.driver_id],
    queryFn: async () => {
      const response = await api.get<Pickup[]>('/pickups', { params: { driver_id: user?.driver_id } });
      return response.data;
    },
    enabled: Boolean(user?.driver_id)
  });

  // Track online/offline status and subscribe to sync engine & conflicts
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncPendingMutations().then(() => {
        void queryClient.invalidateQueries({ queryKey: ['driver-pickups'] });
        void queryClient.invalidateQueries({ queryKey: ['driver-routes'] });
      });
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubSync = subscribeToSyncStatus((count, syncing) => {
      setQueueCount(count);
      setIsSyncing(syncing);
    });

    const unsubConflict = subscribeToConflicts((newConflict) => {
      setConflicts((prev) => [newConflict, ...prev]);
    });

    void getOfflineConflicts().then(setConflicts);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubSync();
      unsubConflict();
    };
  }, [queryClient]);

  const selectedPickup = useMemo(
    () => pickupsQuery.data?.find((pickup) => pickup.id === selectedPickupId) ?? pickupsQuery.data?.[0] ?? null,
    [pickupsQuery.data, selectedPickupId]
  );

  useEffect(() => {
    if (!selectedPickupId && pickupsQuery.data?.length) {
      setSelectedPickupId(pickupsQuery.data[0].id);
      setStatus(pickupsQuery.data[0].status);
    }
  }, [pickupsQuery.data, selectedPickupId]);

  // Keep refs in sync with state so the interval always reads current coords
  useEffect(() => { latRef.current = latitude; }, [latitude]);
  useEffect(() => { lngRef.current = longitude; }, [longitude]);

  // Start/stop continuous GPS tracking
  useEffect(() => {
    // Always clear existing watches/intervals first
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!trackingActive || !selectedPickup || !user?.driver_id) return;

    const pushLocation = async (lat: string, lng: string) => {
      // Paused while offline: never queue or broadcast stale GPS points
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const now = Date.now();
      if (now - lastPostTimeRef.current < 5000) return; // throttle: at most once per 5 s
      lastPostTimeRef.current = now;
      try {
        await api.post(`/tracking/pickups/${selectedPickup.id}/locations`, {
          driver_id: user.driver_id,
          latitude: Number(lat),
          longitude: Number(lng),
          status,
          note: note || null
        });
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['driver-tracking', selectedPickup.id] }),
          queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] })
        ]);
      } catch {
        // silently ignore intermittent push failures
      }
    };

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(6);
          const lng = pos.coords.longitude.toFixed(6);
          setLatitude(lat);
          setLongitude(lng);
          latRef.current = lat;
          lngRef.current = lng;
          setError(null);
          void pushLocation(lat, lng); // push immediately on every GPS fix
        },
        (geoError) => setMessage(`GPS: ${geoError.message}. Using last known coordinates.`),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
      );
    } else {
      setMessage('GPS unavailable. Auto-tracking will use the coordinates entered above.');
    }

    // Keepalive: re-push every 15 s in case GPS position hasn't changed
    intervalRef.current = setInterval(() => {
      if (latRef.current && lngRef.current) void pushLocation(latRef.current, lngRef.current);
    }, 15000);
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackingActive, selectedPickup?.id, user?.driver_id, status, note]);

  const trackingQuery = useQuery({
    queryKey: ['driver-tracking', selectedPickup?.id],
    queryFn: async () => {
      const response = await api.get<DriverLocation[]>(`/tracking/pickups/${selectedPickup?.id}/locations`);
      return response.data;
    },
    enabled: Boolean(selectedPickup)
  });

  const updateStatus = useMutation({
    mutationFn: async (nextStatus: PickupStatus) => {
      if (!selectedPickup) {
        return;
      }
      await api.patch(`/pickups/${selectedPickup.id}/status`, { status: nextStatus, notes: note || null });
    },
    onSuccess: async () => {
      setMessage('Pickup status updated.');
      await queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] });
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to update pickup status.');
    }
  });

  const sendLocation = useMutation({
    mutationFn: async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Device is offline. Real-time GPS broadcasting is paused.');
      }
      if (!selectedPickup || !user?.driver_id) {
        return;
      }
      await api.post(`/tracking/pickups/${selectedPickup.id}/locations`, {
        driver_id: user.driver_id,
        latitude: Number(latitude),
        longitude: Number(longitude),
        status,
        note: note || null
      });
    },
    onSuccess: async () => {
      setMessage('Live location pushed to subscribers.');
      setError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['driver-tracking', selectedPickup?.id] }),
        queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] })
      ]);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to publish the live location.');
    }
  });

  if (!user) {
    return <EmptyState title="Login required" description="Sign in as a driver to stream live route updates." />;
  }

  if (!user.driver_id) {
    return <EmptyState title="Driver profile missing" description="Register a driver account with a vehicle number to access live tracking tools." />;
  }

  const pickups = pickupsQuery.data ?? [];
  const history = trackingQuery.data ?? [];
  const latestLocation = history.at(-1);
  const completed = pickups.filter((pickup) => pickup.status === 'completed').length;

  return (
    <section className="grid gap-6">
      {/* Offline Status & Sync Banners */}
      {!isOnline && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 border border-amber-500/20 px-5 py-4 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-amber-600 animate-pulse shrink-0" />
            <div>
              <p className="font-bold text-sm text-amber-950">Offline Mode Active</p>
              <p className="text-xs text-amber-800">
                Mutations are saved locally in IndexedDB. Real-time GPS pings are paused until connectivity is restored.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-amber-200/70 px-3 py-1 text-xs font-bold text-amber-900">
            {queueCount} queued
          </span>
        </div>
      )}

      {isOnline && queueCount > 0 && (
        <div className="flex items-center justify-between rounded-2xl bg-sky-50 border border-sky-200 px-5 py-3 text-sky-900 shadow-sm">
          <div className="flex items-center gap-3">
            <RefreshCw className={`h-4 w-4 text-sky-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <p className="text-xs font-semibold text-sky-950">
              {isSyncing ? `Replaying ${queueCount} offline mutation(s)...` : `${queueCount} pending mutation(s) queued for sync.`}
            </p>
          </div>
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => void syncPendingMutations().then(() => {
              void queryClient.invalidateQueries({ queryKey: ['driver-pickups'] });
              void queryClient.invalidateQueries({ queryKey: ['driver-routes'] });
            })}
            className="rounded-xl bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            Sync Now
          </button>
        </div>
      )}

      {/* Offline Conflict Notifications */}
      {conflicts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Sync Divergence Alerts ({conflicts.length})</span>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="flex items-start justify-between rounded-xl bg-white p-3 border border-rose-100 text-xs shadow-xs">
                <div>
                  <p className="font-semibold text-slate-900">{conflict.message}</p>
                  <p className="text-slate-500 mt-0.5">{new Date(conflict.timestamp).toLocaleTimeString()}</p>
                </div>
                {conflict.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      await dismissConflict(conflict.id!);
                      setConflicts((prev) => prev.filter((c) => c.id !== conflict.id));
                    }}
                    className="text-rose-600 hover:text-rose-800 font-semibold ml-3 shrink-0"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Assigned pickups" value={String(pickups.length)} icon={Truck} />
        <StatCard label="Completed today" value={String(completed)} icon={PackageCheck} tone="blue" />
        <StatCard label="Route efficiency" value={pickups.length ? `${Math.round((completed / pickups.length) * 100)}%` : '0%'} icon={Navigation} tone="amber" />
      </div>

      {/* Today's route stop tracking */}
      <TodaysRoute driverUserId={user.id} />

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="glass-card rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Route Management</h2>
              <p className="text-slate-600">Push live coordinates and update pickup status in real time.</p>
            </div>
            <MapPinned className="h-10 w-10 text-emerald-600" />
          </div>
          <div className="mt-6 grid gap-3">
            {pickups.map((pickup) => (
              <div key={pickup.id}>
                <button
                  className={`flex w-full items-center justify-between rounded-2xl p-4 text-left ${selectedPickup?.id === pickup.id ? 'bg-slate-950 text-white' : 'bg-white/80 text-slate-800'}`}
                  type="button"
                  onClick={() => {
                    setSelectedPickupId(pickup.id);
                    setStatus(pickup.status);
                  }}
                >
                  <span className="font-bold">#{pickup.id} · {pickup.waste_type}</span>
                  <span className="text-sm">{pickup.status}</span>
                </button>
                {/* Show log form for completed pickups that haven't been logged yet */}
                {selectedPickup?.id === pickup.id && pickup.status === 'completed' && (
                  <LogPickupForm
                    pickup={pickup}
                    onSuccess={() => {
                      void queryClient.invalidateQueries({ queryKey: ['driver-pickups', user?.driver_id] });
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          {selectedPickup ? (
            <div className="mt-6 grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Latitude" value={latitude} onChange={(event) => setLatitude(event.target.value)} />
                <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Longitude" value={longitude} onChange={(event) => setLongitude(event.target.value)} />
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <select className="rounded-2xl border border-slate-200 px-4 py-3" value={status} onChange={(event) => setStatus(event.target.value as PickupStatus)}>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  className="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-900"
                  type="button"
                  onClick={() => {
                    setError(null);
                    setMessage('Fetching your current GPS location...');
                    if (!window.isSecureContext) { setError('Location access requires HTTPS or localhost.'); setMessage(null); return; }
                    if (!navigator.geolocation) { setError('Geolocation is not supported in this browser.'); setMessage(null); return; }
                    navigator.geolocation.getCurrentPosition(
                      (position) => {
                        const lat = position.coords.latitude.toFixed(6);
                        const lng = position.coords.longitude.toFixed(6);
                        if (!lat || !lng || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) { setError('Invalid GPS coordinates received.'); setMessage(null); return; }
                        setLatitude(lat); setLongitude(lng); latRef.current = lat; lngRef.current = lng;
                        setError(null); setMessage('Location captured successfully.');
                      },
                      (geoError) => {
                        let msg = 'Unable to fetch your current location.';
                        switch (geoError.code) {
                          case geoError.PERMISSION_DENIED: msg = 'Location permission denied. Please allow GPS access.'; break;
                          case geoError.POSITION_UNAVAILABLE: msg = 'GPS signal unavailable. Try moving outdoors.'; break;
                          case geoError.TIMEOUT: msg = 'Location request timed out. Try again.'; break;
                        }
                        setError(msg); setMessage(null);
                      },
                      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
                    );
                  }}
                >
                  <LocateFixed className="mr-2 inline h-4 w-4" />Use my location
                </button>
              </div>
              <textarea className="rounded-2xl border border-slate-200 px-4 py-3" rows={3} placeholder="Status note" value={note} onChange={(event) => setNote(event.target.value)} />
              <div className="grid gap-3 md:grid-cols-2">
                <button
                  className={`rounded-2xl px-5 py-3 font-bold text-white ${trackingActive ? 'bg-rose-600' : 'bg-emerald-600'}`}
                  type="button"
                  onClick={() => {
                    setTrackingActive((prev) => {
                      if (!prev) setMessage('Auto-tracking started. Location is pushed every 10 s.');
                      else setMessage('Auto-tracking stopped.');
                      return !prev;
                    });
                  }}
                >
                  {trackingActive ? 'Stop auto-tracking' : 'Start auto-tracking'}
                </button>
                <button className="rounded-2xl bg-slate-200 px-5 py-3 font-bold text-slate-900" type="button" onClick={() => void sendLocation.mutateAsync()}>
                  Send once
                </button>
              </div>
              <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white" type="button" onClick={() => void updateStatus.mutateAsync(status)}>
                Save status
              </button>
            </div>
          ) : null}
          {message ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
        </article>
        <article className="glass-card rounded-[2rem] p-6">
          <h2 className="text-2xl font-black text-slate-950">Live map</h2>
          <p className="text-slate-600">Driver route renders on OpenStreetMap with streamed coordinates.</p>
          <div className="mt-6">
            <TrackingMap
              pickupLocation={selectedPickup?.coordinates ?? null}
              driverLocation={latestLocation ? { latitude: latestLocation.latitude, longitude: latestLocation.longitude } : null}
              focusMode="both"
            />
          </div>
          {selectedPickup && !selectedPickup.coordinates ? (
            <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
              Pickup coordinates are missing for this request. Ask the citizen to schedule with location so routing can lock onto the waste pickup point.
            </p>
          ) : null}
        </article>
      </div>
    </section>
  );
}