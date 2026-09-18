import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BulkGenerator, Zone } from '../../lib/types';
import { Building2, CheckCircle2, Plus } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  hotel: '🏨 Hotel',
  mall: '🏬 Mall',
  apartment_complex: '🏢 Apartment Complex',
  office: '🏢 Office',
  other: '🏭 Other',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800',
  suspended: 'bg-rose-100 text-rose-800',
};

type BGForm = {
  org_name: string;
  category: string;
  address: string;
  zone_id: string;
  contact_user_id: string;
  threshold_kg: string;
};

const emptyForm: BGForm = {
  org_name: '',
  category: 'hotel',
  address: '',
  zone_id: '',
  contact_user_id: '',
  threshold_kg: '100',
};

export function BulkGeneratorsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterZone, setFilterZone] = useState<string>('');
  const [form, setForm] = useState<BGForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const zonesQuery = useQuery({
    queryKey: ['zones'],
    queryFn: async () => (await api.get<Zone[]>('/zones')).data,
  });

  const bgQuery = useQuery({
    queryKey: ['bulk-generators', filterZone],
    queryFn: async () => {
      const url = filterZone ? `/bulk-generators?zone_id=${filterZone}` : '/bulk-generators';
      return (await api.get<BulkGenerator[]>(url)).data;
    },
    refetchInterval: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      await api.post('/bulk-generators/register', {
        ...form,
        zone_id: parseInt(form.zone_id),
        contact_user_id: parseInt(form.contact_user_id),
        threshold_kg: parseFloat(form.threshold_kg),
      });
    },
    onSuccess: async () => {
      setSuccessMsg('Bulk generator registered.');
      setFormError(null);
      setForm(emptyForm);
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['bulk-generators'] });
    },
    onError: (e: unknown) => {
      setFormError(e instanceof Error ? e.message : 'Registration failed.');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await api.patch(`/bulk-generators/${id}/status`, { billing_status: status });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulk-generators'] }),
  });

  const bgs = bgQuery.data ?? [];
  const zones = zonesQuery.data ?? [];

  function field(key: keyof BGForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  return (
    <section className="grid gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Bulk Generator Registry</h2>
          <p className="mt-1 text-sm text-slate-500">
            Commercial high-volume waste producers · {bgs.length} registered
          </p>
        </div>
        <button
          id="bg-add-btn"
          className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition-colors"
          type="button"
          onClick={() => { setShowForm(!showForm); setFormError(null); setSuccessMsg(null); }}
        >
          <Plus className="h-4 w-4" /> Register
        </button>
      </div>

      {/* Zone filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-semibold text-slate-600">Filter by zone:</label>
        <select
          className="rounded-2xl border border-slate-200 px-4 py-2 text-sm"
          value={filterZone}
          onChange={(e) => setFilterZone(e.target.value)}
        >
          <option value="">All zones</option>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {/* Registration form */}
      {showForm && (
        <article className="glass-card rounded-[2rem] p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
            <Building2 className="h-5 w-5 text-emerald-500" />
            Register Bulk Generator
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              id="bg-org-name"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              placeholder="Organisation name"
              value={form.org_name}
              onChange={field('org_name')}
            />
            <select
              id="bg-category"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={form.category}
              onChange={field('category')}
            >
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            <textarea
              id="bg-address"
              className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2"
              placeholder="Full address"
              rows={2}
              value={form.address}
              onChange={field('address')}
            />
            <select
              id="bg-zone"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={form.zone_id}
              onChange={field('zone_id')}
            >
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <input
              id="bg-contact-user"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              type="number"
              placeholder="Contact user ID"
              value={form.contact_user_id}
              onChange={field('contact_user_id')}
            />
            <input
              id="bg-threshold"
              className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2"
              type="number"
              placeholder="Threshold (kg/day)"
              value={form.threshold_kg}
              onChange={field('threshold_kg')}
            />
          </div>
          {formError && <p className="mt-3 text-sm text-rose-600">{formError}</p>}
          <div className="mt-4 flex gap-3">
            <button
              id="bg-submit-btn"
              className="rounded-full bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
              type="button"
              disabled={createMutation.isPending}
              onClick={() => void createMutation.mutateAsync()}
            >
              {createMutation.isPending ? 'Saving…' : 'Register'}
            </button>
            <button
              className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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

      {/* Bulk generator cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {bgQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-36 animate-pulse rounded-[2rem] bg-slate-100" />
          ))
        ) : bgs.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-400">
            No bulk generators registered{filterZone ? ' in this zone' : ''}.
          </div>
        ) : (
          bgs.map((bg) => {
            const zone = zones.find((z) => z.id === bg.zone_id);
            return (
              <article key={bg.id} className="glass-card rounded-[2rem] p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-slate-900">{bg.org_name}</p>
                    <p className="text-sm text-slate-500">{CATEGORY_LABELS[bg.category] ?? bg.category}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-bold ${STATUS_STYLES[bg.billing_status] ?? ''}`}>
                    {bg.billing_status.toUpperCase()}
                  </span>
                </div>
                <p className="mt-3 text-xs text-slate-500 line-clamp-1">{bg.address}</p>
                {zone && <p className="mt-1 text-xs text-cyan-600 font-semibold">{zone.name}</p>}
                <p className="mt-1 text-xs text-slate-400">Threshold: {bg.threshold_kg} kg/day</p>
                <div className="mt-4 flex gap-2">
                  {bg.billing_status === 'active' ? (
                    <button
                      className="rounded-full border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      type="button"
                      onClick={() => void suspendMutation.mutateAsync({ id: bg.id, status: 'suspended' })}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
                      type="button"
                      onClick={() => void suspendMutation.mutateAsync({ id: bg.id, status: 'active' })}
                    >
                      Reactivate
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
