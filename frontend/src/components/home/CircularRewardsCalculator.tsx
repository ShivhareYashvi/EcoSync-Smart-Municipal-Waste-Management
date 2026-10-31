import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Info,
  Leaf,
  Coins,
  Scale,
  CheckCircle2,
} from 'lucide-react';
import { useSessionStore } from '../../store/session';

export type WasteCategory = 'wet' | 'dry' | 'hazardous' | 'e_waste';

interface CategoryConfig {
  id: WasteCategory;
  name: string;
  streamName: string;
  colorBorder: string;
  colorBg: string;
  colorText: string;
  badgeBg: string;
  co2Factor: number;
  benchmarkRatePerKg: number;
  unit: string;
}

const CATEGORIES: Record<WasteCategory, CategoryConfig> = {
  wet: {
    id: 'wet',
    name: 'Wet Organic',
    streamName: 'Green Stream',
    colorBorder: 'border-lime-500',
    colorBg: 'bg-lime-50/70',
    colorText: 'text-lime-900',
    badgeBg: 'bg-lime-100 text-lime-800',
    co2Factor: 1.1,
    benchmarkRatePerKg: 2.0, // Composting rebate benchmark
    unit: 'kg',
  },
  dry: {
    id: 'dry',
    name: 'Dry Recyclables',
    streamName: 'Blue Stream',
    colorBorder: 'border-blue-500',
    colorBg: 'bg-blue-50/70',
    colorText: 'text-blue-900',
    badgeBg: 'bg-blue-100 text-blue-800',
    co2Factor: 2.4,
    benchmarkRatePerKg: 14.0, // Benchmark mixed recyclables
    unit: 'kg',
  },
  hazardous: {
    id: 'hazardous',
    name: 'Domestic Hazardous',
    streamName: 'Red Stream',
    colorBorder: 'border-rose-500',
    colorBg: 'bg-rose-50/70',
    colorText: 'text-rose-900',
    badgeBg: 'bg-rose-100 text-rose-800',
    co2Factor: 3.8,
    benchmarkRatePerKg: 0.0, // Safe disposal incentive
    unit: 'kg',
  },
  e_waste: {
    id: 'e_waste',
    name: 'E-Waste',
    streamName: 'Purple Stream',
    colorBorder: 'border-purple-500',
    colorBg: 'bg-purple-50/70',
    colorText: 'text-purple-900',
    badgeBg: 'bg-purple-100 text-purple-800',
    co2Factor: 5.2,
    benchmarkRatePerKg: 88.0, // High-value benchmark
    unit: 'kg',
  },
};

