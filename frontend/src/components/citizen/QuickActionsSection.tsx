import React from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  Navigation,
  Sparkles,
  TrendingUp,
  MessageSquarePlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsProps {
  onScheduleClick: () => void;
  onOpenMissedPickup: () => void;
  onNavigateTab: (tab: string, subOption?: string) => void;
}

export const QuickActionsSection: React.FC<QuickActionsProps> = ({
  onScheduleClick,
  onOpenMissedPickup,
  onNavigateTab,
}) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'schedule',
      label: 'Request Waste Pickup',
      description: 'Book doorstep segregated waste collection',
      icon: CalendarPlus,
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100',
      iconColor: 'text-emerald-700',
      onClick: onScheduleClick,
    },
    {
      id: 'track',
      label: 'Track Waste Vehicle',
      description: 'Check live GPS location & arrival ETA',
      icon: Navigation,
      color: 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100',
      iconColor: 'text-blue-700',
      onClick: () => {
        const el = document.getElementById('live-tracking-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'missed',
      label: 'Report Missed Pickup',
      description: 'Notify municipal ward inspector immediately',
      icon: AlertTriangle,
      color: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100',
      iconColor: 'text-rose-700',
      onClick: onOpenMissedPickup,
    },
    {
      id: 'sell',
      label: 'Sell Scrap & Recyclables',
      description: 'Request scrap pickup for cash/EPR receipts',
      icon: Sparkles,
      color: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100',
      iconColor: 'text-purple-700',
      onClick: () => onNavigateTab('marketplace'),
    },
    {
      id: 'rates',
      label: 'View Scrap Rates',
      description: 'Live Bhopal CPCB market prices per kg',
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100',
      iconColor: 'text-amber-700',
      onClick: () => navigate('/rates'),
    },
    {
      id: 'grievance',
      label: 'Submit Civic Grievance',
      description: 'Lodge sanitary or garbage accumulation issue',
      icon: MessageSquarePlus,
      color: 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100',
      iconColor: 'text-teal-700',
      onClick: () => onNavigateTab('community', 'submit'),
    },
  ];

  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="quick-actions-heading" className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Quick Municipal Actions
        </h2>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
          One-click citizen civic services
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className={`flex items-start gap-3.5 rounded-2xl border p-4 text-left transition focus-visible:ring-2 focus-visible:ring-emerald-600 min-h-[72px] ${act.color}`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200/60">
                <Icon className={`h-5 w-5 ${act.iconColor}`} aria-hidden="true" />
              </span>
              <div className="flex flex-col">
                <span className="font-extrabold text-slate-900 text-sm leading-tight">
                  {act.label}
                </span>
                <span className="text-xs text-slate-600 mt-1 leading-normal font-medium">
                  {act.description}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};

