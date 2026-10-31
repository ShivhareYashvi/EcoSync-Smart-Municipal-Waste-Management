import React from 'react';
import { Truck, Gift, Navigation, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ServiceOverviewProps {
  upcomingCount: number;
  rewardPoints: number;
  vehicleStatusText: string;
  vehicleIsActive: boolean;
  openComplaintsCount: number;
  onNavigateTab: (tab: string) => void;
}

export const ServiceOverviewSection: React.FC<ServiceOverviewProps> = ({
  upcomingCount,
  rewardPoints,
  vehicleStatusText,
  vehicleIsActive,
  openComplaintsCount,
  onNavigateTab,
}) => {
  return (
    <section aria-labelledby="service-overview-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 id="service-overview-heading" className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
          Service Overview & Civic Metrics
        </h2>
        <span className="text-xs text-slate-500 font-medium hidden sm:inline-block">
          Live sync with BMC central operations
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Upcoming Pickups */}
        <article
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 flex flex-col justify-between"
          aria-label={`Upcoming Doorstep Pickups: ${upcomingCount} collection requests scheduled`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
                <span>Scheduled</span>
              </span>
            </div>
            <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Upcoming Pickups
            </h3>
            <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {upcomingCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Doorstep waste collections scheduled this week.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('history')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md p-1 -m-1"
            >
              View Pickup Schedule &rarr;
            </button>
          </div>
        </article>

        {/* Card 2: Reward Points */}
        <article
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 flex flex-col justify-between"
          aria-label={`CPCB Circular Economy Reward Points: ${rewardPoints} points available`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <Gift className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
                <span>CPCB Tier</span>
              </span>
            </div>
            <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Reward Points
            </h3>
            <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {rewardPoints} <span className="text-base font-semibold text-slate-500">pts</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Earned via verified waste segregation.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('rewards')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md p-1 -m-1"
            >
              Redeem Catalog Vouchers &rarr;
            </button>
          </div>
        </article>

        {/* Card 3: Vehicle Collection Status */}
        <article
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 flex flex-col justify-between"
          aria-label={`Municipal Collection Vehicle Status: ${vehicleStatusText}`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <Navigation className="h-5 w-5" aria-hidden="true" />
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold border ${
                  vehicleIsActive
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${vehicleIsActive ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`}
                  aria-hidden="true"
                />
                <span>{vehicleIsActive ? 'Live GPS' : 'Depot'}</span>
              </span>
            </div>
            <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Vehicle Telemetry
            </h3>
            <p className="text-lg font-black text-slate-900 mt-1 truncate">
              {vehicleStatusText}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Dedicated BMC Ward Tipper GPS Feed.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <a
              href="#live-tracking-section"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md p-1 -m-1"
            >
              Track on Map &rarr;
            </a>
          </div>
        </article>

        {/* Card 4: Open Civic Grievances */}
        <article
          className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition hover:border-slate-300 flex flex-col justify-between"
          aria-label={`Open Civic Grievances: ${openComplaintsCount} active tickets`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                <span>BMC SLA</span>
              </span>
            </div>
            <h3 className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-500">
              Civic Grievances
            </h3>
            <p className="text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
              {openComplaintsCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Open complaints undergoing municipal review.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onNavigateTab('community')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-md p-1 -m-1"
            >
              Manage Grievances &rarr;
            </button>
          </div>
        </article>
      </div>
    </section>
  );
};

