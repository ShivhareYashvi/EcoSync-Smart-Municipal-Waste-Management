import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../lib/api';
import type { CityWideAnalytics, ComplaintHotspot } from '../../lib/types';
import { AlertTriangle, CheckCircle2, Clock, TrendingUp, Zap } from 'lucide-react';
import { ComplaintHeatmapMap } from '../../components/admin/ComplaintHeatmapMap';

//  tiny helpers 

interface ZoneSLARead {
  zone_id: number;
  zone_name: string;
  avg_resolution_hours: number | null;
  open_complaints: number;
  overdue_complaints: number;
}

const ZONE_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6'];

function KPIBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className={`rounded-2xl px-5 py-4 text-white`} style={{ background: color }}>
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-80 uppercase tracking-widest">{label}</p>
    </div>
  );
}

export function ZoneAnalyticsDashboard() {
  const analyticsQuery = useQuery({
    queryKey: ['zone-analytics'],
    queryFn: async () => {
      const r = await api.get<CityWideAnalytics>('/analytics/zones');
      return r.data;
    },
    refetchInterval: 60_000,
  });

  const hotspotQuery = useQuery({
    queryKey: ['complaint-hotspots', 'active'],
    queryFn: async () => {
      const r = await api.get<ComplaintHotspot[]>('/complaints/hotspots?active_only=true');
      return r.data;
    },
    refetchInterval: 60_000,
  });

  const slaQuery = useQuery({
    queryKey: ['complaint-sla'],
    queryFn: async () => {
      const r = await api.get<ZoneSLARead[]>('/complaints/sla');
      return r.data;
    },
    refetchInterval: 60_000,
  });

  const analytics = analyticsQuery.data;
  const hotspots = hotspotQuery.data ?? [];
  const slaData = slaQuery.data ?? [];
  const zones = analytics?.zones ?? [];

  // Aggregate city-level KPIs
  const totalKg = zones.reduce((acc, z) => acc + z.total_kg_collected, 0);
  const avgCompliance =
    zones.length > 0
      ? (zones.reduce((acc, z) => acc + z.segregation_compliance_pct, 0) / zones.length).toFixed(1)
      : '—';
  const totalOverdue = slaData.reduce((acc, s) => acc + s.overdue_complaints, 0);
  const activeHotspots = hotspots.length;

  // Recharts data
  const complianceData = zones.map((z) => ({
    name: z.zone_name.replace(' Ward', ''),
    compliance: z.segregation_compliance_pct,
    missed: z.missed_pickup_rate_pct,
    kg: z.total_kg_collected,
  }));

  const radialData = zones.map((z, i) => ({
    name: z.zone_name.replace(' Ward', ''),
    value: z.segregation_compliance_pct,
    fill: ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  if (analyticsQuery.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <section className="grid gap-6">
      {/* City KPI strip */}
      <div>
        <h2 className="text-2xl font-black text-slate-900">Zone Analytics Dashboard</h2>
        <p className="mt-1 text-sm text-slate-500">
          {analytics?.city ?? 'City'} — city-wide operational KPIs
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPIBadge value={`${avgCompliance}%`} label="Avg. Segregation" color="#10b981" />
        <KPIBadge value={`${totalKg.toFixed(0)} kg`} label="Total Collected" color="#06b6d4" />
        <KPIBadge value={String(totalOverdue)} label="Overdue Complaints" color={totalOverdue > 0 ? '#ef4444' : '#64748b'} />
        <KPIBadge value={String(activeHotspots)} label="Active Hotspots" color={activeHotspots > 0 ? '#f59e0b' : '#64748b'} />
      </div>

      {/* Spatial Geospatial Heatmap Layer */}
      <ComplaintHeatmapMap />

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Segregation & missed pickup bar chart */}
        <article className="glass-card rounded-[2rem] p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            <TrendingUp className="mr-2 inline h-5 w-5 text-emerald-500" />
            Segregation Compliance &amp; Missed Pickups per Zone
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={complianceData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
              <Tooltip formatter={(v: number, name: string) => [`${v}%`, name]} />
              <Legend />
              <Bar dataKey="compliance" name="Compliance %" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="missed" name="Missed %" fill="#f43f5e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </article>

        {/* Radial compliance */}
        <article className="glass-card rounded-[2rem] p-6">
          <h3 className="mb-4 text-lg font-bold text-slate-900">
            <Zap className="mr-2 inline h-5 w-5 text-cyan-500" />
            Per-Zone Compliance Score
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart
              innerRadius="20%"
              outerRadius="90%"
              data={radialData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                label={{ fill: '#475569', fontSize: 10, position: 'insideStart' }}
                background
                dataKey="value"
              />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Compliance']} />
              <Legend iconSize={10} />
            </RadialBarChart>
          </ResponsiveContainer>
        </article>
      </div>

      {/* SLA table */}
      <article className="glass-card rounded-[2rem] p-6">
        <h3 className="mb-4 text-lg font-bold text-slate-900">
          <Clock className="mr-2 inline h-5 w-5 text-violet-500" />
          Complaint SLA by Zone
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                <th className="pb-3 pr-4">Zone</th>
                <th className="pb-3 pr-4">Open</th>
                <th className="pb-3 pr-4 text-rose-600">Overdue</th>
                <th className="pb-3">Avg. Resolution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {slaData.map((row) => (
                <tr key={row.zone_id} className="hover:bg-white/60">
                  <td className="py-3 pr-4 font-semibold text-slate-800">{row.zone_name}</td>
                  <td className="py-3 pr-4 text-slate-600">{row.open_complaints}</td>
                  <td className={`py-3 pr-4 font-bold ${row.overdue_complaints > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {row.overdue_complaints}
                  </td>
                  <td className="py-3 text-slate-600">
                    {row.avg_resolution_hours != null
                      ? `${row.avg_resolution_hours.toFixed(1)} hrs`
                      : '—'}
                  </td>
                </tr>
              ))}
              {slaData.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    No complaint data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {/* Hotspot list */}
      <article className="glass-card rounded-[2rem] p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-900">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Active Complaint Hotspots
        </h3>
        {hotspots.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
            <CheckCircle2 className="h-10 w-10 text-emerald-400" />
            <p>No active hotspots — all zones are within threshold</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotspots.map((hs) => (
              <div
                key={hs.id}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
              >
                <p className="font-bold text-amber-800">{hs.zone_name ?? `Zone #${hs.zone_id}`}</p>
                <p className="mt-1 text-sm text-amber-700">{hs.complaint_count} complaints in 30 days</p>
                <p className="mt-1 text-xs text-amber-500">
                  Flagged {new Date(hs.first_flagged_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
}
