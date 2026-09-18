import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { Vehicle } from '../../lib/types';
import { AlertTriangle, CheckCircle2, Plus, Wrench } from 'lucide-react';

const FUEL_OPTIONS = [
  { value: 'diesel', label: 'Diesel' },
  { value: 'cng', label: 'CNG' },
  { value: 'electric', label: 'Electric' },
  { value: 'petrol', label: 'Petrol' },
];

const FUEL_COLORS: Record<string, string> = {
  diesel: 'bg-amber-100 text-amber-800',
  cng: 'bg-cyan-100 text-cyan-800',
  electric: 'bg-emerald-100 text-emerald-800',
  petrol: 'bg-rose-100 text-rose-800',
};

function Badge({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-bold ${className ?? ''}`}>
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
  const [showForm, setShowForm] = useState(false);
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
      setSuccessMsg('Vehicle registered successfully.');
      setFormError(null);
      setForm(emptyForm);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['fleet-vehicles'] });
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
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Fleet Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            {vehicles.length} vehicles registered · {dueSoon.length} maintenance alerts
          </p>
        </div>
        <button
          id="fleet-add-vehicle-btn"
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition-colors"
          type="button"
          onClick={() => { setShowForm(!showForm); setFormError(null); setSuccessMsg(null); }}
        >
          <Plus className="h-4 w-4" /> Add Vehicle
        </button>
      </div>

      {/* Maintenance alerts banner */}
      {dueSoon.length > 0 && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm font-semibold text-amber-800">
            {dueSoon.length} vehicle{dueSoon.length > 1 ? 's' : ''} due for maintenance within 7 days:{' '}
            {dueSoon.map((v) => v.registration_number).join(', ')}
          </p>
        </div>
      )}

      {/* Add vehicle form */}
      {showForm && (
        <article className="glass-card rounded-[2rem] p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">Register New Vehicle</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              id="fleet-reg-number"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Registration number (e.g. KA01AB1234)"
              value={form.registration_number}
              onChange={field('registration_number')}
            />
            <input
              id="fleet-capacity"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              type="number"
              placeholder="Capacity (kg)"
              value={form.capacity_kg}
              onChange={field('capacity_kg')}
            />
            <select
              id="fleet-fuel-type"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={form.fuel_type}
              onChange={field('fuel_type')}
            >
              {FUEL_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                Maintenance due date
              </label>
              <input
                id="fleet-maint-date"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3"
                type="date"
                value={form.maintenance_due_date}
                onChange={field('maintenance_due_date')}
              />
            </div>
            <input
              id="fleet-driver-id"
              className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2"
              type="number"
              placeholder="Assigned driver user ID (optional)"
              value={form.assigned_driver_id}
              onChange={field('assigned_driver_id')}
            />
          </div>
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          <div className="mt-4 flex gap-3">
            <button
              id="fleet-submit-btn"
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              type="button"
              disabled={createMutation.isPending}
              onClick={() => void createMutation.mutateAsync()}
            >
              {createMutation.isPending ? 'Saving…' : 'Register'}
            </button>
            <button
              className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              type="button"
              onClick={() => { setShowForm(false); setFormError(null); }}
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

      {/* Vehicle cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vehiclesQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-40 animate-pulse rounded-[2rem] bg-slate-100" />
          ))
        ) : vehicles.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400">
            No vehicles registered yet.
          </div>
        ) : (
          vehicles.map((v) => (
            <article
              key={v.id}
              className={`glass-card rounded-[2rem] p-5 ${!v.active ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-lg font-black text-slate-900">{v.registration_number}</p>
                  <p className="text-sm text-slate-500">{v.capacity_kg.toLocaleString()} kg capacity</p>
                </div>
                <Badge
                  text={v.fuel_type.toUpperCase()}
                  className={FUEL_COLORS[v.fuel_type] ?? 'bg-slate-100 text-slate-600'}
                />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white/60 p-2">
                  <p className="text-slate-500">Due date</p>
                  <p className={`font-bold ${v.maintenance_due_soon ? 'text-amber-600' : 'text-slate-800'}`}>
                    {v.maintenance_due_soon && <Wrench className="mr-1 inline h-3 w-3" />}
                    {new Date(v.maintenance_due_date).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-xl bg-white/60 p-2">
                  <p className="text-slate-500">This week</p>
                  <p className="font-bold text-slate-800">{v.pickups_completed_this_week} pickups</p>
                </div>
              </div>
              {v.assigned_driver_id && (
                <p className="mt-3 text-xs text-slate-500">Driver #{v.assigned_driver_id}</p>
              )}
              {!v.active && (
                <span className="mt-2 inline-block rounded-full bg-slate-200 px-3 py-0.5 text-xs font-bold text-slate-500">
                  INACTIVE
                </span>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
