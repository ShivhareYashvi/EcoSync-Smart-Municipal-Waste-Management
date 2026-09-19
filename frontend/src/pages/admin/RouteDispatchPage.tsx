import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Route, Zone, Vehicle } from '../../lib/types';
import { Navigation, Plus, CheckCircle2, SkipForward, Clock } from 'lucide-react';

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
  pending: 'border-slate-200 bg-white/60 text-slate-500',
  arrived: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  skipped: 'border-rose-200 bg-rose-50 text-rose-600',
};

export function RouteDispatchPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DispatchForm>(emptyForm);
  const [filterDriverId, setFilterDriverId] = useState('');
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
    onSuccess: async () => {
      setSuccessMsg('Route generated successfully.');
      setFormError(null);
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
  const routes = routesQuery.data ?? [];

  function field(key: keyof DispatchForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <section className="grid gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Route Dispatch</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate optimised pickup routes · nearest-neighbour ordering
          </p>
        </div>
        <button
          id="route-generate-btn"
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition-colors"
          type="button"
          onClick={() => { setShowForm(!showForm); setFormError(null); setSuccessMsg(null); }}
        >
          <Plus className="h-4 w-4" /> Generate Route
        </button>
      </div>

      {/* Generate form */}
      {showForm && (
        <article className="glass-card rounded-[2rem] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Navigation className="h-5 w-5 text-emerald-500" />
            New Route
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              id="route-driver-id"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              type="number"
              placeholder="Driver user ID"
              value={form.driver_id}
              onChange={field('driver_id')}
            />
            <select
              id="route-zone"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={form.zone_id}
              onChange={field('zone_id')}
            >
              <option value="">Select zone</option>
              {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
            </select>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Route date</label>
              <input
                id="route-date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                type="date"
                value={form.route_date}
                onChange={field('route_date')}
              />
            </div>
            <select
              id="route-vehicle"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={form.vehicle_id}
              onChange={field('vehicle_id')}
            >
              <option value="">No vehicle assigned</option>
              {vehicles.filter((v) => v.active).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.registration_number} ({v.fuel_type})
                </option>
              ))}
            </select>
          </div>
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          <div className="mt-4 flex gap-3">
            <button
              id="route-submit-btn"
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              type="button"
              disabled={generateMutation.isPending}
              onClick={() => void generateMutation.mutateAsync()}
            >
              {generateMutation.isPending ? 'Generating…' : 'Generate'}
            </button>
            <button
              className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
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
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <p className="text-sm font-semibold text-emerald-800">{successMsg}</p>
        </div>
      )}

      {/* Driver route viewer */}
      <article className="glass-card rounded-[2rem] p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">View Driver Routes</h3>
        <div className="flex items-center gap-3">
          <input
            id="route-filter-driver"
            className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm w-48"
            type="number"
            placeholder="Driver user ID"
            value={filterDriverId}
            onChange={(e) => setFilterDriverId(e.target.value)}
          />
          {routesQuery.isLoading && (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          )}
        </div>

        {routes.length > 0 ? (
          <div className="mt-5 grid gap-5">
            {routes.map((route) => {
              const zone = zones.find((z) => z.id === route.zone_id);
              return (
                <div key={route.id} className="rounded-2xl border border-slate-100 bg-white/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">
                        Route #{route.id} · {route.route_date}
                      </p>
                      <p className="text-sm text-slate-500">{zone?.name ?? `Zone #${route.zone_id}`}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold
                      ${route.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                        route.status === 'in_progress' ? 'bg-cyan-100 text-cyan-700' :
                        'bg-slate-100 text-slate-600'}`}>
                      {route.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Stop list */}
                  <div className="mt-4 grid gap-2">
                    {[...route.stops]
                      .sort((a, b) => a.sequence_order - b.sequence_order)
                      .map((stop) => (
                        <div
                          key={stop.id}
                          className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm transition-colors ${STOP_STATUS_STYLES[stop.status] ?? ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-700">
                              {stop.sequence_order}
                            </span>
                            <div>
                              <p className="font-semibold">Pickup #{stop.pickup_id}</p>
                              {stop.estimated_arrival && (
                                <p className="flex items-center gap-1 text-xs opacity-70">
                                  <Clock className="h-3 w-3" />
                                  ETA {new Date(stop.estimated_arrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase opacity-70">{stop.status}</span>
                            {stop.status === 'pending' && (
                              <>
                                <button
                                  className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
                                  type="button"
                                  onClick={() => void stopStatusMutation.mutateAsync({ routeId: route.id, stopId: stop.id, status: 'arrived' })}
                                >
                                  <CheckCircle2 className="inline h-3.5 w-3.5" /> Arrived
                                </button>
                                <button
                                  className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                  type="button"
                                  onClick={() => void stopStatusMutation.mutateAsync({ routeId: route.id, stopId: stop.id, status: 'skipped' })}
                                >
                                  <SkipForward className="inline h-3.5 w-3.5" /> Skip
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    {route.stops.length === 0 && (
                      <p className="py-3 text-center text-sm text-slate-400">No stops on this route.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : filterDriverId ? (
          <p className="mt-6 text-center text-slate-400">No routes found for driver #{filterDriverId}.</p>
        ) : (
          <p className="mt-6 text-center text-slate-400">Enter a driver ID to load their routes.</p>
        )}
      </article>
    </section>
  );
}
