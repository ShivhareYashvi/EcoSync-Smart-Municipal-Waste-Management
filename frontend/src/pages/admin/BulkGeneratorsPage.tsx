import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { BulkGenerator, Zone } from '../../lib/types';
import { AlertTriangle, Building2, CheckCircle2, Download, FileText, Plus, ShieldAlert } from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  hotel: '🏨 Hotel & Hospitality',
  mall: '🏬 Shopping Mall',
  apartment_complex: '🏢 High-Rise Apartment Complex',
  office: '🏢 IT / Corporate Office',
  other: '🏭 Commercial / Industrial Unit',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  suspended: 'bg-rose-100 text-rose-800 border-rose-200',
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
      setSuccessMsg('Bulk generator establishment registered successfully.');
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
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Commercial Compliance Registry
            </span>
            <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Solid Waste Rules 2016
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">Bulk Waste Generators</h2>
          <p className="mt-1 text-sm text-slate-500">
            Commercial high-volume waste producers (&gt;100kg/day) requiring dedicated segregation audits and commercial tariffs.
          </p>
        </div>
        <button
          id="bg-add-btn"
          className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all shrink-0"
          type="button"
          onClick={() => { setShowForm(!showForm); setFormError(null); setSuccessMsg(null); }}
        >
          <Plus className="h-4 w-4" /> Register Establishment
        </button>
      </div>

      {/* Zone filter & statistics banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Filter Zone:</label>
          <select
            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-800"
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
          >
            <option value="">All Bhopal Municipal Zones</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
            ))}
          </select>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Showing <strong>{bgs.length}</strong> registered bulk commercial accounts
        </div>
      </div>

      {/* Registration form */}
      {showForm && (
        <article className="glass-card rounded-[2rem] p-6 sm:p-8 border border-emerald-200 bg-white/95 shadow-xl animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Building2 className="h-5 w-5 text-emerald-600" />
              Register New Bulk Waste Generator
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
                Establishment / Organisation Name *
              </label>
              <input
                id="bg-org-name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="e.g. Sayaji Hotel Bhopal"
                value={form.org_name}
                onChange={field('org_name')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Establishment Category *
              </label>
              <select
                id="bg-category"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                value={form.category}
                onChange={field('category')}
              >
                {Object.entries(CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Full Physical Address *
              </label>
              <textarea
                id="bg-address"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                placeholder="Building name, street, locality, landmark"
                rows={2}
                value={form.address}
                onChange={field('address')}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Municipal Zone *
              </label>
              <select
                id="bg-zone"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                value={form.zone_id}
                onChange={field('zone_id')}
              >
                <option value="">Select zone</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Contact User ID *
              </label>
              <input
                id="bg-contact-user"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900"
                type="number"
                placeholder="User account ID"
                value={form.contact_user_id}
                onChange={field('contact_user_id')}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Mandated Waste Threshold (kg / day) *
              </label>
              <input
                id="bg-threshold"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 font-mono font-bold"
                type="number"
                placeholder="100"
                value={form.threshold_kg}
                onChange={field('threshold_kg')}
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Entities producing &ge; 100 kg/day are mandated under CPCB 2016 rules to segregate on-site.
              </p>
            </div>
          </div>

          {formError && (
            <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="mt-5 flex items-center gap-3">
            <button
              id="bg-submit-btn"
              className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50"
              type="button"
              disabled={createMutation.isPending || !form.org_name || !form.zone_id || !form.contact_user_id}
              onClick={() => void createMutation.mutateAsync()}
            >
              {createMutation.isPending ? 'Registering...' : 'Register Generator'}
            </button>
            <button
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
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

      {/* Bulk generator cards */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {bgQuery.isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="glass-card h-44 animate-pulse rounded-[2rem] bg-slate-100" />
          ))
        ) : bgs.length === 0 ? (
          <div className="col-span-3 py-16 text-center text-slate-400 text-xs sm:text-sm">
            No bulk generators registered{filterZone ? ' in this zone' : ''}.
          </div>
        ) : (
          bgs.map((bg) => {
            const zone = zones.find((z) => z.id === bg.zone_id);
            const threshold = parseFloat(String(bg.threshold_kg));
            const isHighVolume = threshold >= 100;

            return (
              <article key={bg.id} className="glass-card rounded-[2rem] p-6 flex flex-col justify-between border border-slate-200/80 hover:border-slate-300 transition-all shadow-sm">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                          BG-${String(bg.id).padStart(3, '0')}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLES[bg.billing_status] ?? ''}`}>
                          {bg.billing_status.toUpperCase()}
                        </span>
                      </div>
                      <p className="truncate text-base font-black text-slate-900">{bg.org_name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{CATEGORY_LABELS[bg.category] ?? bg.category}</p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 line-clamp-2">{bg.address}</p>

                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs">
                    {zone && (
                      <p className="text-xs text-emerald-700 font-semibold flex items-center justify-between">
                        <span className="text-slate-400 font-normal">Municipal Ward:</span>
                        <span>{zone.name}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-700 flex items-center justify-between">
                      <span className="text-slate-400 font-normal">Registered Threshold:</span>
                      <strong className="font-mono">{bg.threshold_kg} kg / day</strong>
                    </p>
                  </div>

                  {isHighVolume && (
                    <div className="mt-3 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-1.5 text-[11px] font-bold text-amber-800">
                      <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      CPCB Regulated High Volume (&gt;100kg/d)
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSuccessMsg(`Downloading monthly commercial waste manifest PDF for ${bg.org_name} [BG-${String(bg.id).padStart(3, '0')}].`);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-slate-900"
                  >
                    <Download className="h-3 w-3 text-slate-400" /> Manifest PDF
                  </button>

                  {bg.billing_status === 'active' ? (
                    <button
                      className="rounded-xl border border-rose-200 px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      type="button"
                      onClick={() => void suspendMutation.mutateAsync({ id: bg.id, status: 'suspended' })}
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      className="rounded-xl border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-600 hover:bg-emerald-50 transition-colors"
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
