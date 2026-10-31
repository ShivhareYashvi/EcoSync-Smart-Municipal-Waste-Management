import React from 'react';
import {
  MapPin,
  Truck,
  CheckCircle2,
  Clock,
  Radio,
  TrendingUp,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { BhopalOperationsMap } from './BhopalOperationsMap';

export const BhopalOperationsSection: React.FC = () => {
  return (
    <section
      id="operations"
      role="region"
      aria-labelledby="operations-heading"
      className="border-t border-[#E4E7EC] bg-[#F7F9FC] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#009B70]/30 bg-[#EAFBF4] px-3.5 py-1 text-xs font-bold text-[#006B4F]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#009B70] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#009B70]"></span>
              </span>
              <span>Bhopal Municipal Command Desk</span>
            </div>

            <h2
              id="operations-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
            >
              Bhopal. <span className="text-[#009B70]">Connected.</span>
            </h2>

            <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
              Explore how intelligent collection fleets, IoT-connected weighment scales, and municipal operations connect across the city of lakes in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#475467] bg-white border border-[#E4E7EC] px-4 py-2.5 rounded-2xl shadow-2xs">
            <Radio className="h-4 w-4 text-[#009B70] animate-pulse" aria-hidden="true" />
            <span>Telemetry Feed: <strong>Bhopal ICCC (Zone 10)</strong></span>
          </div>
        </div>

        {/* 4 Command Overview Statistic Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: Wards Monitored */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-xs hover:border-[#009B70]/50 transition">
            <div className="flex items-center justify-between text-[#475467] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Wards Monitored</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-[#006B4F]">
                <Building2 className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#101828] tracking-tight">85</p>
            <p className="mt-2 text-xs text-[#475467] font-medium flex items-center gap-1.5">
              <span className="font-bold text-[#006B4F]">[Active]</span>
              <span>100% coverage across Zones 1–14</span>
            </p>
          </div>

          {/* Card 2: Active Collection Vehicles */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-xs hover:border-[#009B70]/50 transition">
            <div className="flex items-center justify-between text-[#475467] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Active Fleet (GPS)</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Truck className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#101828] tracking-tight">142</p>
            <p className="mt-2 text-xs text-[#475467] font-medium flex items-center gap-1.5">
              <span className="font-bold text-[#006B4F]">[Live Stream]</span>
              <span>Sub-second VRP route sequencing</span>
            </p>
          </div>

          {/* Card 3: On-Time Collection Rate */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-xs hover:border-[#009B70]/50 transition">
            <div className="flex items-center justify-between text-[#475467] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">On-Time Completion</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-[#006B4F]">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#101828] tracking-tight">96.4%</p>
            <p className="mt-2 text-xs text-[#006B4F] font-semibold flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
              <span>+3.2% vs previous 30-day baseline</span>
            </p>
          </div>

          {/* Card 4: Daily Completed Pickups */}
          <div className="rounded-2xl border border-[#E4E7EC] bg-white p-6 shadow-xs hover:border-[#009B70]/50 transition">
            <div className="flex items-center justify-between text-[#475467] mb-3">
              <span className="text-xs font-bold uppercase tracking-wider">Doorstep Pickups Today</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-black text-[#101828] tracking-tight">12,840+</p>
            <p className="mt-2 text-xs text-[#475467] font-medium flex items-center gap-1.5">
              <span className="font-bold text-slate-900">[Verified]</span>
              <span>Digital scale receipts recorded</span>
            </p>
          </div>
        </div>

        {/* Interactive Bhopal Map & Legend */}
        <BhopalOperationsMap />
      </div>
    </section>
  );
};

