import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CircleAlert, Download, Truck, UsersRound } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { StatCard } from '../../components/StatCard';
import { CompostBatchPanel } from '../../components/admin/CompostBatchPanel';
import { EPRCreditLedgerPanel } from '../../components/admin/EPRCreditLedgerPanel';
import { RecyclerVerificationQueue } from '../../components/admin/RecyclerVerificationQueue';
import { RWAAdminApprovalQueue } from '../../components/admin/RWAAdminApprovalQueue';
import { API_BASE_URL, api } from '../../lib/api';
import type { AnalyticsSummary, Driver, Pickup } from '../../lib/types';

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [pickupId, setPickupId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyticsQuery = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await api.get<AnalyticsSummary>('/analytics/summary');
      return response.data;
    }
  });

  const pickupsQuery = useQuery({
    queryKey: ['admin-pickups'],
    queryFn: async () => {
      const response = await api.get<Pickup[]>('/pickups');
      return response.data;
    }
  });

  const driversQuery = useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const response = await api.get<Driver[]>('/drivers');
      return response.data;
    }
  });

  const assignPickup = useMutation({
    mutationFn: async () => {
      await api.patch(`/pickups/${pickupId}/assign`, { driver_id: Number(driverId) });
    },
    onSuccess: async () => {
      setMessage('Pickup successfully dispatched and assigned to driver.');
      setError(null);
      setPickupId('');
      setDriverId('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-pickups'] }),
        queryClient.invalidateQueries({ queryKey: ['drivers'] }),
        queryClient.invalidateQueries({ queryKey: ['analytics-summary'] })
      ]);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : 'Unable to assign pickup.');
    }
  });

  const analytics = analyticsQuery.data;
  const pickups = useMemo(() => pickupsQuery.data ?? [], [pickupsQuery.data]);
  const drivers = driversQuery.data ?? [];
  const unassignedPickups = pickups.filter((pickup) => pickup.driver_id === null);
  const uniqueUserCount = useMemo(() => new Set(pickups.map((pickup) => pickup.user_id)).size, [pickups]);
  const formatPickupCode = (id: number) => `PKP-${String(id).padStart(3, '0')}`;

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Verified Citizens" value={String(uniqueUserCount)} icon={UsersRound} />
        <StatCard label="Active Fleet Drivers" value={String(drivers.filter((driver) => driver.availability === 'on_route').length)} icon={Truck} tone="blue" />
        <StatCard label="Open Grievances" value={String(analytics?.complaint_trends.find((item) => item.label === 'open')?.value ?? 0)} icon={CircleAlert} tone="rose" />
        <StatCard label="Pickup Efficiency" value={`${analytics?.pickup_efficiency.value ?? 0}%`} icon={BarChart3} tone="amber" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Ward-Level Waste Analytics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Aggregated collection volumes and citizen grievance resolution summary.</p>
            </div>
            <a className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-2xl bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition" href={`${API_BASE_URL}/analytics/export.csv`} target="_blank" rel="noreferrer">
              <Download className="h-4 w-4" /> Export CSV Report
            </a>
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.area_wise_pickups ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#10b981" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Fleet Dispatch Console</h2>
              <p className="text-xs text-slate-500 mt-0.5">Assign pending doorstep requests to available municipal drivers.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              {unassignedPickups.length} Unassigned
            </span>
          </div>

          <div className="grid gap-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Select Pending Pickup Request
              </label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20" value={pickupId} onChange={(event) => setPickupId(event.target.value)}>
                <option value="">Choose Pending Pickup ({unassignedPickups.length} available)</option>
                {unassignedPickups.map((pickup) => (
                  <option key={pickup.id} value={pickup.id}>
                    [{formatPickupCode(pickup.id)}] · {pickup.waste_type.toUpperCase()} · {pickup.scheduled_date} ({pickup.scheduled_time || 'Morning'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assign Municipal Driver & Compactor
              </label>
              <select className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20" value={driverId} onChange={(event) => setDriverId(event.target.value)}>
                <option value="">Choose Available Driver ({drivers.length} registered)</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    Driver #{driver.id} · {driver.vehicle_number || 'Compactor Truck'} · {driver.availability.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <button className="w-full rounded-2xl bg-emerald-600 py-3.5 font-black text-xs text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition disabled:opacity-50" type="button" onClick={() => void assignPickup.mutateAsync()} disabled={!pickupId || !driverId || assignPickup.isPending}>
              {assignPickup.isPending ? 'Assigning Fleet Driver...' : 'Confirm Driver Assignment'}
            </button>
          </div>

          {message ? <p className="rounded-2xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 border border-emerald-200">✅ {message}</p> : null}
          {error ? <p className="rounded-2xl bg-rose-50 p-3.5 text-xs font-bold text-rose-700 border border-rose-200">⚠️ {error}</p> : null}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Waste Stream Distribution
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {(analytics?.waste_distribution ?? []).map((point) => (
                <div key={point.waste_type} className="rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
                  <p className="font-black text-xs text-slate-900 capitalize">{point.waste_type} Waste</p>
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{point.requests} requests</p>
                </div>
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* Recycler Verification Queue */}
      <RecyclerVerificationQueue />

      {/* EPR Credit Ledger & Brand Claim Simulation */}
      <EPRCreditLedgerPanel />

      {/* Compost Batch Tracking */}
      <CompostBatchPanel />

      {/* RWA Admin Approval Queue */}
      <RWAAdminApprovalQueue />
    </section>
  );
}
