import React from 'react';
import { Sparkles, Scale, Recycle, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Segregate',
      tagline: 'Household Source Sorting',
      desc: 'Citizens separate household waste into four standardized color-coded streams at their doorstep: Wet Organic, Dry Recyclables, Domestic Hazardous, and E-Waste.',
      badge: 'Green & Blue Streams',
      points: '+50 Base EcoPoints',
    },
    {
      step: '02',
      title: 'Collect',
      tagline: 'GPS Telemetry & Digital Weighment',
      desc: 'GPS-dispatched municipal vehicles arrive on-schedule. Drivers weigh streams using CPCB-calibrated digital scales and log verified weights to the civic ledger.',
      badge: 'Sub-Second Telemetry',
      points: 'Instant SMS Receipt',
    },
    {
      step: '03',
      title: 'Recycle',
      tagline: 'Industrial Recovery & EPR Credits',
      desc: 'Organics route into aerobic composting batches; clean recyclables reach certified Material Recovery Facilities (MRFs); brand producers receive auditable digital EPR credits.',
      badge: 'Zero-Landfill Loop',
      points: 'CPCB EPR Certified',
    },
  ];

  return (
    <section
      role="region"
      aria-labelledby="how-it-works-heading"
      className="border-t border-[#E4E7EC] bg-white py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF4] text-[#006B4F] text-xs font-bold uppercase tracking-wider border border-[#009B70]/20">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>End-to-End Civic Architecture</span>
          </span>

          <h2
            id="how-it-works-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
          >
            From Your Home to a <span className="text-[#009B70]">Circular Future.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
            EcoSync transforms traditional unverified garbage hauling into a transparent, three-stage circular economy loop governed by real-time digital verification.
          </p>
        </div>

        {/* 3-Stage Process Stepper */}
        <div className="grid gap-6 md:grid-cols-3 relative">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative rounded-3xl border border-[#E4E7EC] bg-[#F7F9FC] p-7 sm:p-8 space-y-4 hover:border-[#009B70]/40 hover:bg-white hover:shadow-lg transition group"
            >
              {/* Step Badge */}
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#009B70] text-white font-black text-sm shadow-sm group-hover:bg-[#006B4F] transition">
                  {item.step}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-bold text-[#475467] border border-[#E4E7EC] shadow-2xs">
                  {item.badge}
                </span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#006B4F] mt-0.5">
                  {item.tagline}
                </p>
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-[#475467]">
                {item.desc}
              </p>

              {/* Metric / Perk Tag */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between text-xs font-bold text-[#101828]">
                <span className="flex items-center gap-1.5 text-[#006B4F]">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {item.points}
                </span>
                <span className="text-[11px] text-[#475467]">Stage {index + 1} of 3</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

