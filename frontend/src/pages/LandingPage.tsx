import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Coins,
  Cpu,
  FileCheck,
  Globe2,
  Layers,
  Leaf,
  MapPinned,
  Recycle,
  Scale,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { useSessionStore } from '../store/session';
import { dashboardPathForRole } from '../lib/navigation';

export function LandingPage() {
  const user = useSessionStore((state) => state.user);

  // Interactive Simulator State
  const [selectedCategory, setSelectedCategory] = useState<'wet' | 'dry' | 'hazardous' | 'e_waste'>('dry');
  const [weightKg, setWeightKg] = useState<number>(14.5);
  const [isSegregated, setIsSegregated] = useState<boolean>(true);

  // Dynamic calculations based on points engine formula:
  // Base 50 + weight bonus min(kg * 5, 50) * 1.25 streak multiplier
  const basePoints = isSegregated ? 50 : 0;
  const weightBonus = isSegregated ? Math.min(Math.round(weightKg * 5), 50) : 0;
  const calculatedPoints = Math.round((basePoints + weightBonus) * 1.25);
  const co2AvoidedKg = (weightKg * (selectedCategory === 'dry' ? 2.4 : selectedCategory === 'wet' ? 1.1 : selectedCategory === 'e_waste' ? 5.2 : 3.8)).toFixed(1);
  const scrapRatePerKg = selectedCategory === 'dry' ? 14.0 : selectedCategory === 'e_waste' ? 88.0 : 0;
  const estScrapPayout = (weightKg * scrapRatePerKg).toFixed(0);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] antialiased selection:bg-emerald-500 selection:text-white">
      {/* ── Top Navigation Bar (Auto-hides on scroll down, reveals on scroll up) ─── */}
      <Navbar mode="public" />

      {/* ── Hero Section ─────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 lg:pt-28 lg:pb-28">
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-10 -z-10 h-72 w-72 rounded-full bg-lime-100/50 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-200 bg-emerald-50/90 px-4 py-1.5 text-xs font-bold text-emerald-800 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Bhopal Municipal Operations Live · 85 Wards Monitored · 96.4% On-Time Completion Today</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.12]">
                Cleaner neighborhoods with{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                  intelligent municipal waste coordination.
                </span>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
                Connecting Bhopal households, municipal collection fleets, and CPCB-certified recycling facilities into a unified, transparent operating network. Featuring real-time GPS route sequencing, doorstep digital weighment logging, and Swachh Bharat circular rewards.
              </p>

              {/* Primary Call-to-Actions */}
              <div className="space-y-4 pt-1">
                <div className="flex flex-wrap items-center gap-4">
                  {user ? (
                    <Link
                      to={dashboardPathForRole(user.role)}
                      className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:-translate-y-0.5"
                    >
                      <span>Open {user.role === 'citizen' ? 'Citizen Console' : `${user.role} Dashboard`}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:-translate-y-0.5"
                    >
                      <span>Schedule Doorstep Pickup</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}

                  <Link
                    to="/price-board"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    <Coins className="h-4 w-4 text-emerald-600" />
                    <span>Live Scrap Price Board</span>
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-1 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    CPCB Legal Metrology Calibrated
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <MapPinned className="h-4 w-4 text-emerald-600" />
                    Sub-Second GPS Fleet Telemetry
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Fast2SMS Driver Dispatch
                  </span>
                </div>
              </div>

              {/* Quick Role Portal Selectors */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Dedicated Municipal Operational Portals:
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Link
                    to="/dashboard/user"
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-500 hover:shadow-md group"
                  >
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                      Citizen Hub
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Pickups & Green Rewards</span>
                  </Link>
                  <Link
                    to="/dashboard/driver"
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-500 hover:shadow-md group"
                  >
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                      Driver PWA
                      <span className="h-2 w-2 rounded-full bg-cyan-500" />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Routes & Offline Logging</span>
                  </Link>
                  <Link
                    to="/dashboard/admin"
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-500 hover:shadow-md group"
                  >
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                      Command Desk
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Fleet Telemetry & Dispatch</span>
                  </Link>
                  <Link
                    to="/dashboard/recycler"
                    className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3.5 text-left transition hover:border-emerald-500 hover:shadow-md group"
                  >
                    <span className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition flex items-center justify-between">
                      Recycler MRF
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                    </span>
                    <span className="text-[11px] text-slate-500 mt-1">Rate Cards & EPR Receipts</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Interactive Simulator Column */}
            <div className="lg:col-span-5">
              <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Doorstep Collection Simulator</h3>
                      <p className="text-[11px] text-slate-600">Simulate weight, rewards & circular impact</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                    {user?.ward_number ? `${user.ward_number} · Bhopal` : 'Ward 48 · Arera Colony Node'}
                  </span>
                </div>

                <div className="mt-5 space-y-5">
                  {/* Category Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Verified Waste Stream
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'wet', label: 'Wet Organic', color: 'border-lime-500 bg-lime-50/60 text-lime-900' },
                        { id: 'dry', label: 'Dry Recyclables', color: 'border-blue-500 bg-blue-50/60 text-blue-900' },
                        { id: 'hazardous', label: 'Domestic Hazardous', color: 'border-rose-500 bg-rose-50/60 text-rose-900' },
                        { id: 'e_waste', label: 'E-Waste', color: 'border-purple-500 bg-purple-50/60 text-purple-900' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedCategory(item.id as any)}
                          className={`rounded-xl border p-2.5 text-xs font-bold transition text-left ${selectedCategory === item.id
                              ? `${item.color} ring-2 ring-emerald-500/20 shadow-sm`
                              : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Weight Slider */}
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Collected Weight
                      </label>
                      <span className="text-sm font-black text-emerald-600 tabular-nums">
                        {weightKg.toFixed(1)} kg
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      step="0.5"
                      value={weightKg}
                      onChange={(e) => setWeightKg(parseFloat(e.target.value))}
                      className="w-full accent-emerald-500 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="mt-2 flex gap-1.5">
                      {[5, 10, 15, 25, 40].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWeightKg(preset)}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                            weightKg === preset
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset} kg
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verified Segregation Switch */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-5 w-5 ${isSegregated ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-xs font-bold text-slate-800 block">Clean Source Segregation</span>
                        <span className="text-[10px] text-slate-500">Unlocks 1.25x streak bonus multiplier</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsSegregated(!isSegregated)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSegregated ? 'bg-emerald-600' : 'bg-slate-300'
                        }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSegregated ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                  </div>

                  {/* Calculation Result Card */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-800">Calculated Citizen Reward</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-3xl font-black text-emerald-950 tabular-nums">+{calculatedPoints}</span>
                          <span className="text-xs font-bold text-emerald-700">Points</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-emerald-800">Carbon Offset</span>
                        <p className="text-lg font-black text-emerald-900 tabular-nums mt-0.5">
                          ~{co2AvoidedKg} kg <span className="text-xs font-normal">CO₂e</span>
                        </p>
                      </div>
                    </div>

                    {scrapRatePerKg > 0 && (
                      <div className="pt-2.5 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-800">Est. Cash Payout at Live Benchmark:</span>
                        <span className="font-mono font-black text-emerald-950 text-sm">₹{estScrapPayout}</span>
                      </div>
                    )}
                  </div>

                  <Link
                    to={user ? "/dashboard/user?tab=console" : "/login"}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800 shadow-md"
                  >
                    <span>{user ? `Schedule Collection as ${user.name}` : 'Register Household for Live Collection'}</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Real-Time Municipal Telemetry Section ───────────────────── */}
      <section id="telemetry" className="border-y border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Verified Municipal Telemetry</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">Live Civic Performance Metrics</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Feed · Bhopal Integrated Command & Control Center (ICCC)</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Waste Recovered & Diverted</span>
                <Scale className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900 tracking-tight">128,450 kg</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +18.4% month-over-month
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">City Segregation Index</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900 tracking-tight">89.4%</p>
              <p className="mt-1 text-xs text-slate-500">90-day rolling ward benchmark</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Carbon Offset</span>
                <Leaf className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900 tracking-tight">412 MT</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold">CO₂ equivalent emissions diverted</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Active Households</span>
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900 tracking-tight">14,200+</p>
              <p className="mt-1 text-xs text-slate-500">Across 85 registered municipal wards</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Feature Discovery Grid (Card-Based Layout) ─────────────── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Comprehensive Platform Capabilities
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Built for households, field drivers, and municipal commissioners.
            </h2>
            <p className="mt-4 text-slate-600 text-base">
              A single unified architecture replacing fragmented paper registers with real-time digital accountability and CPCB compliance.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Card 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Verified Doorstep Weighment Logging</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Collection drivers weigh segregated streams at the doorstep, logging kilogram weights with optional photo verification and instant digital receipting.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Closed-Loop Points & Civic Rebates</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                CPCB-aligned gamification engine awarding verified points for source segregation, driving civic participation and eligibility for municipal property tax rebates.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">VRP Fleet Dispatch & Nearest-Neighbor Routing</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Automated route sequencing algorithms reduce collection transit fuel burn, balancing vehicle load capacities and broadcasting sub-second live GPS telematics.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Recycler Marketplace & Audited EPR Tax Receipts</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Direct citizen-to-recycler trading at live benchmark rates. Certified material recovery facilities issue official digital EPR weighment certificates for ESG audits.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Society RWAs & Civic Grievance Upvoting</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Dedicated residential association dashboards with aggregated compliance leaderboards. Neighborhood complaint upvoting prioritizes urgent municipal cleanups.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Rugged Handheld Sync & Offline PWA</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Zero-drop offline IndexedDB queuing ensures drivers operating in narrow alleyways can log collections without network drops, automatically syncing upon reconnection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Circular Economy 4-Step Flow ─── */}
      <section id="circular-loop" className="border-t border-slate-200 bg-slate-900 text-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              End-to-End Circular Loop
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight text-white">
              How EcoSync Closes the Municipal Waste Loop
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              From doorstep source-segregation to verifiable industrial recovery under Swachh Bharat guidelines.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Source Segregation',
                desc: 'Households sort wet organics, clean dry recyclables, domestic hazardous, and e-waste into color-coded streams.',
              },
              {
                step: '02',
                title: 'Point-of-Collection Verification',
                desc: 'Municipal drivers weigh streams, inspect contamination, and log weighments via rugged dashboard handhelds.',
              },
              {
                step: '03',
                title: 'Municipal Recovery Hubs',
                desc: 'Organics route into aerobic composting batches; dry fractions divert to certified Material Recovery Facilities (MRFs).',
              },
              {
                step: '04',
                title: 'CPCB EPR Credit Minting',
                desc: 'Licensed recyclers issue digital weighment receipts, minting transparent EPR audit credits for brand producers.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-slate-800 bg-slate-800/60 p-6 relative overflow-hidden">
                <span className="text-4xl font-black text-emerald-500/30 absolute right-4 top-4 select-none">
                  {item.step}
                </span>
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs">
                  {item.step}
                </span>
                <h3 className="mt-4 text-base font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live Scrap Price Board Preview ─ */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Marketplace Transparency</span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">Live Benchmark Scrap Price Board</h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Verified posted rates from certified recyclers across major recyclable fractions in Bhopal.
              </p>
            </div>
            <Link
              to="/rates"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-slate-800 transition"
            >
              <span>View Full Price Board</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { name: 'PET Plastic Bottles', rate: '₹18.50 / kg', trend: '+₹1.50 this week', tone: 'emerald' },
              { name: 'Corrugated Cardboard', rate: '₹14.00 / kg', trend: 'Stable', tone: 'slate' },
              { name: 'Aluminium Scrap & Cans', rate: '₹120.00 / kg', trend: '+₹4.00 this week', tone: 'emerald' },
              { name: 'Consumer E-Waste', rate: '₹90.00 / kg', trend: '+₹5.00 this week', tone: 'emerald' },
              { name: 'Flint Beverage Glass', rate: '₹4.50 / kg', trend: 'Stable', tone: 'slate' },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-5 text-center shadow-sm">
                <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                <p className="text-xl font-black text-slate-950 mt-2">{p.rate}</p>
                <p className="text-[11px] font-bold text-emerald-700 mt-1 flex items-center justify-center gap-1">
                  <TrendingUp className="h-3 w-3" /> {p.trend}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Waste Segregation Visual Guide  */}
      <section className="py-20 bg-[#F9FAFB]">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Segregation Excellence
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Standardized 4-Stream Sorting Guide
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              Accurate household sorting at the source is the foundation of high compliance and maximum EcoPoints.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Stream 1: Wet */}
            <div className="rounded-2xl border border-lime-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-lime-100 text-lime-800 font-bold mb-4">
                <Leaf className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-lime-800">Green Stream</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Wet / Organic</h3>
              <p className="text-xs text-slate-600 mt-2">Routed to ward composting facilities.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Allowed items:</p>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>Cooked & raw food scraps</li>
                  <li>Fruit & vegetable peels</li>
                  <li>Garden leaves & flowers</li>
                  <li>Coffee grounds & tea bags</li>
                </ul>
              </div>
            </div>

            {/* Stream 2: Dry */}
            <div className="rounded-2xl border border-blue-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold mb-4">
                <Recycle className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-800">Blue Stream</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Dry Recyclables</h3>
              <p className="text-xs text-slate-600 mt-2">Recovered via recycler marketplace.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Allowed items:</p>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>PET bottles & plastic containers</li>
                  <li>Newspapers, cartons & cardboard</li>
                  <li>Aluminium cans & tin foil</li>
                  <li>Glass jars & bottles (rinse clean)</li>
                </ul>
              </div>
            </div>

            {/* Stream 3: Hazardous */}
            <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-800 font-bold mb-4">
                <Shield className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Red Stream</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Domestic Hazardous</h3>
              <p className="text-xs text-slate-600 mt-2">Specialized industrial incineration.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Handled with caution:</p>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>Household cleaner bottles</li>
                  <li>Paints, solvents & thinners</li>
                  <li>Pesticides & chemical sprays</li>
                  <li>Expired pharmaceuticals</li>
                </ul>
              </div>
            </div>

            {/* Stream 4: E-Waste */}
            <div className="rounded-2xl border border-purple-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-800 font-bold mb-4">
                <Coins className="h-6 w-6" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800">Purple Stream</span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Electronic Waste</h3>
              <p className="text-xs text-slate-600 mt-2">High-yield EPR certified recovery.</p>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-semibold text-slate-800">Eligible electronics:</p>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>Cables, adapters & chargers</li>
                  <li>Old mobile phones & tablets</li>
                  <li>PC motherboards & components</li>
                  <li>Alkaline & lithium batteries</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modern Comprehensive Footer ──── */}
      <Footer mode="public" />
    </div>
  );
}
