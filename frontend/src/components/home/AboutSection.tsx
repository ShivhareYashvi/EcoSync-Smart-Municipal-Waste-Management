import React from 'react';
import {
  ShieldCheck,
  Building2,
  Cpu,
  Target,
  Sparkles,
  CheckCircle2,
  Users,
  Leaf,
  Globe2,
} from 'lucide-react';

export const AboutSection: React.FC = () => {
  return (
    <section
      id="about"
      role="region"
      aria-labelledby="about-heading"
      className="border-t border-[#E4E7EC] bg-[#F7F9FC] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF4] text-[#006B4F] text-xs font-bold uppercase tracking-wider border border-[#009B70]/20">
            <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Mission &amp; Civic Architecture</span>
          </span>

          <h2
            id="about-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
          >
            About <span className="text-[#009B70]">EcoSync.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
            The next-generation smart city waste management operating network powering Bhopal’s transition to zero-landfill urban circularity.
          </p>
        </div>

        {/* Editorial Feature Grid: What It Is + Vision & Mission */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Box 1: What EcoSync Is & Vision */}
          <div className="rounded-3xl border border-[#E4E7EC] bg-white p-8 sm:p-10 space-y-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAFBF4] text-[#006B4F]">
              <Target className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#101828] tracking-tight">
                Our Vision &amp; Purpose
              </h3>
              <p className="text-sm font-semibold text-[#006B4F]">
                Closing the loop between 14,000+ households and industrial recycling.
              </p>
            </div>

            <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
              EcoSync was architected to solve the urban solid waste crisis in India’s cleanest state capital. While Bhopal has consistently ranked among the cleanest cities under the Swachh Survekshan surveys, municipal operations historically relied on fragmented paper manifests, unverified collection routes, and opaque informal scrap channels.
            </p>

            <p className="text-sm sm:text-base text-[#475467] leading-relaxed">
              EcoSync provides a unified digital operating system connecting the <strong>Bhopal Municipal Corporation (BMC)</strong>, 85 ward supervisors, municipal collection drivers, and CPCB-registered recycling facilities into a transparent civic operating grid.
            </p>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#475467]">Target Goal</p>
                <p className="text-lg font-black text-[#101828] mt-0.5">100% Segregation</p>
                <p className="text-xs text-[#006B4F]">At point-of-collection</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-[#475467]">Circularity Vision</p>
                <p className="text-lg font-black text-[#101828] mt-0.5">Zero Methane</p>
                <p className="text-xs text-[#006B4F]">100% organic diversion</p>
              </div>
            </div>
          </div>

          {/* Box 2: The Problems EcoSync Solves */}
          <div className="rounded-3xl border border-[#E4E7EC] bg-white p-8 sm:p-10 space-y-6 shadow-xs">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAFBF4] text-[#006B4F]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-[#101828] tracking-tight">
                The Municipal Challenge Solved
              </h3>
              <p className="text-sm font-semibold text-[#006B4F]">
                Transforming traditional hauling into digital accountability.
              </p>
            </div>

            <ul className="space-y-3.5 text-xs sm:text-sm text-[#475467]">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#009B70] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-[#101828]">Unverified Collection Visits:</strong> Replaced with sub-second GPS route tracking, automated geofenced arrival alerts, and missed pickup reporting.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#009B70] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-[#101828]">Paper Manifests &amp; Fraud:</strong> Replaced with CPCB-calibrated digital Bluetooth scales logging tamper-proof weights directly to the municipal database.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#009B70] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-[#101828]">Lack of Citizen Incentives:</strong> Replaced with verified EcoPoints redeemable for property tax rebates and commercial utility discounts.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-[#009B70] shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="text-[#101828]">Informal &amp; Dangerous E-Waste:</strong> Channelled into authorized CPCB Material Recovery Facilities with audited EPR certificates.
                </div>
              </li>
            </ul>

            <div className="p-4 rounded-2xl bg-[#EAFBF4] border border-[#009B70]/20 text-xs text-[#006B4F] font-semibold">
              Aligned with Swachh Bharat Mission 2.0 &amp; Bhopal Smart City Development Corporation (BSCDCL).
            </div>
          </div>
        </div>

        {/* 3 Pillars: Technology, Sustainability, Citizen Participation */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#E4E7EC] bg-white p-7 space-y-3 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Cpu className="h-5 w-5" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-bold text-[#101828]">Robust Technology Architecture</h4>
            <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
              Powered by a high-concurrency FastAPI asynchronous backend, PostgreSQL spatial indexes, Leaflet GIS mapping, offline-capable IndexedDB Progressive Web Apps for alleyway coverage, and automated Nearest-Neighbor route sequencing.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E4E7EC] bg-white p-7 space-y-3 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-[#006B4F]">
              <Leaf className="h-5 w-5" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-bold text-[#101828]">Verifiable Sustainability</h4>
            <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
              Every kilogram weighed is mapped directly against EPA WARM coefficients to produce audit-ready carbon offset ledgers for municipal environmental reporting and corporate ESG disclosures.
            </p>
          </div>

          <div className="rounded-3xl border border-[#E4E7EC] bg-white p-7 space-y-3 shadow-2xs">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Users className="h-5 w-5" aria-hidden="true" />
            </div>
            <h4 className="text-lg font-bold text-[#101828]">Citizen-First Governance</h4>
            <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
              Equipping residents, elderly citizens, and people with disabilities with accessible tools, clear WhatsApp and SMS alerts, community grievance upvoting, and localized RWA compliance leaderboards.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

