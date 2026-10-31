import React from 'react';
import {
  Leaf,
  Recycle,
  Shield,
  Coins,
  Scale,
  TrendingUp,
  CheckCircle2,
  Users,
  Info,
  ArrowRight,
} from 'lucide-react';

export const RecyclingSection: React.FC = () => {
  const loopStages = [
    { step: '01', title: 'Households', desc: 'Doorstep segregation into 4 standardized color streams.' },
    { step: '02', title: 'Collection', desc: 'Digital weighment & zero-contamination inspection by drivers.' },
    { step: '03', title: 'Sorting', desc: 'Pre-classification at ward compactor transfer stations.' },
    { step: '04', title: 'Recycling', desc: 'Aerobic composting and secondary processing at certified MRFs.' },
    { step: '05', title: 'Recovered', desc: 'Repurposed raw materials & audited CPCB EPR credit certificates.' },
  ];

  return (
    <section
      id="recycling"
      role="region"
      aria-labelledby="recycling-heading"
      className="border-t border-[#E4E7EC] bg-[#F7F9FC] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF4] text-[#006B4F] text-xs font-bold uppercase tracking-wider border border-[#009B70]/20">
            <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Circular Economy in Action</span>
          </span>

          <h2
            id="recycling-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
          >
            Turn Waste Into <span className="text-[#009B70]">Value.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
            By closing the loop between households and certified recycling processors, EcoSync diverts thousands of tonnes from Bhopal's Adampur Chhawani landfill every month.
          </p>
        </div>

        {/* 5-Step Process Flow: Households -> Collection -> Sorting -> Recycling -> Recovered Materials */}
        <div className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#475467] text-center">
            The 5-Stage Closed-Loop Recovery Pathway
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {loopStages.map((st, i) => (
              <div
                key={st.step}
                className="rounded-2xl border border-[#E4E7EC] bg-white p-4 text-center space-y-2 shadow-2xs hover:border-[#009B70]/40 transition"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#009B70] text-white text-xs font-black shadow-2xs">
                  {st.step}
                </span>
                <h3 className="text-sm font-bold text-[#101828]">{st.title}</h3>
                <p className="text-[11px] text-[#475467] leading-snug">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Environmental Metrics Grid */}
        <div className="rounded-3xl border border-[#E4E7EC] bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#006B4F]">
                Verified Civic Impact
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-[#101828] tracking-tight mt-0.5">
                Bhopal Environmental Recovery Metrics
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#475467] bg-[#F7F9FC] px-3 py-1.5 rounded-xl border border-[#E4E7EC]">
              Audited Under Swachh Bharat Norms
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {/* Metric 1 */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467] block">
                Recyclable Waste Recovered
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#101828] tabular-nums">
                128,450 kg
              </p>
              <p className="text-xs text-[#006B4F] font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" aria-hidden="true" />
                <span>+18.4% month-over-month</span>
              </p>
            </div>

            {/* Metric 2 */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467] block">
                Landfill Diversion Rate
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#101828] tabular-nums">
                89.4%
              </p>
              <p className="text-xs text-[#475467]">
                Adampur Chhawani Landfill Diversion
              </p>
            </div>

            {/* Metric 3 */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467] block">
                Certified Recycler Hubs
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#101828] tabular-nums">
                18 Partners
              </p>
              <p className="text-xs text-[#006B4F] font-semibold">
                CPCB &amp; MPPCB Verified
              </p>
            </div>

            {/* Metric 4 */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467] block">
                Emissions Avoided
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#101828] tabular-nums">
                412 MT
              </p>
              <p className="text-xs text-[#006B4F] font-semibold">
                CO₂ equivalent averted
              </p>
            </div>

            {/* Metric 5 */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#475467] block">
                Active Households
              </span>
              <p className="text-2xl sm:text-3xl font-black text-[#101828] tabular-nums">
                14,200+
              </p>
              <p className="text-xs text-[#475467]">
                Participating across 85 wards
              </p>
            </div>
          </div>

          {/* Environmental Calculation Methodology Explanation */}
          <div className="p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#E4E7EC] flex items-start gap-2.5 text-xs text-[#475467]">
            <Info className="h-4 w-4 text-[#006B4F] shrink-0 mt-0.5" aria-hidden="true" />
            <p className="leading-relaxed">
              <strong>Calculation Methodology:</strong> Carbon emissions averted are calculated using EPA Waste Reduction Model (WARM v15) and Central Pollution Control Board (CPCB) solid waste conversion coefficients: 1.1 kg CO₂e/kg for wet organics diverted from methane-producing landfills to aerobic composting, 2.4 kg CO₂e/kg for clean plastics and cardboard, and 5.2 kg CO₂e/kg for recovery of secondary metals and e-waste.
            </p>
          </div>
        </div>

        {/* Standardized 4-Stream Sorting Guide Cards */}
        <div className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h3 className="text-2xl font-bold text-[#101828] tracking-tight">
              Standardized 4-Stream Sorting Guide
            </h3>
            <p className="text-xs text-[#475467]">
              Adhering to municipal segregation protocols unlocks top tier citizen rewards
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Wet Stream */}
            <div className="rounded-3xl border border-lime-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-100 text-lime-800 font-bold">
                <Leaf className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-lime-800">Green Stream</span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Wet / Organic</h4>
                <p className="text-xs text-[#475467] mt-1">Diverted directly to ward aerobic composting.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-[#475467]">
                <p className="font-bold text-slate-900">Allowed items:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Cooked &amp; raw food scraps</li>
                  <li>Vegetable &amp; fruit peels</li>
                  <li>Garden leaves &amp; flowers</li>
                  <li>Tea bags &amp; coffee grounds</li>
                </ul>
              </div>
            </div>

            {/* Dry Stream */}
            <div className="rounded-3xl border border-blue-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-800 font-bold">
                <Recycle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">Blue Stream</span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Dry Recyclables</h4>
                <p className="text-xs text-[#475467] mt-1">Traded via certified recycler marketplace.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-[#475467]">
                <p className="font-bold text-slate-900">Allowed items:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>PET bottles &amp; clean plastics</li>
                  <li>Cardboard cartons &amp; papers</li>
                  <li>Aluminium cans &amp; metal foil</li>
                  <li>Clean glass jars &amp; bottles</li>
                </ul>
              </div>
            </div>

            {/* Hazardous Stream */}
            <div className="rounded-3xl border border-rose-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 font-bold">
                <Shield className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">Red Stream</span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Domestic Hazardous</h4>
                <p className="text-xs text-[#475467] mt-1">Secure industrial containment &amp; treatment.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-[#475467]">
                <p className="font-bold text-slate-900">Handle with caution:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Cleaning solvents &amp; bleach</li>
                  <li>Paints, lacquers &amp; thinners</li>
                  <li>Pesticides &amp; chemical sprays</li>
                  <li>Expired pharmaceuticals</li>
                </ul>
              </div>
            </div>

            {/* E-Waste Stream */}
            <div className="rounded-3xl border border-purple-200 bg-white p-6 space-y-4 shadow-xs">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-800 font-bold">
                <Coins className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">Purple Stream</span>
                <h4 className="text-lg font-black text-slate-900 mt-0.5">Electronic Waste</h4>
                <p className="text-xs text-[#475467] mt-1">High-yield EPR certified circuit recovery.</p>
              </div>
              <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-[#475467]">
                <p className="font-bold text-slate-900">Eligible items:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                  <li>Smartphones, tablets &amp; laptops</li>
                  <li>Cables, chargers &amp; adapters</li>
                  <li>Motherboards &amp; PC components</li>
                  <li>Rechargeable lithium batteries</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

