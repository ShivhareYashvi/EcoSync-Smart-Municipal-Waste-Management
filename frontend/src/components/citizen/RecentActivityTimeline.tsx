import React from 'react';
import { CheckCircle2, Clock, Gift, AlertCircle, Calendar } from 'lucide-react';
import type { Pickup, Complaint, Reward } from '../../lib/types';
import { formatPickupCode } from '../../pages/user/UserDashboard';

interface RecentActivityTimelineProps {
  pickups: Pickup[];
  complaints: Complaint[];
  rewards: Reward[];
  onNavigateTab: (tab: string) => void;
}

type TimelineItem = {
  id: string;
  type: 'pickup' | 'complaint' | 'reward';
  title: string;
  subtitle: string;
  date: string;
  timestamp: number;
  statusBadge: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    className: string;
  };
};

export const RecentActivityTimeline: React.FC<RecentActivityTimelineProps> = ({
  pickups,
  complaints,
  rewards,
  onNavigateTab,
}) => {
  // Aggregate items into a unified chronological stream
  const items: TimelineItem[] = [];

  // 1. Pickups
  pickups.slice(0, 5).forEach((p) => {
    const isCompleted = p.status === 'completed';
    const isAssigned = p.status === 'assigned' || p.status === 'in_progress';
    items.push({
      id: `pickup-${p.id}`,
      type: 'pickup',
      title: `${p.waste_type.toUpperCase()} Waste Collection · [${formatPickupCode(p.id)}]`,
      subtitle: p.notes?.includes('[BMC Auto-Dispatch]')
        ? p.notes.split('[BMC Auto-Dispatch]')[1].trim().replace(/^·\s*/, '')
        : `Scheduled for ${p.scheduled_date} at ${p.scheduled_time || '09:00 AM'}`,
      date: p.scheduled_date,
      timestamp: new Date(p.scheduled_date).getTime(),
      statusBadge: {
        label: p.status.toUpperCase(),
        icon: isCompleted ? CheckCircle2 : isAssigned ? Clock : Calendar,
        className: isCompleted
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : isAssigned
          ? 'bg-blue-50 text-blue-800 border-blue-200'
          : 'bg-slate-100 text-slate-800 border-slate-200',
      },
    });
  });

  // 2. Complaints
  complaints.slice(0, 3).forEach((c) => {
    const isResolved = c.status === 'resolved';
    items.push({
      id: `complaint-${c.id}`,
      type: 'complaint',
      title: `Civic Grievance: ${c.category.replace('_', ' ').toUpperCase()}`,
      subtitle: c.description || 'Grievance submitted to Bhopal Municipal Health Inspector.',
      date: c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Recent',
      timestamp: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
      statusBadge: {
        label: c.status.toUpperCase(),
        icon: isResolved ? CheckCircle2 : AlertCircle,
        className: isResolved
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-amber-50 text-amber-800 border-amber-200',
      },
    });
  });

  // 3. Rewards
  rewards.slice(0, 3).forEach((r) => {
    items.push({
      id: `reward-${r.id}`,
      type: 'reward',
      title: `+${r.points} CPCB Points Credited`,
      subtitle: `Waste stream verification: ${r.source || 'Segregated Wet/Dry Handover'}`,
      date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recent',
      timestamp: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
      statusBadge: {
        label: 'POINTS MINTED',
        icon: Gift,
        className: 'bg-purple-50 text-purple-800 border-purple-200',
      },
    });
  });

  // Sort descending by timestamp
  items.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <section aria-labelledby="recent-activity-heading" className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h2 id="recent-activity-heading" className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
            Recent Municipal Activity Timeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological ledger of collections, rewards & grievance resolutions
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('history')}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-1"
        >
          View Full Ledger &rarr;
        </button>
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          No recent activity recorded. Schedule your first doorstep waste collection above.
        </div>
      ) : (
        <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
          {items.slice(0, 6).map((item) => {
            const BadgeIcon = item.statusBadge.icon;
            return (
              <div key={item.id} className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="absolute -left-[27px] top-1.5 flex h-4 w-4 rounded-full bg-white ring-4 ring-slate-100 border-2 border-emerald-600" aria-hidden="true" />
                <div className="pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {item.title}
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${item.statusBadge.className}`}>
                      <BadgeIcon className="h-3 w-3" aria-hidden="true" />
                      <span>{item.statusBadge.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.date}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

