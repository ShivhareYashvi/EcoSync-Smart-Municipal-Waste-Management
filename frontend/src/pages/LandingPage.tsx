import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  MapPinned,
  CheckCircle2,
  Compass,
  Radio,
  Coins,
  Building2,
  BookOpen,
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
        {/* ── Hero Section (Two-Column Desktop Experience) ───────────── */}
        <section
          id="home"
          role="region"
          aria-labelledby="hero-heading"
          className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 bg-gradient-to-b from-white via-[#F7F9FC] to-[#F7F9FC]"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-7">
                {/* Eyebrow */}
                <div className="inline-flex items-center gap-2 rounded-full border border-[#009B70]/30 bg-[#EAFBF4] px-3.5 py-1 text-xs font-bold text-[#006B4F]">
                  <span className="h-2 w-2 rounded-full bg-[#009B70]" />
                  <span>SMART BHOPAL &middot; CONNECTED OPERATIONS</span>
                </div>

                {/* Main Heading with Primary Green Accent */}
                <h1
                  id="hero-heading"
                  className="text-4xl font-black tracking-tight text-[#101828] sm:text-5xl lg:text-6xl leading-[1.12]"
                >
                  A cleaner Bhopal starts at your{' '}
                  <span className="text-[#009B70]">doorstep.</span>
                </h1>

                {/* Supporting Description */}
                <p className="max-w-2xl text-base sm:text-lg leading-relaxed text-[#475467]">
                  One connected platform for smarter waste collection, transparent municipal operations, and a sustainable circular economy. Connecting households, GPS-enabled fleets, and CPCB-certified recycling facilities.
                </p>

                {/* Primary & Secondary Call to Actions */}
                <div className="flex flex-wrap items-center gap-3.5 pt-1">
                  <a
                    href="#solutions"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#009B70] px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-[#009B70]/20 transition hover:bg-[#006B4F] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[#009B70]"
                  >
                    <span>Explore Solutions</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </a>

                  <Link
                    to="/operations"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#E4E7EC] bg-white px-5 py-3.5 text-sm font-bold text-[#101828] shadow-2xs transition hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-[#009B70]"
                  >
                    <Compass className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
                    <span>View Operations</span>
                  </Link>
                </div>

                {/* Three Concise Trust Indicators */}
                <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs font-semibold text-[#475467]">
                  <span className="flex items-center gap-2 text-[#101828]">
                    <CheckCircle2 className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
                    <span>Intelligent Collection</span>
                  </span>
                  <span className="flex items-center gap-2 text-[#101828]">
                    <MapPinned className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
                    <span>GPS Fleet Tracking</span>
                  </span>
                  <span className="flex items-center gap-2 text-[#101828]">
                    <ShieldCheck className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
                    <span>Circular Rewards</span>
                  </span>
                </div>

                {/* Dedicated Municipal Operational Portals Quick Strip */}
                <div className="pt-6 border-t border-[#E4E7EC]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#475467] mb-3">
                    Municipal Operational Portals:
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Link
                      to="/dashboard/user"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] bg-white p-3.5 text-left transition hover:border-[#009B70] hover:shadow-xs group"
                    >
                      <span className="text-xs font-black text-[#101828] group-hover:text-[#006B4F] transition flex items-center justify-between">
                        Citizen Hub
                        <span className="h-2 w-2 rounded-full bg-[#009B70]" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] mt-1">Pickups &amp; Green Points</span>
                    </Link>

                    <Link
                      to="/dashboard/driver"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] bg-white p-3.5 text-left transition hover:border-[#009B70] hover:shadow-xs group"
                    >
                      <span className="text-xs font-black text-[#101828] group-hover:text-[#006B4F] transition flex items-center justify-between">
                        Driver PWA
                        <span className="h-2 w-2 rounded-full bg-cyan-600" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] mt-1">Routes &amp; Digital Scales</span>
                    </Link>

                    <Link
                      to="/dashboard/admin"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] bg-white p-3.5 text-left transition hover:border-[#009B70] hover:shadow-xs group"
                    >
                      <span className="text-xs font-black text-[#101828] group-hover:text-[#006B4F] transition flex items-center justify-between">
                        Command Desk
                        <span className="h-2 w-2 rounded-full bg-purple-600" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] mt-1">ICCC Telemetry &amp; Wards</span>
                    </Link>

                    <Link
                      to="/dashboard/recycler"
                      className="flex flex-col rounded-2xl border border-[#E4E7EC] bg-white p-3.5 text-left transition hover:border-[#009B70] hover:shadow-xs group"
                    >
                      <span className="text-xs font-black text-[#101828] group-hover:text-[#006B4F] transition flex items-center justify-between">
                        Recycler MRF
                        <span className="h-2 w-2 rounded-full bg-amber-600" aria-hidden="true" />
                      </span>
                      <span className="text-[11px] text-[#475467] mt-1">EPR Credit Certificates</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right Column: Circular Rewards Calculator */}
              <div className="lg:col-span-5">
                <CircularRewardsCalculator />
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
        <section className="border-t border-[#E4E7EC] bg-white py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#006B4F] bg-[#EAFBF4] px-3 py-1 rounded-full border border-[#009B70]/20">
                Explore The Platform
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#101828]">
                Dedicated Civic &amp; Municipal Modules
              </h2>
              <p className="text-xs sm:text-sm text-[#475467]">
                Access detailed telemetry, live commodity rates, knowledge guides, and municipal mission details.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link
                to="/operations"
                className="group rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-6 text-left transition hover:border-[#009B70] hover:bg-white hover:shadow-md"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-50 text-[#006B4F] flex items-center justify-center mb-4 group-hover:bg-[#009B70] group-hover:text-white transition">
                  <Radio className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base group-hover:text-[#006B4F] transition">
                  Operations &amp; Recycling &rarr;
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Real-time fleet tracking, 85 ward telemetry, compactor stations, and certified MRF recovery.
                </p>
              </Link>

              <Link
                to="/rates"
                className="group rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-6 text-left transition hover:border-[#009B70] hover:bg-white hover:shadow-md"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4 group-hover:bg-amber-600 group-hover:text-white transition">
                  <Coins className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base group-hover:text-amber-700 transition">
                  Live Scrap Rates &rarr;
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Verified benchmark prices for paper, plastic, metal, and e-waste with doorstep payouts.
                </p>
              </Link>

              <Link
                to="/about"
                className="group rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-6 text-left transition hover:border-[#009B70] hover:bg-white hover:shadow-md"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base group-hover:text-purple-700 transition">
                  About EcoSync &rarr;
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Mission architecture, BMC partnership, ISO compliance, and clean city impact.
                </p>
              </Link>

              <Link
                to="/blog"
                className="group rounded-2xl border border-[#E4E7EC] bg-[#F7F9FC] p-6 text-left transition hover:border-[#009B70] hover:bg-white hover:shadow-md"
              >
                <div className="h-10 w-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center mb-4 group-hover:bg-sky-600 group-hover:text-white transition">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-900 text-base group-hover:text-sky-700 transition">
                  Blog &amp; FAQs &rarr;
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
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
