import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Coins,
  FileCheck,
  Globe2,
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

export function LandingPage() {
  // Interactive Simulator State
  const [selectedCategory, setSelectedCategory] = useState<'wet' | 'dry' | 'hazardous' | 'e_waste'>('dry');
  const [weightKg, setWeightKg] = useState<number>(14.5);
  const [isSegregated, setIsSegregated] = useState<boolean>(true);

  // Dynamic calculations based on points engine formula:
  // Base 50 + weight bonus min(kg * 5, 50) * 1.25 streak multiplier
  const basePoints = isSegregated ? 50 : 0;
  const weightBonus = isSegregated ? Math.min(Math.round(weightKg * 5), 50) : 0;
  const calculatedPoints = Math.round((basePoints + weightBonus) * 1.25);
  const co2AvoidedKg = (weightKg * (selectedCategory === 'dry' ? 2.4 : selectedCategory === 'wet' ? 1.1 : 3.8)).toFixed(1);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] antialiased selection:bg-emerald-500 selection:text-white">
      {/* ── Top Navigation Bar ─────────────── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-sm transition group-hover:bg-emerald-600">
              <Recycle className="h-6 w-6 transition-transform group-hover:rotate-45" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-950">EcoSync</span>
              <span className="hidden text-[11px] font-semibold text-emerald-700 sm:inline ml-2 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Municipal SaaS
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              Platform Features
            </a>
            <a href="#circular-loop" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              Circular Economy
            </a>
            <a href="#telemetry" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700">
              Civic Impact
            </a>
            <Link to="/rates" className="text-sm font-medium text-slate-600 transition hover:text-emerald-700 flex items-center gap-1">
              Scrap Price Board
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ─────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="absolute top-0 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute bottom-0 left-10 -z-10 h-72 w-72 rounded-full bg-lime-100/50 blur-3xl" />

        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/90 px-3.5 py-1 text-xs font-bold text-emerald-800 shadow-sm">
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                <span>Next-Gen Smart Municipal Waste Management</span>
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl leading-[1.12]">
                Cleaner neighborhoods with{' '}
                <span className="bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent">
                  intelligent pickup coordination.
                </span>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
                EcoSync bridges households, municipal drivers, and certified recyclers into a unified, transparent operating network. Verified point-of-collection logging, automated route dispatching, and closed-loop civic rewards.
              </p>

              {/* Primary Call-to-Actions */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 font-bold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 hover:-translate-y-0.5"
                >
                  <span>Schedule First Pickup</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to="/rates"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
                >
                  <Coins className="h-4 w-4 text-emerald-600" />
                  <span>Live Scrap Price Board</span>
                </Link>
              </div>

              {/* Quick Role Portal Selectors */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
                  Select your dedicated operational portal:
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <Link
                    to="/login/citizen"
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-500 hover:shadow-md"
                  >
                    <span className="text-xs font-bold text-slate-900">Citizen</span>
                    <span className="text-[11px] text-slate-600">Pickups & Rewards</span>
                  </Link>
                  <Link
                    to="/login/driver"
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-500 hover:shadow-md"
                  >
                    <span className="text-xs font-bold text-slate-900">Driver</span>
                    <span className="text-[11px] text-slate-600">Routes & Offline PWA</span>
                  </Link>
                  <Link
                    to="/login/admin"
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-500 hover:shadow-md"
                  >
                    <span className="text-xs font-bold text-slate-900">Municipal</span>
                    <span className="text-[11px] text-slate-600">Fleet & Analytics</span>
                  </Link>
                  <Link
                    to="/rates"
                    className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-emerald-500 hover:shadow-md"
                  >
                    <span className="text-xs font-bold text-slate-900">Recycler</span>
                    <span className="text-[11px] text-slate-600">Scrap & EPR Ledger</span>
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
                      <h3 className="text-sm font-bold text-slate-900">Verified Collection Simulator</h3>
                      <p className="text-[11px] text-slate-600">Real-time point-of-pickup verification</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    Ward BLR-W01
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
                        { id: 'wet', label: 'Wet Organic', color: 'border-lime-500 bg-lime-50/50 text-lime-900' },
                        { id: 'dry', label: 'Dry Recyclable', color: 'border-blue-500 bg-blue-50/50 text-blue-900' },
                        { id: 'hazardous', label: 'Hazardous', color: 'border-rose-500 bg-rose-50/50 text-rose-900' },
                        { id: 'e_waste', label: 'E-Waste', color: 'border-purple-500 bg-purple-50/50 text-purple-900' },
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
                  </div>

                  {/* Verified Segregation Switch */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3 border border-slate-200">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className={`h-5 w-5 ${isSegregated ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-slate-800">Segregation Verified</span>
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
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-emerald-800">Calculated Citizen Reward</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-3xl font-black text-emerald-950 tabular-nums">+{calculatedPoints}</span>
                          <span className="text-xs font-bold text-emerald-700">Points</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-emerald-800">Carbon Offset</span>
                        <p className="text-lg font-black text-emerald-900 tabular-nums mt-0.5">
                          ~{co2AvoidedKg} kg <span className="text-xs font-normal">CO₂e</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/register"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    <span>Register Household for Live Collection</span>
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
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Synced with PostgreSQL database</span>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Waste Processed</span>
                <Scale className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900 tracking-tight">128,450 kg</p>
              <p className="mt-1 text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" /> +18.4% segregation compliance
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-6 shadow-sm">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">City Compliance Rate</span>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-black text-slate-900 tracking-tight">89.4%</p>
              <p className="mt-1 text-xs text-slate-500">90-day rolling ward average</p>
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
              <p className="mt-1 text-xs text-slate-500">Across 12 registered municipal wards</p>
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
              A single unified architecture replacing fragmented paper registers with real-time digital accountability.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature Card 1 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Scale className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Verified Point-of-Pickup Logging</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Drivers verify segregation at the doorstep, recording precise kilogram weights across wet, dry, hazardous, and e-waste with optional photo proof.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Coins className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Closed-Loop Points & Tier Progression</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Deterministic rewards engine with 1.25x streak multipliers for consecutive clean weeks. Redeemable for municipal utility credits and local partner perks.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Fleet Dispatch & Route Optimization</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Nearest-neighbor route planning algorithm reduces transit fuel burn. Monitors EV and CNG fleet health with automated service maintenance triggers.
              </p>
            </div>

            {/* Feature Card 4 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <FileCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Recycler Marketplace & EPR Credits</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Direct citizen-to-recycler trading at live benchmark prices. Verified recycling receipts generate audited EPR credits for compliant corporate producers.
              </p>
            </div>

            {/* Feature Card 5 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Housing Societies & Civic Upvoting</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Privacy-guaranteed society dashboards with k-anonymity (k≥3). Neighborhood complaint upvoting eliminates duplicate filings and accelerates resolution.
              </p>
            </div>

            {/* Feature Card 6 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-5">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-950">Offline Resilience & PWA Sync</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Zero-drop IndexedDB offline queue on driver handhelds with automated background sync and SHA-256 cryptographic idempotency protection.
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
              How EcoSync Closes the Waste Loop
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base">
              From doorstep source-segregation to verifiable industrial recovery.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: '01',
                title: 'Source Segregation',
                desc: 'Households sort wet organics, clean dry recyclables, and hazardous waste into separate streams.',
              },
              {
                step: '02',
                title: 'Verified Point-of-Collection',
                desc: 'Drivers weigh streams, record categories, and award immediate ledger points via mobile PWA.',
              },
              {
                step: '03',
                title: 'Municipal Processing',
                desc: 'Organics route into monitored municipal compost batches; recyclables move to approved hubs.',
              },
              {
                step: '04',
                title: 'EPR Credit Generation',
                desc: 'Certified recyclers issue digital receipts, minting transparent EPR credits for brand producers.',
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
                Verified posted rates from certified recyclers across major recyclable fractions.
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
              { name: 'PET Plastic Bottles', rate: '₹18 - ₹24 / kg', trend: '+₹2.0 this week', tone: 'emerald' },
              { name: 'Corrugated Cardboard', rate: '₹12 - ₹15 / kg', trend: 'Stable', tone: 'slate' },
              { name: 'Aluminium Beverage Cans', rate: '₹95 - ₹115 / kg', trend: '+₹5.0 this week', tone: 'emerald' },
              { name: 'Electronic Waste (E-Waste)', rate: '₹45 - ₹180 / kg', trend: 'High demand', tone: 'emerald' },
              { name: 'Clear Glass Cullet', rate: '₹4 - ₹6 / kg', trend: 'Stable', tone: 'slate' },
            ].map((p) => (
              <div key={p.name} className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-4 text-center">
                <p className="text-xs font-bold text-slate-700 truncate">{p.name}</p>
                <p className="text-lg font-black text-slate-950 mt-2">{p.rate}</p>
                <p className="text-[11px] font-semibold text-emerald-700 mt-1">{p.trend}</p>
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

      {/* ── Success Stories & Sustainability Impact ─────────────────── */}
      <section className="py-20 bg-white border-y border-slate-200">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Proven Civic Impact
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
              Real-World Sustainability Success Stories
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base">
              See how neighborhoods, housing societies, and municipal commissioners achieve measurable zero-landfill milestones.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Story 1 */}
            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-7 flex flex-col justify-between shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "By adopting EcoSync across our 420-apartment society, our segregation compliance jumped from 54% to 92% in two months. Residents love redeeming points for utility credits, and the k-anonymity dashboard keeps our community motivated without privacy concerns."
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-sm">
                  RS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rajesh Subramanian</h4>
                  <p className="text-[11px] text-slate-500">RWA President · Indiranagar Ward</p>
                </div>
              </div>
            </div>

            {/* Story 2 */}
            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-7 flex flex-col justify-between shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "The automated route optimization and maintenance alert system cut our ward fleet fuel expenditure by 22%. Drivers use the offline PWA during morning rounds with zero dropped records, ensuring 100% daily accountability."
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  AK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Ananya Kulkarni</h4>
                  <p className="text-[11px] text-slate-500">Assistant Municipal Commissioner</p>
                </div>
              </div>
            </div>

            {/* Story 3 */}
            <div className="rounded-2xl border border-slate-200 bg-[#F9FAFB] p-7 flex flex-col justify-between shadow-sm transition hover:shadow-md">
              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">
                  "EcoSync gave our recycling facility an audit-proof paperless pipeline. Every digital receipt issued through the scrap price board mints traceable EPR credits that FMCG brand partners actively purchase for their annual compliance filing."
                </p>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-200 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-sm">
                  SM
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Sunil Mehta</h4>
                  <p className="text-[11px] text-slate-500">Director · Green Earth Recyclers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Modern Comprehensive Footer ──── */}
      <footer className="bg-slate-950 text-slate-400 py-16">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="grid gap-10 md:grid-cols-5">
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold">
                  <Recycle className="h-5 w-5" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">EcoSync</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400 max-w-sm">
                Next-generation municipal waste intelligence and circular economy platform. Connecting citizens, municipal fleets, and recyclers with verifiable data.
              </p>
              <div className="flex items-center gap-2 pt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-300">All Systems Operational · PostgreSQL 18</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Role Portals</p>
              <ul className="space-y-2 text-xs">
                <li><Link to="/login/citizen" className="hover:text-emerald-400 transition">Citizen Portal</Link></li>
                <li><Link to="/login/driver" className="hover:text-emerald-400 transition">Driver Field Console</Link></li>
                <li><Link to="/login/admin" className="hover:text-emerald-400 transition">Municipal Admin</Link></li>
                <li><Link to="/rates" className="hover:text-emerald-400 transition">Recycler Marketplace</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">Platform</p>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-emerald-400 transition">Core Modules</a></li>
                <li><a href="#circular-loop" className="hover:text-emerald-400 transition">Circular Flow</a></li>
                <li><a href="#telemetry" className="hover:text-emerald-400 transition">Civic Metrics</a></li>
                <li><Link to="/rates" className="hover:text-emerald-400 transition">Scrap Price Board</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white mb-3">API & Developer</p>
              <ul className="space-y-2 text-xs">
                <li><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">Interactive API Docs</a></li>
                <li><a href="http://localhost:8000/health" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">System Health</a></li>
                <li><Link to="/register" className="hover:text-emerald-400 transition">Register Household</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>© {new Date().getFullYear()} EcoSync Municipal Platform. All rights reserved.</p>
            <p>Designed with Material Design principles & Sustainable Tech.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
