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
  User as UserIcon
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Complaint } from '../../lib/types';

interface DriverMissedPickupQueueProps {
  driverWard?: string | null;
  driverId?: number | null;
}

export const DriverMissedPickupQueue: React.FC<DriverMissedPickupQueueProps> = ({
  driverWard,
}) => {
  const queryClient = useQueryClient();
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch all complaints
  const { data: complaints = [], isLoading, refetch } = useQuery<Complaint[]>({
    queryKey: ['driver-complaints-missed'],
    queryFn: async () => {
      const res = await api.get<Complaint[]>('/complaints');
      return res.data;
    },
    refetchInterval: 30000, // auto-refresh every 30 seconds
  });

  // Filter for open missed pickups
  const missedPickups = useMemo(() => {
    return complaints.filter(
      (c) =>
        c.category === 'missed_pickup' &&
        c.status !== 'resolved' &&
        c.status !== 'rejected'
    );
  }, [complaints]);

  // Mutation to resolve a missed pickup
  const resolveMutation = useMutation({
    mutationFn: async (complaintId: number) => {
      setResolvingId(complaintId);
      const res = await api.patch<Complaint>(`/complaints/${complaintId}/status`, {
        status: 'resolved',
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Missed collection reroute resolved & logged in BMC records!');
      setTimeout(() => setSuccessMsg(null), 4000);
      void queryClient.invalidateQueries({ queryKey: ['driver-complaints-missed'] });
      void queryClient.invalidateQueries({ queryKey: ['driver-pickups'] });
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

  return (
    <div className="space-y-4">
      {/* Alert Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-slate-950 p-5 text-white border border-rose-500/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-600/30 text-rose-300 border border-rose-500/40 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white">
                Emergency Missed Collection Reroutes
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white">
                24-Hour SLA
              </span>
            </div>
            <p className="text-xs text-rose-200 mt-0.5">
              Citizen-reported uncollected gates in Bhopal. Mandatory 24-hour resolution under BMC Swachhata charter.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-white border border-white/10">
            {missedPickups.length} Active {missedPickups.length === 1 ? 'Alert' : 'Alerts'}
          </span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="p-2 rounded-xl bg-white/10 text-rose-200 hover:text-white hover:bg-white/20 transition"
            title="Refresh missed alerts queue"
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

      {/* Empty State */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto text-slate-400 mb-2" />
          <span>Checking BMC missed sweep alerts...</span>
        </div>
      ) : missedPickups.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">All Scheduled Sweeps Serviced</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Zero pending missed collection complaints in your jurisdiction. Excellent municipal route coverage!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missedPickups.map((complaint) => {
            const sla = getSlaDetails(complaint.created_at);
            const residentName = complaint.user_name || 'Resident';
            const residentPhone = complaint.user_phone || null;
            const residentWard = complaint.ward_number || driverWard || 'Ward 25';
            const residentAddr = complaint.user_address || 'Registered Household Gate';

            return (
              <div
                key={complaint.id}
                className={`rounded-3xl border bg-white p-5 space-y-4 shadow-sm transition ${
                  sla.isOverdue
                    ? 'border-rose-400 ring-1 ring-rose-400'
                    : sla.isCritical
                    ? 'border-amber-400 ring-1 ring-amber-300'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700">
                        #{complaint.id}
                      </span>
                      <span className="text-xs font-black text-slate-900 flex items-center gap-1">
                        <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                        {residentName}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {residentWard}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 flex items-start gap-1 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{residentAddr}</span>
                    </p>
                  </div>

                  {/* Call Resident Action */}
                  {residentPhone && (
                    <a
                      href={`tel:${residentPhone}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-300 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shrink-0"
                      title="Call resident before gate arrival"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Call</span>
                    </a>
                  )}
                </div>

                {/* 24-Hour SLA Timeline Progress */}
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      24h SLA Countdown
                    </span>

                    {sla.isOverdue ? (
                      <span className="font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-300 animate-pulse text-[11px]">
                        ⚠️ OVERDUE ({Math.abs(sla.remainingHours)}h past deadline)
                      </span>
                    ) : sla.isCritical ? (
                      <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 text-[11px]">
                        🚨 CRITICAL: {sla.remainingHours}h remaining
                      </span>
                    ) : (
                      <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
                        ⏱️ Active: {sla.remainingHours}h remaining
                      </span>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        sla.isOverdue
                          ? 'bg-rose-600'
                          : sla.isCritical
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${sla.progressPercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span>Logged {sla.elapsedHours}h ago</span>
                    <span>24h Resolution Window</span>
                  </div>
                </div>

                {/* Complaint Details */}
                <div className="text-xs text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100 space-y-1">
                  <p className="font-medium leading-relaxed line-clamp-3">
                    {complaint.description}
                  </p>
                  {complaint.image && (
                    <div className="pt-2">
                      <a
                        href={complaint.image.startsWith('http') ? complaint.image : `http://localhost:8000/uploads/${complaint.image}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:underline"
                      >
                        <span>📷 View Resident Gate Photo</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Action: Clear & Mark Resolved */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Status: <strong className="capitalize text-slate-800">{complaint.status}</strong>
                  </span>

                  <button
                    type="button"
                    disabled={resolvingId === complaint.id}
                    onClick={() => resolveMutation.mutate(complaint.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition shadow-sm disabled:opacity-50"
                  >
                    {resolvingId === complaint.id ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    <span>{resolvingId === complaint.id ? 'Resolving...' : 'Complete Reroute & Resolve'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

