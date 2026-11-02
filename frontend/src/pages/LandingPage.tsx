import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Compass,
  Radio,
  Coins,
  Building2,
  BookOpen,
  Truck,
  Sparkles,
} from 'lucide-react';
import { EcoNav } from '../components/EcoNav';
import { CircularRewardsCalculator } from '../components/home/CircularRewardsCalculator';
import { HowItWorksSection } from '../components/home/HowItWorksSection';
import { SwachhBharatBanner } from '../components/home/SwachhBharatBanner';
import { SolutionsSection } from '../components/home/SolutionsSection';
import { EcoFooter } from '../components/home/EcoFooter';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#101828] antialiased selection:bg-[#009B70] selection:text-white">
      {/* ── EcoNav Navigation ────────────────────────────────────────── */}
      <EcoNav />

      {/* ── Main Content Target for Skip Link ──────────────────────── */}
      <main id="main-content" tabIndex={-1} className="focus:outline-hidden">
        {/* ── Hero Section (Two-Column Desktop Experience with Ambient Glow) ───────────── */}
        <section
          id="home"
          role="region"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 bg-gradient-to-b from-white via-[#F7F9FC] to-[#F7F9FC] dark:from-slate-950 dark:via-[#0B111E] dark:to-[#0B111E]"
        >
          {/* Subtle Ambient Background Grid & Radial Glow Orbs */}
          <div className="absolute inset-0 bg-hero-grid pointer-events-none opacity-60" aria-hidden="true" />
          <div
            className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-400/15 dark:bg-emerald-500/10 blur-3xl pointer-events-none animate-glow-pulse"
            aria-hidden="true"
          />
          <div
            className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-teal-400/15 dark:bg-teal-500/10 blur-3xl pointer-events-none animate-glow-pulse"
            style={{ animationDelay: '3s' }}
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-7">
                {/* Live Telemetry Eyebrow Pill */}
                <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-[#EAFBF4] dark:bg-emerald-950/60 px-4 py-1.5 text-xs font-bold text-[#006B4F] dark:text-emerald-300 shadow-2xs backdrop-blur-xs transition hover:border-emerald-500/50">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#009B70]" />
                  </span>
                  <span className="tracking-wide">BHOPAL LIVE OPERATIONS &middot; 85 WARDS CONNECTED</span>
                </div>

                {/* Main Heading with Primary Gradient Accent */}
                <h1
                  id="hero-heading"
                  className="text-4xl font-black tracking-tight text-[#101828] dark:text-white sm:text-5xl lg:text-6xl leading-[1.12]"
                >
                  A cleaner Bhopal starts at your{' '}
                  <span className="bg-gradient-to-r from-[#009B70] via-emerald-500 to-teal-500 bg-clip-text text-transparent underline decoration-emerald-400/40 decoration-wavy underline-offset-8">
                    doorstep.
                  </span>
                </h1>

                {/* Supporting Description */}
                <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[#475467] dark:text-slate-300">
                  One connected platform for smarter waste collection, transparent municipal operations, and a sustainable circular economy. Connecting households, GPS-enabled fleets, and CPCB-certified recycling facilities.
                </p>

                {/* Primary & Secondary Call to Actions with subtle hover lift & shadow */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <a
                    href="#solutions"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#009B70] to-[#006B4F] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#009B70]/25 transition-all duration-200 hover:shadow-lg hover:shadow-[#009B70]/35 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#009B70]"
                  >
                    <span>Explore Solutions</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <Link
                    to="/operations"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7EC] dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3.5 text-sm font-bold text-[#101828] dark:text-slate-100 shadow-2xs transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5 active:translate-y-0 focus-visible:ring-2 focus-visible:ring-[#009B70]"
                  >
                    <Compass className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
                    <span>View Operations</span>
                  </Link>
                </div>

                {/* Live Micro-Metrics Stat Strip */}
                <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 backdrop-blur-xs shadow-2xs transition hover:border-[#009B70]/40">
                    <p className="text-xl font-black text-[#009B70]">85/85</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Wards Monitored</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 backdrop-blur-xs shadow-2xs transition hover:border-[#009B70]/40">
                    <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">100%</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Doorstep GPS</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 backdrop-blur-xs shadow-2xs transition hover:border-[#009B70]/40">
                    <p className="text-xl font-black text-blue-600 dark:text-blue-400">&lt;24h</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">SLA Guarantee</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 backdrop-blur-xs shadow-2xs transition hover:border-[#009B70]/40">
                    <p className="text-xl font-black text-amber-600 dark:text-amber-400">₹0</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-0.5">Civic Fee</p>
                  </div>
                </div>

                {/* Dedicated Municipal Operational Portals Quick Strip */}
                <div className="pt-6 border-t border-[#E4E7EC] dark:border-slate-800">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467] dark:text-slate-400 mb-3">
                    Municipal Operational Portals:
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Link
                      to="/dashboard/user"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-left transition-all duration-200 hover:border-[#009B70] hover:-translate-y-1 hover:shadow-md group"
                    >
                      <span className="text-xs font-black text-[#101828] dark:text-white group-hover:text-[#006B4F] dark:group-hover:text-emerald-400 transition flex items-center justify-between">
                        Citizen Hub
                        <span className="h-2 w-2 rounded-full bg-[#009B70] group-hover:scale-125 transition-transform" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] dark:text-slate-400 mt-1">Pickups &amp; Green Points</span>
                    </Link>

                    <Link
                      to="/dashboard/driver"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-left transition-all duration-200 hover:border-[#009B70] hover:-translate-y-1 hover:shadow-md group"
                    >
                      <span className="text-xs font-black text-[#101828] dark:text-white group-hover:text-[#006B4F] dark:group-hover:text-emerald-400 transition flex items-center justify-between">
                        Driver PWA
                        <span className="h-2 w-2 rounded-full bg-cyan-600 group-hover:scale-125 transition-transform" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] dark:text-slate-400 mt-1">Routes &amp; Digital Scales</span>
                    </Link>

                    <Link
                      to="/dashboard/admin"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-left transition-all duration-200 hover:border-[#009B70] hover:-translate-y-1 hover:shadow-md group"
                    >
                      <span className="text-xs font-black text-[#101828] dark:text-white group-hover:text-[#006B4F] dark:group-hover:text-emerald-400 transition flex items-center justify-between">
                        Command Desk
                        <span className="h-2 w-2 rounded-full bg-purple-600 group-hover:scale-125 transition-transform" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] dark:text-slate-400 mt-1">ICCC Telemetry &amp; Wards</span>
                    </Link>

                    <Link
                      to="/dashboard/recycler"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-left transition-all duration-200 hover:border-[#009B70] hover:-translate-y-1 hover:shadow-md group"
                    >
                      <span className="text-xs font-black text-[#101828] dark:text-white group-hover:text-[#006B4F] dark:group-hover:text-emerald-400 transition flex items-center justify-between">
                        Recycler MRF
                        <span className="h-2 w-2 rounded-full bg-amber-600 group-hover:scale-125 transition-transform" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] dark:text-slate-400 mt-1">EPR Credit Certificates</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Circular Rewards Calculator with Floating Live Badges */}
              <div className="lg:col-span-5 relative">
                {/* Floating Micro-Badge 1: Ward Morning Sweep Status */}
                <div className="hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-emerald-200/90 dark:border-emerald-800/60 p-2.5 pr-4 shadow-xl backdrop-blur-md animate-float-slow absolute -top-5 left-4 z-20 pointer-events-none">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">Ward 25 Morning Sweep</p>
                    <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">100% Completed &middot; Verified</p>
                  </div>
                </div>

                {/* Floating Micro-Badge 2: Live EcoPoints Incentive */}
                <div className="hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-amber-200/90 dark:border-amber-800/60 p-2.5 pr-4 shadow-xl backdrop-blur-md animate-float-reverse absolute -bottom-5 right-4 z-20 pointer-events-none">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 shrink-0">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-none">+120 EcoPoints Credited</p>
                    <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">Arera Colony &middot; Clean Segregation</p>
                  </div>
                </div>

                {/* The Interactive Calculator Component */}
                <div className="relative z-10 transition-transform duration-300 hover:scale-[1.01]">
                  <CircularRewardsCalculator />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Swachh Bharat & Swachh Bhopal Slogan Showcase ───────────── */}
        <SwachhBharatBanner />

        {/* ── Solutions: Merged Into Landing Page ──────────────────────── */}
        <SolutionsSection />

        {/* ── How EcoSync Works: 3-Stage Process Stepper ─────────────── */}
        <HowItWorksSection />

        {/* ── Quick Discovery Navigation Strip (Separate Distinct Pages) ── */}
        <section className="border-t border-[#E4E7EC] dark:border-slate-800 bg-white dark:bg-slate-950 py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black text-[#101828] dark:text-white">
                Dedicated Civic &amp; Municipal Modules
              </h2>
              <p className="text-xs sm:text-sm text-[#475467] dark:text-slate-400">
                Access detailed telemetry, live commodity rates, knowledge guides, and municipal mission details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/operations"
                className="group rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-900/60 p-6 text-left transition-all duration-300 hover:border-[#009B70] hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-[#006B4F] dark:text-emerald-300 flex items-center justify-center mb-4 group-hover:bg-[#009B70] group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-2xs">
                  <Radio className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-[#006B4F] dark:group-hover:text-emerald-400 transition">
                  Operations &amp; Recycling &rarr;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Real-time fleet tracking, 85 ward telemetry, compactor stations, and certified MRF recovery.
                </p>
              </Link>

              <Link
                to="/rates"
                className="group rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-900/60 p-6 text-left transition-all duration-300 hover:border-amber-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-11 w-11 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-2xs">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                  Live Scrap Rates &rarr;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Verified benchmark prices for paper, plastic, metal, and e-waste with doorstep payouts.
                </p>
              </Link>

              <Link
                to="/about"
                className="group rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-900/60 p-6 text-left transition-all duration-300 hover:border-purple-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-11 w-11 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-2xs">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                  About EcoSync &rarr;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Mission architecture, BMC partnership, ISO compliance, and clean city impact.
                </p>
              </Link>

              <Link
                to="/blog"
                className="group rounded-2xl border border-[#E4E7EC] dark:border-slate-800 bg-[#F7F9FC] dark:bg-slate-900/60 p-6 text-left transition-all duration-300 hover:border-sky-500 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="h-11 w-11 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition-all duration-300 group-hover:scale-110 shadow-2xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 dark:text-white text-base group-hover:text-sky-600 dark:group-hover:text-sky-400 transition">
                  Blog &amp; FAQs &rarr;
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Practical 4-stream segregation guides, municipal news, and answers to common civic questions.
                </p>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── EcoFooter: Smart-City Municipal Footer ─────────────────── */}
      <EcoFooter />
    </div>
  );
}
