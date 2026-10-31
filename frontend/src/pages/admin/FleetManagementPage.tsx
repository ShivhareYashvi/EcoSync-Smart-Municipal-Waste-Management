import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Vehicle } from '../../lib/types';
import { AlertTriangle, CheckCircle2, Gauge, Plus, Truck, Wrench, X } from 'lucide-react';

const FUEL_OPTIONS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric (EV)' },
  { value: 'petrol', label: 'Petrol' },
];

const FUEL_COLORS: Record<string, string> = {
  diesel: 'bg-amber-100 text-amber-800 border-amber-300',
  cng: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  electric: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  petrol: 'bg-rose-100 text-rose-800 border-rose-300',
};

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold border ${className ?? ''}`}>
      {text}
    </span>
  );
}

type VehicleForm = {
  registration_number: string;
  capacity_kg: string;
  fuel_type: string;
  maintenance_due_date: string;
  assigned_driver_id: string;
};

const emptyForm: VehicleForm = {
  registration_number: '',
  capacity_kg: '',
  fuel_type: 'diesel',
  maintenance_due_date: '',
  assigned_driver_id: '',
};

export function FleetManagementPage() {
  const queryClient = useQueryClient();
  const [showDrawer, setShowDrawer] = useState(false);
  const [form, setForm] = useState<VehicleForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ['fleet-vehicles'],
    queryFn: async () => {
      const r = await api.get<Vehicle[]>('/vehicles');
      return r.data;
    },
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/vehicles', {
        ...form,
        capacity_kg: parseFloat(form.capacity_kg),
        assigned_driver_id: form.assigned_driver_id ? parseInt(form.assigned_driver_id) : null,
      });
    },
    onSuccess: async () => {
      setSuccessMsg('Vehicle registered successfully with municipal fleet registry.');
      setFormError(null);
      setForm(emptyForm);
      setShowDrawer(false);
      await queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
      setTimeout(() => setSuccessMsg(null), 5000);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Failed to register vehicle.';
      setFormError(msg);
    },
  });

  const vehicles = vehiclesQuery.data ?? [];
  const dueSoon = vehicles.filter((v) => v.maintenance_due_soon);

  function field(key: keyof VehicleForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <section className="grid gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Fleet Management & IoT Telemetry</h2>
          <p className="mt-1 text-sm text-slate-500">
            {vehicles.length} active fleet vehicles · {dueSoon.length} maintenance inspections due
          </p>
        </div>
        <button
          id="fleet-add-vehicle-btn"
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition"
          type="button"
          onClick={() => { setShowDrawer(true); setFormError(null); setSuccessMsg(null); }}
        >
          <Plus className="h-4 w-4" /> Register New Compactor Truck
        </button>
      </div>

      {/* Maintenance alerts banner */}
      {dueSoon.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-xs sm:text-sm font-semibold text-amber-800">
            {dueSoon.length} vehicle{dueSoon.length > 1 ? 's' : ''} due for municipal fitness test / maintenance within 7 days:{' '}
            {dueSoon.map((v) => v.registration_number).join(', ')}
          </p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold text-emerald-800">{successMsg}</p>
        </div>
      )}

      {/* Vehicle cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehiclesQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-44 animate-pulse rounded-[2rem] bg-slate-100" />
          ))
        ) : vehicles.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400">
            No vehicles registered yet. Click &quot;Register New Compactor Truck&quot; to begin.
          </div>
        ) : (
          vehicles.map((v) => (
            <article
              key={v.id}
              className={`glass-card rounded-[2rem] p-5 shadow-sm space-y-3 ${!v.active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 border border-slate-200">
                      VEH-{String(v.id).padStart(3, '0')}
                    </span>
                    <p className="text-lg font-black text-slate-900">{v.registration_number}</p>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{v.capacity_kg.toLocaleString()} kg max payload</p>
                </div>
                <Badge
                  text={v.fuel_type.toUpperCase()}
                  className={FUEL_COLORS[v.fuel_type] ?? 'bg-slate-100 text-slate-600 border-slate-200'}
                />
              </div>

              {/* Weekly Utilization Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1"><Gauge className="h-3.5 w-3.5 text-slate-400" /> Weekly Activity</span>
                  <span className="font-bold text-slate-800">{v.pickups_completed_this_week} completed rounds</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.min(v.pickups_completed_this_week * 10, 100)}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Fitness Due</p>
                  <p className={`font-bold mt-0.5 ${v.maintenance_due_soon ? 'text-amber-600' : 'text-slate-800'}`}>
                    {v.maintenance_due_soon && <Wrench className="mr-1 inline h-3 w-3" />}
                    {new Date(v.maintenance_due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-200/60">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Assignment</p>
                  <p className="font-bold text-slate-800 mt-0.5 truncate">
                    {v.assigned_driver_id ? `Driver #${v.assigned_driver_id}` : 'Unassigned'}
                  </p>
                </div>
              </div>

              {!v.active && (
                <span className="inline-block rounded-full bg-slate-200 px-3 py-0.5 text-xs font-bold text-slate-500">
                  OFF-DUTY / INACTIVE
                </span>
              )}
            </article>
          ))
        )}
      </div>

      {/* Slide-Over Modal Drawer for Vehicle Registration */}
      {showDrawer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="h-full w-full max-w-md bg-white p-6 sm:p-8 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Register New Compactor</h3>
                    <p className="text-xs text-slate-500">Bhopal Municipal Fleet Registry</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDrawer(false)}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Registration Plate Number *
                  </label>
                  <input
                    id="fleet-reg-number"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase outline-none focus:border-emerald-600"
                    placeholder="e.g. MP04GA1234"
                    value={form.registration_number}
                    onChange={field('registration_number')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Payload Capacity (kg) *
                  </label>
                  <input
                    id="fleet-capacity"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600"
                    type="number"
                    placeholder="e.g. 1500"
                    value={form.capacity_kg}
                    onChange={field('capacity_kg')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Powertrain / Fuel Type *
                  </label>
                  <select
                    id="fleet-fuel-type"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600"
                    value={form.fuel_type}
                    onChange={field('fuel_type')}
                  >
                    {FUEL_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Fitness & Maintenance Due Date *
                  </label>
                  <input
                    id="fleet-maint-date"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600"
                    type="date"
                    value={form.maintenance_due_date}
                    onChange={field('maintenance_due_date')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Assigned Driver User ID (Optional)
                  </label>
                  <input
                    id="fleet-driver-id"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-xs font-bold outline-none focus:border-emerald-600"
                    type="number"
                    placeholder="e.g. 4"
                    value={form.assigned_driver_id}
                    onChange={field('assigned_driver_id')}
                  />
                </div>
              </div>

              {formError && (
                <div className="rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs font-bold text-rose-700">
                  {formError}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <button
                id="fleet-submit-btn"
                className="flex-1 rounded-2xl bg-emerald-600 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 disabled:opacity-50 transition"
                type="button"
                disabled={createMutation.isPending || !form.registration_number || !form.capacity_kg}
                onClick={() => void createMutation.mutateAsync()}
              >
                {createMutation.isPending ? 'Registering...' : 'Register Vehicle'}
              </button>
              <button
                className="rounded-2xl border border-slate-200 px-5 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                type="button"
                onClick={() => setShowDrawer(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