export const CircularRewardsCalculator: React.FC = () => {
  const user = useSessionStore((s) => s.user);

  // 3 Structured Steps
  const [selectedCategory, setSelectedCategory] = useState<WasteCategory>('dry');
  const [weightKg, setWeightKg] = useState<number>(14.5);
  const [isSegregated, setIsSegregated] = useState<boolean>(true);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  const activeConfig = CATEGORIES[selectedCategory];

  // Configured Reward Formulas (CPCB Circular Gamification Standard)
  // Base 50 points if cleanly segregated; weight bonus min(kg * 5, 50); 1.25x streak multiplier
  const basePoints = isSegregated ? 50 : 0;
  const weightBonus = isSegregated ? Math.min(Math.round(weightKg * 5), 50) : 0;
  const streakMultiplier = isSegregated ? 1.25 : 1.0;
  const calculatedPoints = Math.round((basePoints + weightBonus) * streakMultiplier);

  // Carbon Impact Calculation (EPA WARM & CPCB carbon factors)
  const co2AvoidedKg = (weightKg * activeConfig.co2Factor).toFixed(1);

  // Estimated Cash Payout based on live benchmark rates
  const estCashPayout = Math.round(weightKg * activeConfig.benchmarkRatePerKg);

  const handleReset = () => {
    setSelectedCategory('dry');
    setWeightKg(14.5);
    setIsSegregated(true);
    setShowFormulaDetails(false);
  };

  return (
    <div
      role="region"
      aria-label="Circular Rewards Calculator"
      className="rounded-3xl border border-[#E4E7EC] bg-white p-6 sm:p-7 shadow-xl shadow-slate-900/5 space-y-5"
    >
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 rounded-full bg-[#009B70] ring-4 ring-[#EAFBF4] animate-pulse" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-bold text-[#101828]">
              Circular Rewards Calculator
            </h3>
            <p className="text-[11px] text-[#475467]">
              Simulate weight, points &amp; verified municipal impact
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-[#EAFBF4] px-2.5 py-1 text-[10px] font-bold text-[#006B4F] border border-[#009B70]/20">
            {user?.ward_number ? `Ward ${user.ward_number} · Bhopal` : 'Ward 48 · Arera Colony'}
          </span>
          <button
            type="button"
            onClick={handleReset}
            title="Reset to default calculator values"
            aria-label="Reset calculator to defaults"
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-[#009B70]"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1: Select Waste Category */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label id="waste-cat-label" className="text-xs font-bold uppercase tracking-wider text-[#475467] flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px] font-black">1</span>
              <span>Select Waste Category</span>
            </label>
            <span className="text-[10px] font-semibold text-[#006B4F]">
              {activeConfig.streamName}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="waste-cat-label"
            className="grid grid-cols-2 gap-2"
          >
            {(Object.values(CATEGORIES) as CategoryConfig[]).map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`rounded-xl border p-2.5 text-xs font-bold transition text-left flex flex-col justify-between ${
                    isSelected
                      ? `${cat.colorBorder} ${cat.colorBg} ${cat.colorText} ring-2 ring-[#009B70]/20 shadow-xs`
                      : 'border-slate-200 bg-white text-[#475467] hover:bg-slate-50'
                  }`}
                >
                  <span className="leading-tight">{cat.name}</span>
                  <span className="text-[9px] font-semibold opacity-75 mt-1 block">
                    {cat.benchmarkRatePerKg > 0
                      ? `~₹${cat.benchmarkRatePerKg}/kg benchmark`
                      : 'Safe Disposal Certified'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Enter Collected Weight */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="weight-slider" className="text-xs font-bold uppercase tracking-wider text-[#475467] flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-white text-[9px] font-black">2</span>
              <span>Collected Weight</span>
            </label>
            <span className="text-sm font-black text-[#009B70] tabular-nums">
              {weightKg.toFixed(1)} kg
            </span>
          </div>

          <input
            id="weight-slider"
            type="range"
            min="1"
            max="50"
            step="0.5"
            value={weightKg}
            onChange={(e) => setWeightKg(parseFloat(e.target.value))}
            aria-label="Weight in kilograms"
            aria-valuemin={1}
            aria-valuemax={50}
            aria-valuenow={weightKg}
            className="w-full accent-[#009B70] h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer focus-visible:outline-2 focus-visible:outline-[#009B70]"
          />

          {/* Quick preset weight buttons */}
          <div className="mt-2 flex gap-1.5" role="group" aria-label="Preset weight options">
            {[5, 10, 15, 25, 40].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setWeightKg(preset)}
                aria-pressed={weightKg === preset}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition ${
                  weightKg === preset
                    ? 'bg-[#101828] text-white border-[#101828]'
                    : 'bg-slate-50 text-[#475467] border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset} kg
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Segregation Quality Toggle */}
        <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3.5 border border-slate-200/80">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-xl ${isSegregated ? 'bg-emerald-100 text-[#006B4F]' : 'bg-slate-200 text-slate-500'}`}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <label htmlFor="segregation-toggle" className="text-xs font-bold text-[#101828] block cursor-pointer">
                Proper Source Segregation
              </label>
              <span className="text-[10px] text-[#475467] block">
                {isSegregated
                  ? 'Active: Unlocks 1.25x streak bonus & property rebate'
                  : 'Contaminated / Mixed: 0 bonus points awarded'}
              </span>
            </div>
          </div>

          <button
            id="segregation-toggle"
            type="button"
            role="switch"
            aria-checked={isSegregated}
            onClick={() => setIsSegregated(!isSegregated)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#009B70] ${
              isSegregated ? 'bg-[#009B70]' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-xs ${
                isSegregated ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Display Results Card */}
        <div className="rounded-2xl border border-[#009B70]/30 bg-[#EAFBF4]/80 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#006B4F] block">
                Estimated Citizen Reward
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-3xl font-black text-[#101828] tabular-nums">
                  +{calculatedPoints}
                </span>
                <span className="text-xs font-extrabold text-[#006B4F]">EcoPoints</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold text-[#006B4F] block">
                Carbon Offset
              </span>
              <p className="text-lg font-black text-[#101828] tabular-nums mt-0.5">
                ~{co2AvoidedKg} kg <span className="text-xs font-normal text-[#475467]">CO₂e</span>
              </p>
            </div>
          </div>

          {estCashPayout > 0 && (
            <div className="pt-2.5 border-t border-[#009B70]/20 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#006B4F]">
                Est. Recycler Cash Payout:
              </span>
              <span className="font-mono font-black text-[#101828] text-sm">
                ₹{estCashPayout}
              </span>
            </div>
          )}

          {/* Current Inputs Recap */}
          <div className="pt-2 border-t border-[#009B70]/15 flex items-center justify-between text-[10px] text-[#475467]">
            <span>Category: <strong>{activeConfig.name}</strong></span>
            <span>Weight: <strong>{weightKg} kg</strong></span>
            <span>Segregated: <strong>{isSegregated ? 'Yes (Verified)' : 'No'}</strong></span>
          </div>
        </div>

        {/* Calculation Explanation Accordion */}
        <div>
          <button
            type="button"
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            aria-expanded={showFormulaDetails}
            className="flex items-center gap-1.5 text-[11px] font-bold text-[#006B4F] hover:underline"
          >
            <Info className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{showFormulaDetails ? 'Hide calculation details' : 'How is this calculated?'}</span>
          </button>

          {showFormulaDetails && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-[#475467] space-y-1 animate-in fade-in duration-150">
              <p>
                <strong>Points Formula:</strong> Base 50 pts (clean segregation) + min(weight × 5, 50 pts) × 1.25 streak multiplier under Swachh Bharat CPCB circular guidelines.
              </p>
              <p>
                <strong>Carbon Impact:</strong> Factored at {activeConfig.co2Factor} kg CO₂e offset per kg based on EPA WARM landfill avoidance benchmarks.
              </p>
              <p className="text-[10px] text-slate-400">
                *Cash payouts represent live Bhopal benchmark indicative prices. Confirmed payment is determined at digital point-of-weighment.
              </p>
            </div>
          )}
        </div>

        {/* Primary Booking Link */}
        <Link
          to={user ? "/dashboard/user" : "/login"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#101828] py-3 text-xs font-bold text-white transition hover:bg-slate-800 shadow-md focus-visible:ring-2 focus-visible:ring-[#009B70]"
        >
          <span>{user ? `Schedule Collection as ${user.name}` : 'Schedule Collection / Register Household'}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
};

