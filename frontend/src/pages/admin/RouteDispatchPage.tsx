import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Route, Zone, Vehicle, Driver, Pickup } from '../../lib/types';
import { Navigation, Plus, CheckCircle2, SkipForward, Clock, MapPin, Truck, Calendar, Layers } from 'lucide-react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';

type DispatchForm = {
  driver_id: string;
  zone_id: string;
  route_date: string;
  vehicle_id: string;
};

const emptyForm: DispatchForm = {
  driver_id: '',
  zone_id: '',
  route_date: new Date().toISOString().slice(0, 10),
  vehicle_id: '',
};

const STOP_STATUS_STYLES: Record<string, string> = {
  pending: 'border-slate-200 bg-white/70 text-slate-600',
  arrived: 'border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold',
  skipped: 'border-rose-200 bg-rose-50 text-rose-700',
};

function MapBoundsFit({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, points]);
  return null;
}

function RouteMapViewer({
  route,
  pickups,
}: {
  route: Route;
  pickups: Pickup[];
}) {
  const stopsWithCoords = useMemo(() => {
    return [...route.stops]
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map((stop) => {
        const pkp = pickups.find((p) => p.id === stop.pickup_id);
        const lat = pkp?.coordinates?.latitude;
        const lng = pkp?.coordinates?.longitude;
        const hasCoords = lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng);
        return {
          ...stop,
          pickup: pkp,
          coords: hasCoords ? ([lat, lng] as [number, number]) : null,
        };
      });
  }, [route.stops, pickups]);

  const validPoints = useMemo(
    () => stopsWithCoords.filter((s): s is typeof s & { coords: [number, number] } => s.coords !== null).map((s) => s.coords),
    [stopsWithCoords]
  );

  const center: [number, number] = validPoints.length > 0 ? validPoints[0] : [23.2599, 77.4126];

  const createStopIcon = (seq: number, status: string) => {
    const bg = status === 'arrived' ? '#059669' : status === 'skipped' ? '#e11d48' : '#0284c7';
    return divIcon({
      html: `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;background:${bg};color:#ffffff;border:2.5px solid #ffffff;border-radius:50%;box-shadow:0 3px 6px rgba(0,0,0,0.3);font-size:11px;font-weight:900;">${seq}</div>`,
      className: '',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm h-[400px] relative">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapBoundsFit points={validPoints} />
        {validPoints.length > 1 && (
          <Polyline
            positions={validPoints}
            color="#0284c7"
            weight={4}
            opacity={0.85}
            dashArray="6, 8"
          />
        )}
        {stopsWithCoords.map((stop) => {
          if (!stop.coords) return null;
          return (
            <Marker
              key={stop.id}
              position={stop.coords}
              icon={createStopIcon(stop.sequence_order, stop.status)}
            >
              <Popup>
                <div className="p-1 space-y-1">
                  <p className="font-bold text-slate-900 text-xs">
                    Stop #{stop.sequence_order} · [PKP-${String(stop.pickup_id).padStart(3, '0')}]
                  </p>
                  <p className="text-[11px] text-slate-600 capitalize">
                    {stop.pickup?.waste_type || 'General'} Waste
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {stop.pickup?.notes || 'Bhopal Municipal Ward Location'}
                  </p>
                  <div className="pt-1">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      stop.status === 'arrived' ? 'bg-emerald-100 text-emerald-800' :
                      stop.status === 'skipped' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {stop.status}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {validPoints.length === 0 && (
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-xl px-4 py-3 shadow-md border border-slate-200 text-center max-w-xs">
            <p className="text-xs font-bold text-slate-800">Awaiting GPS Stop Coordinates</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Stops on this route do not have mapped coordinates yet.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function RouteDispatchPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DispatchForm>(emptyForm);
  const [filterDriverId, setFilterDriverId] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await api.get<Zone[]>('/zones')).data,
  });

  const vehiclesQuery = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: async () => (await api.get<Vehicle[]>('/vehicles')).data,
  });

  const driversQuery = useQuery({
    queryKey: ['dispatch-drivers'],
    queryFn: async () => {
      try {
        return (await api.get<Driver[]>('/operations/drivers')).data;
      } catch {
        return [];
      }
    },
  });

  const pickupsQuery = useQuery({
    queryKey: ['dispatch-pickups'],
    queryFn: async () => {
      try {
        return (await api.get<Pickup[]>('/pickups')).data;
      } catch {
        return [];
      }
    },
  });

  const routesQuery = useQuery({
    queryKey: ['routes', filterDriverId],
    queryFn: async () => {
      if (!filterDriverId) return [];
      return (await api.get<Route[]>(`/routes?driver_id=${filterDriverId}`)).data;
    },
    enabled: !!filterDriverId,
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      return (await api.post<Route>('/routes/generate', {
        driver_id: parseInt(form.driver_id),
        zone_id: parseInt(form.zone_id),
        route_date: form.route_date,
        vehicle_id: form.vehicle_id ? parseInt(form.vehicle_id) : null,
      })).data;
    },
    onSuccess: async (createdRoute) => {
      setSuccessMsg(`Route [RT-${String(createdRoute.id).padStart(3, '0')}] generated successfully with ${createdRoute.stops.length} stops.`);
      setFormError(null);
      setFilterDriverId(form.driver_id);
      setSelectedRouteId(createdRoute.id);
      setForm(emptyForm);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['routes'] });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Route generation failed.';
      setFormError(msg);
    },
  });

  const stopStatusMutation = useMutation({
    mutationFn: async ({ routeId, stopId, status }: { routeId: number; stopId: number; status: string }) => {
      return (await api.patch<Route>(`/routes/${routeId}/stops/${stopId}/status`, { status })).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] }),
  });

  const zones = zonesQuery.data ?? [];
  const vehicles = vehiclesQuery.data ?? [];
  const drivers = driversQuery.data ?? [];
  const pickups = pickupsQuery.data ?? [];
  const routes = routesQuery.data ?? [];

  // Default active route selection
  const activeRoute = useMemo(() => {
    if (selectedRouteId) {
      const found = routes.find((r) => r.id === selectedRouteId);
      if (found) return found;
    }
    return routes.length > 0 ? routes[0] : null;
  }, [routes, selectedRouteId]);

  function field(key: keyof DispatchForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Municipal Operations Hub
            </span>
            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              VRP Routing Active
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Route Dispatch & Sequencing</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate optimised pickup routes with nearest-neighbour sequence ordering across Bhopal wards.
          </p>
        </div>
        <button
          id="route-generate-btn"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all shrink-0"
          type="button"
          onClick={() => { setShowForm(!showForm); setFormError(null); setSuccessMsg(null); }}
        >
          <Plus className="h-4 w-4" /> Generate New Route
        </button>
      </div>

      {/* Generate form modal/card */}
      {showForm && (
        <article className="glass-card rounded-[2rem] p-6 sm:p-8 border border-emerald-200 bg-white/90 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Navigation className="h-5 w-5 text-emerald-600" />
              Configure Route Sequencing
            </h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-700 text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Driver *
              </label>
              {drivers.length > 0 ? (
                <select
                  id="route-driver-id"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                  value={form.driver_id}
                  onChange={field('driver_id')}
                >
                  <option value="">Select assigned driver</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.user_id}>
                      Driver User #{d.user_id} · Vehicle: {d.vehicle_number || 'Unassigned'}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="route-driver-id"
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  type="number"
                  placeholder="Driver user ID"
                  value={form.driver_id}
                  onChange={field('driver_id')}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Target Municipal Zone *
              </label>
              <select
                id="route-zone"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                value={form.zone_id}
                onChange={field('zone_id')}
              >
                <option value="">Select municipal zone</option>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.name} ({z.code})</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Execution Date *
              </label>
              <input
                id="route-date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                type="date"
                value={form.route_date}
                onChange={field('route_date')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Municipal Vehicle (Optional)
              </label>
              <select
                id="route-vehicle"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                value={form.vehicle_id}
                onChange={field('vehicle_id')}
              >
                <option value="">Auto-assign or none</option>
                {vehicles.filter((v) => v.active).map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registration_number} · {v.fuel_type.toUpperCase()} ({v.capacity_kg} kg cap)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              id="route-submit-btn"
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-sm"
              type="button"
              disabled={generateMutation.isPending || !form.driver_id || !form.zone_id}
              onClick={() => void generateMutation.mutateAsync()}
            >
              {generateMutation.isPending ? 'Calculating Sequence...' : 'Generate Route'}
            </button>
            <button
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              type="button"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </article>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold text-emerald-900">{successMsg}</p>
        </div>
      )}

      {/* Driver filter & Route workspace */}
      <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Active Driver Route Board</h3>
            <p className="text-xs text-slate-500 mt-0.5">Filter routes by driver to view stops and visual map polyline.</p>
          </div>

          <div className="flex items-center gap-2">
            {drivers.length > 0 ? (
              <select
                id="route-filter-driver-select"
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold bg-white text-slate-800"
                value={filterDriverId}
                onChange={(e) => {
                  setFilterDriverId(e.target.value);
                  setSelectedRouteId(null);
                }}
              >
                <option value="">Select driver</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.user_id}>
                    Driver #{d.user_id} ({d.vehicle_number || 'No Vehicle'})
                  </option>
                ))}
              </select>
            ) : null}
            <input
              id="route-filter-driver"
              className="rounded-xl border border-slate-200 px-3 py-2 text-xs w-32"
              type="number"
              placeholder="Or enter user ID"
              value={filterDriverId}
              onChange={(e) => {
                setFilterDriverId(e.target.value);
                setSelectedRouteId(null);
              }}
            />
            {routesQuery.isLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            )}
          </div>
        </div>

        {routes.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Routes & Stop Sequence List */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Assigned Routes ({routes.length})
                </span>
                <span className="text-xs text-slate-400">Click a route to inspect map path</span>
              </div>

              <div className="space-y-3">
                {routes.map((route) => {
                  const zone = zones.find((z) => z.id === route.zone_id);
                  const isSelected = activeRoute?.id === route.id;
                  const stops = [...route.stops].sort((a, b) => a.sequence_order - b.sequence_order);
                  const doneCount = stops.filter((s) => s.status === 'arrived').length;

                  return (
                    <div
                      key={route.id}
                      onClick={() => setSelectedRouteId(route.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/10 shadow-sm'
                          : 'border-slate-200/80 bg-white/70 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800">
                              RT-${String(route.id).padStart(3, '0')}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {route.route_date}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {zone?.name ?? `Zone #${route.zone_id}`} · {doneCount}/{stops.length} completed
                          </p>
                        </div>
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          route.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                          route.status === 'in_progress' ? 'bg-cyan-100 text-cyan-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {route.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      {/* Stops List */}
                      {isSelected && (
                        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                            Stop Sequence ({stops.length} stops)
                          </p>
                          {stops.map((stop) => {
                            const isPending = stop.status === 'pending';
                            return (
                              <div
                                key={stop.id}
                                className={`flex items-center justify-between rounded-xl border px-3.5 py-2 text-xs transition-colors ${STOP_STATUS_STYLES[stop.status] ?? ''}`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-black text-slate-700">
                                    {stop.sequence_order}
                                  </span>
                                  <div>
                                    <p className="font-bold text-slate-900">
                                      Stop #{stop.sequence_order} · [PKP-${String(stop.pickup_id).padStart(3, '0')}]
                                    </p>
                                    {stop.estimated_arrival && (
                                      <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        ETA {new Date(stop.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                                    {stop.status}
                                  </span>
                                  {isPending && (
                                    <>
                                      <button
                                        className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors"
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void stopStatusMutation.mutateAsync({ routeId: route.id, stopId: stop.id, status: 'arrived' });
                                        }}
                                      >
                                        Arrived
                                      </button>
                                      <button
                                        className="rounded-lg border border-rose-200 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          void stopStatusMutation.mutateAsync({ routeId: route.id, stopId: stop.id, status: 'skipped' });
                                        }}
                                      >
                                        Skip
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Interactive Leaflet Route Map */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                  Live Route Geographic Polyline
                </span>
                {activeRoute && (
                  <span className="text-xs font-mono font-bold text-emerald-700">
                    Route [RT-${String(activeRoute.id).padStart(3, '0')}]
                  </span>
                )}
              </div>

              {activeRoute ? (
                <div className="space-y-2">
                  <RouteMapViewer route={activeRoute} pickups={pickups} />
                  <p className="text-[11px] text-slate-400 text-center">
                    Numbered markers show collection sequence order. Dotted line represents optimal transit path.
                  </p>
                </div>
              ) : (
                <div className="h-[400px] rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-center p-6 text-slate-400 text-xs">
                  Select a route from the list to display its geographic polyline.
                </div>
              )}
            </div>
          </div>
        ) : filterDriverId ? (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            No routes found for driver #{filterDriverId}. Click &quot;Generate New Route&quot; above to schedule one.
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 text-xs sm:text-sm">
            Select or enter a driver user ID above to load their assigned collection routes.
          </div>
        )}
      </article>
    </section>
  );
}
