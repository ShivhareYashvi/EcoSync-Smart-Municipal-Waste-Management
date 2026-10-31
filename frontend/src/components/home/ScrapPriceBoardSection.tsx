import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Filter,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Building2,
} from 'lucide-react';

export interface ScrapMaterial {
  id: string;
  name: string;
  category: 'plastics' | 'metals' | 'paper' | 'e_waste' | 'glass';
  ratePerKg: number;
  trend: string;
  trendType: 'up' | 'down' | 'stable';
  lastUpdated: string;
  primaryBuyer: string;
  minimumLotKg: number;
}

export const SCRAP_MATERIALS: ScrapMaterial[] = [
  { id: 'm-01', name: 'PET Plastic Bottles (Clear)', category: 'plastics', ratePerKg: 18.5, trend: '+₹1.50/kg this week', trendType: 'up', lastUpdated: 'Today, 08:30 AM', primaryBuyer: 'Bhopal GreenPolymers MRF', minimumLotKg: 5 },
  { id: 'm-02', name: 'High-Density Polyethylene (HDPE)', category: 'plastics', ratePerKg: 24.0, trend: '+₹2.00/kg this week', trendType: 'up', lastUpdated: 'Today, 08:30 AM', primaryBuyer: 'MP Plastic Circular Ltd', minimumLotKg: 5 },
  { id: 'm-03', name: 'Corrugated Cardboard (OCC)', category: 'paper', ratePerKg: 14.0, trend: 'Stable', trendType: 'stable', lastUpdated: 'Yesterday, 06:00 PM', primaryBuyer: 'Central Kraft Mills', minimumLotKg: 10 },
  { id: 'm-04', name: 'Old Newspaper (ONP)', category: 'paper', ratePerKg: 12.5, trend: '-₹0.50/kg this week', trendType: 'down', lastUpdated: 'Yesterday, 06:00 PM', primaryBuyer: 'Bhopal Paper Recyclers', minimumLotKg: 5 },
  { id: 'm-05', name: 'Aluminium Cans & Castings', category: 'metals', ratePerKg: 120.0, trend: '+₹4.00/kg this week', trendType: 'up', lastUpdated: 'Today, 09:15 AM', primaryBuyer: 'Govindpura Smelters Hub', minimumLotKg: 2 },
  { id: 'm-06', name: 'Copper Wire & Piping Scrap', category: 'metals', ratePerKg: 460.0, trend: '+₹12.00/kg this week', trendType: 'up', lastUpdated: 'Today, 09:15 AM', primaryBuyer: 'Mandideep Metal Alloys', minimumLotKg: 1 },
  { id: 'm-07', name: 'Consumer E-Waste (Motherboards)', category: 'e_waste', ratePerKg: 180.0, trend: '+₹10.00/kg this week', trendType: 'up', lastUpdated: 'Today, 07:45 AM', primaryBuyer: 'CleanCircuit EPR Facility', minimumLotKg: 1 },
  { id: 'm-08', name: 'Mixed Domestic E-Waste (Appliances)', category: 'e_waste', ratePerKg: 88.0, trend: '+₹5.00/kg this week', trendType: 'up', lastUpdated: 'Today, 07:45 AM', primaryBuyer: 'CleanCircuit EPR Facility', minimumLotKg: 3 },
  { id: 'm-09', name: 'Flint Beverage Glass Bottles', category: 'glass', ratePerKg: 4.5, trend: 'Stable', trendType: 'stable', lastUpdated: '2 days ago', primaryBuyer: 'Madhya Bharat Glass Works', minimumLotKg: 15 },
];

export const ScrapPriceBoardSection: React.FC = () => {
  const [selectedCat, setSelectedCat] = useState<string>('all');

  const filteredMaterials = selectedCat === 'all'
    ? SCRAP_MATERIALS
    : SCRAP_MATERIALS.filter((m) => m.category === selectedCat);

  return (
    <section
      id="scrap"
      role="region"
      aria-labelledby="scrap-heading"
      className="border-t border-[#E4E7EC] bg-white py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF4] text-[#006B4F] text-xs font-bold uppercase tracking-wider border border-[#009B70]/20">
              <Coins className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Transparent Municipal Marketplace</span>
            </span>

            <h2
              id="scrap-heading"
              className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
            >
              Live Scrap <span className="text-[#009B70]">Price Board.</span>
            </h2>

            <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
              Real-time posted benchmark rates from certified Material Recovery Facilities across Bhopal. Turn household recyclables into direct civic cash or green rewards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/price-board"
              className="inline-flex items-center gap-2 rounded-xl bg-[#009B70] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#006B4F] transition focus-visible:ring-2 focus-visible:ring-[#009B70]"
            >
              <span>Explore Dedicated Price Board</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar" role="group" aria-label="Filter recyclable materials by category">
          <span className="text-xs font-bold uppercase text-[#475467] flex items-center gap-1 mr-2 shrink-0">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Category:</span>
          </span>
          {[
            { id: 'all', label: 'All Fractions' },
            { id: 'plastics', label: 'Plastics (PET/HDPE)' },
            { id: 'metals', label: 'Metals (Al/Cu)' },
            { id: 'paper', label: 'Paper & Cardboard' },
            { id: 'e_waste', label: 'E-Waste' },
            { id: 'glass', label: 'Glass' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedCat(tab.id)}
              aria-pressed={selectedCat === tab.id}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap border transition ${
                selectedCat === tab.id
                  ? 'bg-[#101828] text-white border-[#101828] shadow-xs'
                  : 'bg-white text-[#475467] border-[#E4E7EC] hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border border-[#E4E7EC] bg-white p-6 space-y-4 shadow-xs hover:border-[#009B70]/50 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-[#EAFBF4] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#006B4F]">
                    {item.category.replace('_', ' ')}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{item.lastUpdated}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#101828]">
                    {item.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-1.5">
                    <span className="text-3xl font-black text-[#101828] tabular-nums">
                      ₹{item.ratePerKg.toFixed(2)}
                    </span>
                    <span className="text-xs font-semibold text-[#475467]">/ kg</span>
                  </div>
                </div>

                {/* Trend Badge */}
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  {item.trendType === 'up' && (
                    <span className="inline-flex items-center gap-1 text-[#009B70] font-bold">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{item.trend}</span>
                    </span>
                  )}
                  {item.trendType === 'down' && (
                    <span className="inline-flex items-center gap-1 text-rose-600 font-bold">
                      <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{item.trend}</span>
                    </span>
                  )}
                  {item.trendType === 'stable' && (
                    <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Benchmark Stable</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Recycler Buyer & Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[#475467] truncate max-w-[170px]" title={item.primaryBuyer}>
                  Buyer: <strong>{item.primaryBuyer}</strong>
                </span>
                <Link
                  to="/dashboard/user"
                  className="font-bold text-[#006B4F] hover:underline"
                >
                  Sell Recyclables
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing Transparency Disclaimer */}
        <div className="rounded-2xl border border-slate-200 bg-[#F7F9FC] p-4 text-xs text-[#475467] flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#009B70] shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            <strong>Municipal Pricing Standard:</strong> Posted values represent active indicative benchmark quotes from CPCB-registered material recovery facilities in Bhopal. Final transaction receipts are locked upon digital weighment and contamination verification at point-of-collection.
          </p>
        </div>
      </div>
    </section>
  );
};

