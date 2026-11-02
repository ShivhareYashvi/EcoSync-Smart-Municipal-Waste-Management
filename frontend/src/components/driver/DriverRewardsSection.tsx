import React, { useState } from 'react';
import {
  Award,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Clock,

  Zap,
  Heart,
  CreditCard,
  Building2,
  Gift,
  Star,
  Flame,
} from 'lucide-react';

interface DriverRewardsSectionProps {
  driverName?: string;
  driverCode?: string;
  vehiclePlate?: string;
  wardNumber?: string;
  completedStopsToday?: number;
  totalAssignedStops?: number;
}

export const DriverRewardsSection: React.FC<DriverRewardsSectionProps> = ({
  driverName = 'Dileep Ahirwar',
  driverCode = 'BMC-DRV-042',
  vehiclePlate = 'MP-04-GB-2184',
  wardNumber = 'Ward 48 (Arera Colony)',
  completedStopsToday = 14,
  totalAssignedStops = 18,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'welfare' | 'roadmap'>('overview');

  // Simulated live driver metrics aligned with Bhopal Swachhata Mitra model
  const onTimeStreakDays = 14;
  const verificationAccuracy = 98.4;
  const todayBonus = 50 + completedStopsToday * 10; // ₹50 route completion + ₹10/stop verified
  const monthlyIncentive = 3850;
  const citizenRating = 4.9;
  const ratingCount = 348;

  return (
    <div className="space-y-6">
      {/* ── Top Header / Swachhata Mitra Profile Strip ────────────── */}
      <div className="rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-900 via-[#006B4F] to-[#009B70] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle Decorative Background Circles */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute top-0 right-1/3 h-32 w-32 rounded-full bg-emerald-400/10 blur-xl" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-white border border-white/20">
                <Award className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                <span>Master Swachhata Mitra · Tier 4</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2.5 py-1 text-xs font-bold text-emerald-200">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                <span>BMC Certified Driver</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {driverName}
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100 flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Staff Code: <strong className="text-white">{driverCode}</strong></span>
              <span>&bull;</span>
              <span>Vehicle: <strong className="text-white">{vehiclePlate}</strong></span>
              <span>&bull;</span>
              <span>Assigned: <strong className="text-white">{wardNumber}</strong></span>
            </p>
          </div>

          {/* Citizen Star Rating Pill */}
          <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-4 text-center shrink-0 min-w-[160px]">
            <div className="flex items-center justify-center gap-1 text-amber-300">
              <Star className="h-5 w-5 fill-amber-300" aria-hidden="true" />
              <span className="text-2xl font-black text-white">{citizenRating}</span>
              <span className="text-xs text-emerald-200 font-bold">/ 5.0</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-100 mt-1">
              Based on {ratingCount} resident reviews
            </p>
          </div>
        </div>

        {/* Quick Ticker Cards Inside Header */}
        <div className="mt-6 pt-6 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl bg-black/20 p-3.5 text-center">
            <span className="text-2xl sm:text-3xl font-black text-amber-300">
              ₹{todayBonus}
            </span>
            <p className="text-[11px] font-bold text-emerald-100 mt-0.5">Today's Earned Bonus</p>
          </div>

          <div className="rounded-2xl bg-black/20 p-3.5 text-center">
            <span className="text-2xl sm:text-3xl font-black text-white">
              ₹{monthlyIncentive}
            </span>
            <p className="text-[11px] font-bold text-emerald-100 mt-0.5">Oct Monthly Incentive</p>
          </div>

          <div className="rounded-2xl bg-black/20 p-3.5 text-center">
            <span className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-1">
              <Flame className="h-6 w-6 text-amber-400 fill-amber-400" />
              {onTimeStreakDays}d
            </span>
            <p className="text-[11px] font-bold text-emerald-100 mt-0.5">On-Time Sweep Streak</p>
          </div>

          <div className="rounded-2xl bg-black/20 p-3.5 text-center">
            <span className="text-2xl sm:text-3xl font-black text-emerald-300">
              {verificationAccuracy}%
            </span>
            <p className="text-[11px] font-bold text-emerald-100 mt-0.5">Weighment Accuracy</p>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'overview'
              ? 'bg-[#101828] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Incentive Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('breakdown')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'breakdown'
              ? 'bg-[#101828] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Earning Rules &amp; Tier Formula
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('welfare')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'welfare'
              ? 'bg-[#101828] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Welfare &amp; Direct Bank Transfer (DBT)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('roadmap')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            activeTab === 'roadmap'
              ? 'bg-[#009B70] text-white shadow-xs'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          Coming Soon Features
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ───────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Today's Live Shift Bonus Progress */}
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Today's Shift Bonus Progress</h3>
                  <p className="text-xs text-slate-500">Morning Shift (07:00 AM – 11:30 AM)</p>
                </div>
                <span className="rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-black">
                  +₹{todayBonus} earned
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Route On-Time Departure &amp; Sweep
                  </span>
                  <span className="font-bold text-emerald-700">₹50.00 (Achieved)</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Verified Digital Weighments ({completedStopsToday}/{totalAssignedStops} stops)
                  </span>
                  <span className="font-bold text-emerald-700">₹{completedStopsToday * 10}.00</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Shift Completion &amp; MRF Unloading
                  </span>
                  <span className="font-bold text-slate-400">Pending final weighment</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Shift Route Completion</span>
                  <span className="font-bold text-slate-800">
                    {totalAssignedStops > 0 ? Math.round((completedStopsToday / totalAssignedStops) * 100) : 0}%
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-300"
                    style={{
                      width: `${totalAssignedStops > 0 ? (completedStopsToday / totalAssignedStops) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </article>

            {/* Resident Commendations Feed */}
            <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Resident Commendations</h3>
                  <p className="text-xs text-slate-500">Citizen feedback from Ward 48</p>
                </div>
                <span className="rounded-xl bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-black flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  Top Rated
                </span>
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <strong className="text-slate-800">Sunita Deshmukh (Arera Colony E-3)</strong>
                    <span>Yesterday</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "Dileep bhaiya always arrives right on time at 7:30 AM and ensures both wet and dry bins are weighed carefully. Wonderful dedication!"
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <strong className="text-slate-800">Pradeep Saxena (Ward 48 RWA)</strong>
                    <span>3 days ago</span>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "Zero spillages during doorstep tipping. Very polite and guided residents on separating domestic hazardous waste."
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      )}

      {/* ── TAB 2: EARNING RULES & TIER FORMULA ───────────────────── */}
      {activeTab === 'breakdown' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Bhopal Municipal Corporation &middot; Driver Incentive Structure
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Transparent, performance-linked pay designed to reward punctuality, meticulous digital weighment, and zero-contamination collection.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-sm">
                ₹50
              </span>
              <h4 className="text-sm font-bold text-slate-900">On-Time Sweep Bonus</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Paid per shift when morning route starts by 07:15 AM and finishes within the standard SLA window.
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-sm">
                ₹10
              </span>
              <h4 className="text-sm font-bold text-slate-900">Verified Scale Log</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Awarded for every doorstep pickup where Bluetooth scale tare weight and waste stream photo are captured cleanly.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white font-black text-sm">
                ₹150
              </span>
              <h4 className="text-sm font-bold text-slate-900">Green Speed &amp; VRP Fuel</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Weekly eco-driving bonus for maintaining vehicle speeds within 15–25 km/h with low idling emissions.
              </p>
            </div>

            <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-black text-sm">
                ₹500
              </span>
              <h4 className="text-sm font-bold text-slate-900">Ward Champion Bonus</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Monthly reward awarded when assigned ward achieves ≥85% segregation compliance without citizen grievances.
              </p>
            </div>
          </div>

          {/* Tier Progression */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Swachhata Mitra Career Progression
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-slate-800">Tier 1: Trainee</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Base salary + standard scale log</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-slate-800">Tier 2: Certified Mitra</span>
                <p className="text-[11px] text-slate-500 mt-0.5">100+ clean routes, ₹150 weekly bonus</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <span className="font-bold text-slate-800">Tier 3: Route Lead</span>
                <p className="text-[11px] text-slate-500 mt-0.5">300+ clean routes, 1.1x incentive multiplier</p>
              </div>
              <div className="rounded-xl border border-emerald-300 p-3 bg-emerald-50">
                <span className="font-bold text-emerald-800 flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                  Tier 4: Master Mitra
                </span>
                <p className="text-[11px] text-emerald-700 mt-0.5">Top 5% fleet, 1.25x incentive multiplier</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: WELFARE & DIRECT BANK TRANSFER ─────────────────── */}
      {activeTab === 'welfare' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Welfare, Healthcare &amp; Direct Benefit Transfer
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Disbursements are deposited directly into your verified bank account on the 5th of every month.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 px-3.5 py-1 text-xs font-bold shrink-0">
              <ShieldCheck className="h-4 w-4" />
              <span>DBT Verified</span>
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Bank details card */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-700" />
                Linked Bank Account (Direct Transfer)
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Bank: <strong>State Bank of India &middot; T.T. Nagar Branch</strong></p>
                <p>Account Holder: <strong>Dileep Ahirwar</strong></p>
                <p>Account Number: <strong className="font-mono">•••• •••• 4892</strong></p>
                <p>IFSC: <strong className="font-mono">SBIN0001053</strong></p>
                <p>UPI ID: <strong className="font-mono">dileep.ahirwar@sbi</strong></p>
              </div>
              <div className="pt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Next Payout Scheduled: <strong>Nov 5, 2026 (₹3,850 Incentive)</strong>
              </div>
            </div>

            {/* Medical Insurance & Protection */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Heart className="h-4 w-4 text-rose-600" />
                Municipal Health &amp; ESIC Coverage
              </h4>
              <div className="space-y-1.5 text-xs text-slate-700">
                <p>Policy: <strong>Swachhata Mitra Suraksha Bima Scheme</strong></p>
                <p>Health Coverage: <strong>₹5,00,000 Cashless Hospitalization</strong></p>
                <p>Coverage Status: <strong className="text-emerald-700">Active &middot; Valid till Dec 2027</strong></p>
                <p>Tetanus &amp; Hepatitis Vaccination: <strong className="text-emerald-700">Up to date (Aug 2026)</strong></p>
              </div>
              <div className="pt-2 text-[11px] text-blue-700 font-semibold flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" />
                Designated Hospital: <strong>AIIMS Bhopal &amp; Hamidia Hospital</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: COMING SOON ROADMAP ────────────────────────────── */}
      {activeTab === 'roadmap' && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Upcoming Driver Features &amp; Payout Enhancements
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Exciting technologies and immediate financial tools currently in pilot development for Bhopal's municipal fleet.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Pilot Q1 2027
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Instant Daily UPI Wallet Payout</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cash out your verified daily pickup incentives instantly at the end of your shift directly into PhonePe, Google Pay, or Paytm.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Coins className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  In Development
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Solar EV Hub Battery Swap Credits</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Earn additional loyalty reward points when swapping battery packs at Bhopal Smart City solar micro-grids during off-peak hours.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Award className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Pilot Stage
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Mayor's Swachhata Championship</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Top 3 drivers with highest monthly collection accuracy receive a ₹10,000 cash grant and public felicitation on Republic Day.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                  <Gift className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Announced
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Mitra Children Education Scholarship</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Annual educational support of ₹12,000 for children of Swachhata Mitras maintaining &gt;95% punctuality and attendance records.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
