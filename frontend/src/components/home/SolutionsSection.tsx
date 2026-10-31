import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Truck,
  Scale,
  Recycle,
  Coins,
  BarChart3,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const SolutionsSection: React.FC = () => {
  const capabilities = [
    {
      id: 'citizen',
      title: 'Citizen Services',
      subtitle: 'Doorstep Scheduling & Real-Time Tracking',
      desc: 'Intuitive resident console for scheduling scheduled doorstep pickups, tracking collection vehicles in real-time, reporting missed visits, and accessing civic support.',
      icon: Users,
      route: '/dashboard/user',
      ctaText: 'Explore Citizen Hub',
      badge: 'Bhopal Residents',
    },
    {
      id: 'fleet',
      title: 'Smart Fleet Management',
      subtitle: 'GPS Telemetry & VRP Route Sequencing',
      desc: 'Vehicle Routing Problem (VRP) algorithms optimize ward sweep sequencing, reduce diesel emissions, and broadcast live sub-second GPS positions to households.',
      icon: Truck,
      route: '/dashboard/driver',
      ctaText: 'View Fleet Operations',
      badge: 'Municipal Drivers',
    },
    {
      id: 'weighment',
      title: 'Digital Weighment Logging',
      subtitle: 'CPCB Calibrated Legal Metrology',
      desc: 'Field drivers weigh segregated streams with digital scales, logging tamper-proof kilogram weights with optional photo verification and instant SMS receipts.',
      icon: Scale,
      route: '/dashboard/user?tab=history',
      ctaText: 'Weighment Ledger',
      badge: 'CPCB Calibrated',
    },
    {
      id: 'circular',
      title: 'Circular Economy Marketplace',
      subtitle: 'Certified Material Recovery Facilities',
      desc: 'Direct trading of segregated dry recyclables at transparent municipal benchmark rates. Certified recyclers issue compliant digital EPR credit certificates.',
      icon: Recycle,
      route: '/rates',
      ctaText: 'View Price Board',
      badge: 'EPR Minting',
    },
    {
      id: 'rewards',
      title: 'Citizen Rewards & Rebates',
      subtitle: 'Gamified Civic Compliance Engine',
      desc: 'Source segregation earns verified EcoPoints redeemable for utility rebates, commercial coupons, and municipal property tax discounts for high-compliance RWAs.',
      icon: Coins,
      route: '/dashboard/user?tab=rewards',
      ctaText: 'Green Rewards Catalog',
      badge: 'Civic Rebates',
    },
    {
      id: 'analytics',
      title: 'Municipal Analytics & ICCC Desk',
      subtitle: 'Ward Heatmaps & Landfill Diversion',
      desc: 'Centralized administrative intelligence desk for Bhopal Municipal Corporation (BMC), offering ward segregation indices, fleet heatmaps, and carbon audits.',
      icon: BarChart3,
      route: '/dashboard/admin',
      ctaText: 'Command Desk',
      badge: 'BMC Commissioners',
    },
  ];

  return (
    <section
      id="solutions"
      role="region"
      aria-labelledby="solutions-heading"
      className="border-t border-[#E4E7EC] bg-white py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF4] text-[#006B4F] text-xs font-bold uppercase tracking-wider border border-[#009B70]/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Platform Capabilities</span>
          </span>

          <h2
            id="solutions-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
          >
            Everything Connected. <span className="text-[#009B70]">One Platform.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
            A unified municipal operating network connecting 85 wards, hundreds of field drivers, and certified recyclers into a single transparent workflow.
          </p>
        </div>

        {/* 6 Capabilities Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <div
                key={cap.id}
                className="rounded-3xl border border-[#E4E7EC] bg-white p-7 sm:p-8 space-y-4 shadow-xs hover:border-[#009B70]/50 hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EAFBF4] text-[#006B4F] group-hover:bg-[#009B70] group-hover:text-white transition">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-[#475467] uppercase tracking-wider">
                      {cap.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-[#101828] tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#006B4F] mt-0.5">
                      {cap.subtitle}
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                    {cap.desc}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <Link
                    to={cap.route}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#006B4F] group-hover:text-[#009B70] transition focus-visible:ring-2 focus-visible:ring-[#009B70] rounded-lg"
                  >
                    <span>{cap.ctaText}</span>
                    <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

