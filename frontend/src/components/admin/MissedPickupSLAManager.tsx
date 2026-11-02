import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  RefreshCw,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Complaint } from '../../lib/types';

export const MissedPickupSLAManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'overdue'>('open');

  // Fetch all complaints
  const { data: complaints = [], isLoading, refetch } = useQuery<Complaint[]>({
    queryKey: ['admin-complaints'],
    queryFn: async () => {
      const res = await api.get<Complaint[]>('/complaints');
      return res.data;
    },
    refetchInterval: 30000,
  });

  // Calculate 24-hour SLA details
  const getSlaDetails = (createdAtStr: string) => {
    const createdTime = new Date(createdAtStr).getTime();
    const now = Date.now();
    const elapsedHours = (now - createdTime) / (1000 * 60 * 60);
    const remainingHours = 24 - elapsedHours;
    const isOverdue = remainingHours <= 0;
    const isCritical = !isOverdue && remainingHours < 6;
    const progressPercent = Math.min(100, Math.max(0, (elapsedHours / 24) * 100));

    return {
      elapsedHours: Math.max(0, Math.round(elapsedHours * 10) / 10),
      remainingHours: Math.round(remainingHours * 10) / 10,
      isOverdue,
      isCritical,
      progressPercent,
    };
  };

  // Filter missed pickups
  const missedPickups = useMemo(() => {
    return complaints.filter((c) => c.category === 'missed_pickup');
  }, [complaints]);

  const activeMissedPickups = useMemo(() => {
    return missedPickups.filter((c) => c.status !== 'resolved' && c.status !== 'rejected');
  }, [missedPickups]);

  const displayedPickups = useMemo(() => {
    if (filterStatus === 'all') return missedPickups;
    if (filterStatus === 'overdue') {
      return activeMissedPickups.filter((c) => getSlaDetails(c.created_at).isOverdue);
    }
    return activeMissedPickups;
  }, [missedPickups, activeMissedPickups, filterStatus]);

  // Mutation to resolve complaint
  const resolveMutation = useMutation({
    mutationFn: async (complaintId: number) => {
      setResolvingId(complaintId);
      const res = await api.patch<Complaint>(`/complaints/${complaintId}/status`, {
        status: 'resolved',
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Missed pickup ticket marked as Resolved in BMC database.');
      setTimeout(() => setSuccessMsg(null), 4000);
      void queryClient.invalidateQueries({ queryKey: ['admin-complaints'] });
      void queryClient.invalidateQueries({ queryKey: ['analytics-summary'] });
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to update ticket status.';
      setErrorMsg(String(msg));
    },
    onSettled: () => {
      setResolvingId(null);
    },
  });

  const overdueCount = activeMissedPickups.filter((c) => getSlaDetails(c.created_at).isOverdue).length;

  return (
    <article className="glass-card rounded-[2rem] p-6 sm:p-7 shadow-sm space-y-5 border border-slate-200/80">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h2 className="text-xl font-black text-slate-950">
              Missed Sweep SLA &amp; Grievance Escalations
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300">
              24-Hour Municipal SLA
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Bhopal citizen-reported missed waste collections with automated 24-hour SLA countdown tracking.
          </p>
        </div>

        {/* Filter buttons & Refresh */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterStatus('open')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'open'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({activeMissedPickups.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('overdue')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                filterStatus === 'overdue'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-rose-700 hover:text-rose-900'
              }`}
            >
              <span>Overdue ({overdueCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg transition ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({missedPickups.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() => void refetch()}
            className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition"
            title="Refresh complaints"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
          <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* SLA Status Counter Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Active Missed Sweeps
          </span>
          <p className="text-2xl font-black text-slate-900 mt-0.5">{activeMissedPickups.length}</p>
          <span className="text-[11px] text-slate-500">Awaiting auxiliary driver resolution</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block">
            SLA Breached (&gt;24 Hours)
          </span>
          <p className="text-2xl font-black text-rose-600 mt-0.5">{overdueCount}</p>
          <span className="text-[11px] text-rose-700">Immediate supervisor intervention required</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
            Resolved This Week
          </span>
          <p className="text-2xl font-black text-emerald-700 mt-0.5">
            {missedPickups.filter((c) => c.status === 'resolved').length}
          </p>
          <span className="text-[11px] text-emerald-800">Closed within 24h municipal target</span>
        </div>
      </div>

      {/* Table or Cards List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
          <span>Loading municipal grievance queue...</span>
        </div>
      ) : displayedPickups.length === 0 ? (
        <div className="py-12 text-center bg-slate-50/50 rounded-2xl border border-slate-200 p-6 space-y-2">
          <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
          <h4 className="text-sm font-bold text-slate-900">No Missed Sweep Escalations</h4>
          <p className="text-xs text-slate-500">
            {filterStatus === 'overdue'
              ? 'Zero tickets have breached the 24-hour SLA threshold!'
              : 'All citizen-reported collections have been resolved by auxiliary teams.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedPickups.map((complaint) => {
            const sla = getSlaDetails(complaint.created_at);
            const residentName = complaint.user_name || 'Resident';
            const residentPhone = complaint.user_phone || null;
            const residentWard = complaint.ward_number || 'Ward 25';
            const residentAddr = complaint.user_address || 'Registered Gate';

            return (
              <div
                key={complaint.id}
                className={`p-4 rounded-2xl border bg-white shadow-2xs space-y-3 transition ${
                  sla.isOverdue && complaint.status !== 'resolved'
                    ? 'border-rose-300 bg-rose-50/20 ring-1 ring-rose-300'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        #{complaint.id}
                      </span>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                        {residentName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {residentWard}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          complaint.status === 'resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sla.isOverdue
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {complaint.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold">{residentAddr}</span>
                    </p>
                  </div>

                  {/* SLA Countdown Badge & Contact */}
                  <div className="flex flex-wrap items-center gap-2">
                    {residentPhone && (
                      <a
                        href={`tel:${residentPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:text-emerald-700 text-xs font-bold transition"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        <span>{residentPhone}</span>
                      </a>
                    )}

                    {complaint.status === 'resolved' ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        Resolved
                      </span>
                    ) : sla.isOverdue ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-black shadow-xs">
                        <Clock className="h-3.5 w-3.5" />
                        SLA Breached ({Math.abs(sla.remainingHours)}h ago)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold">
                        <Clock className="h-3.5 w-3.5 text-amber-600" />
                        {sla.remainingHours}h remaining (24h SLA)
                      </span>
                    )}

                    {complaint.status !== 'resolved' && (
                      <button
                        type="button"
                        disabled={resolvingId === complaint.id}
                        onClick={() => resolveMutation.mutate(complaint.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50"
                      >
                        {resolvingId === complaint.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                        <span>{resolvingId === complaint.id ? 'Resolving...' : 'Mark Resolved'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar and details */}
                <div className="p-3 bg-slate-50/80 rounded-xl text-xs space-y-2 border border-slate-100">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Reported: {new Date(complaint.created_at).toLocaleString()} ({sla.elapsedHours}h ago)
                    </span>
                    <span>24-Hour Municipal Resolution Window</span>
                  </div>

                  <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        complaint.status === 'resolved'
                          ? 'bg-emerald-500'
                          : sla.isOverdue
                          ? 'bg-rose-600'
                          : sla.isCritical
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${complaint.status === 'resolved' ? 100 : sla.progressPercent}%` }}
                    />
                  </div>

                  <p className="text-slate-700 font-medium leading-relaxed">
                    {complaint.description}
                  </p>

                  {complaint.image && (
                    <div className="pt-1">
                      <a
                        href={complaint.image.startsWith('http') ? complaint.image : `http://localhost:8000/uploads/${complaint.image}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline"
                      >
                        <span>📷 View Resident Uploaded Gate Photo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
};

