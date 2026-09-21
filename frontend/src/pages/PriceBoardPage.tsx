import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  Calculator,
  CheckCircle2,
  Coins,
  Cpu,
  FileCheck2,
  Filter,
  Flame,
  Layers,
  Leaf,
  LogOut,
  MapPin,
  Recycle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  X
} from 'lucide-react';
import { api } from '../lib/api';
import type { MaterialType, PublicRate, Zone } from '../lib/types';
import { useSessionStore } from '../store/session';

interface MaterialConfig {
  label: string;
  category: string;
  defaultRate: number;
  co2Factor: number;
  pointsFactor: number;
  badgeBg: string;
  badgeColor: string;
  accentBg: string;
  icon: typeof Recycle;
  description: string;
}

const MATERIAL_CONFIGS: Record<MaterialType, MaterialConfig> = {
  plastic: {
    label: 'Plastics (PET & HDPE)',
    category: 'Plastics',
    defaultRate: 18.5,
    co2Factor: 1.5,
    pointsFactor: 10,
    badgeBg: 'bg-amber-50 border-amber-200',
    badgeColor: 'text-amber-800',
    accentBg: 'from-amber-500/10 to-orange-500/10',
    icon: Recycle,
    description: 'Clean drinking water bottles, shampoo jugs, detergent tubs (PET/HDPE).'
  },
  paper: {
    label: 'Paper & OCC Cardboard',
    category: 'Cellulose',
    defaultRate: 14.0,
    co2Factor: 1.2,
    pointsFactor: 8,
    badgeBg: 'bg-blue-50 border-blue-200',
    badgeColor: 'text-blue-800',
    accentBg: 'from-blue-500/10 to-sky-500/10',
    icon: Layers,
    description: 'Corrugated cartons, packaging boxes, newspapers, magazines, office paper.'
  },
  metal: {
    label: 'Metals & Scrap Alloys',
    category: 'Metallurgy',
    defaultRate: 118.0,
    co2Factor: 3.8,
    pointsFactor: 25,
    badgeBg: 'bg-purple-50 border-purple-200',
    badgeColor: 'text-purple-800',
    accentBg: 'from-purple-500/10 to-indigo-500/10',
    icon: Scale,
    description: 'Aluminium cans, brass fixtures, copper wiring, tinplate containers.'
  },
  e_waste: {
    label: 'E-Waste & Electronics',
    category: 'High-Tech',
    defaultRate: 88.0,
    co2Factor: 5.2,
    pointsFactor: 30,
    badgeBg: 'bg-rose-50 border-rose-200',
    badgeColor: 'text-rose-800',
    accentBg: 'from-rose-500/10 to-red-500/10',
    icon: Cpu,
    description: 'Decommissioned smartphones, PC motherboards, chargers, lithium cells.'
  },
  glass: {
    label: 'Glass Containers',
    category: 'Silicates',
    defaultRate: 4.5,
    co2Factor: 0.8,
    pointsFactor: 4,
    badgeBg: 'bg-emerald-50 border-emerald-200',
    badgeColor: 'text-emerald-800',
    accentBg: 'from-emerald-500/10 to-teal-500/10',
    icon: Leaf,
    description: 'Intact glass bottles, jars, and cullet sorted by flint, amber, and green.'
  }
};

const MUNICIPAL_BENCHMARKS: Array<{
  material: MaterialType;
  benchmarkRate: number;
  grade: string;
  minWeightKg: number;
  trend: string;
}> = [
  { material: 'plastic', benchmarkRate: 18.5, grade: 'PET Bottle Grade A', minWeightKg: 5, trend: '+₹1.50 this week' },
  { material: 'paper', benchmarkRate: 14.0, grade: 'Corrugated OCC Boxes', minWeightKg: 10, trend: 'Stable' },
  { material: 'metal', benchmarkRate: 120.0, grade: 'Clean Extruded Aluminium', minWeightKg: 2, trend: '+₹4.00 this week' },
  { material: 'e_waste', benchmarkRate: 90.0, grade: 'Consumer Electronics PCB', minWeightKg: 1, trend: '+₹5.00 this week' },
  { material: 'glass', benchmarkRate: 4.5, grade: 'Beverage Flint Glass', minWeightKg: 10, trend: 'Stable' },
];

export function PriceBoardPage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);

  // Filter States
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculator States
  const [calcMaterial, setCalcMaterial] = useState<MaterialType>('plastic');
  const [calcWeight, setCalcWeight] = useState<number>(20);

  // Sell Scrap Modal State
  const [sellModalData, setSellModalData] = useState<{
    recyclerId?: number;
    recyclerName?: string;
    material: MaterialType;
    ratePerKg: number;
  } | null>(null);
  const [sellModalWeight, setSellModalWeight] = useState<number>(15);
  const [sellModalAddress, setSellModalAddress] = useState<string>('');
  const [sellSuccessMsg, setSellSuccessMsg] = useState<string | null>(null);

  // Query Zones
  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: async () => {
      try {
        const res = await api.get<Zone[]>('/zones');
        return res.data;
      } catch {
        return [
          { id: 1, name: 'Indiranagar Ward', code: 'BLR-W01', city: 'Bengaluru', created_at: '' },
          { id: 2, name: 'Koramangala Ward', code: 'BLR-W02', city: 'Bengaluru', created_at: '' },
          { id: 3, name: 'Whitefield Ward', code: 'BLR-W03', city: 'Bengaluru', created_at: '' }
        ];
      }
    }
  });

  // Query Live Rates from API
  const { data: apiRates = [], isLoading } = useQuery<PublicRate[]>({
    queryKey: ['public-rates', selectedZone, selectedMaterial],
    queryFn: async () => {
      try {
        const params: Record<string, string> = {};
        if (selectedZone !== 'all') params.zone_id = selectedZone;
        if (selectedMaterial !== 'all') params.material = selectedMaterial;
        const res = await api.get<PublicRate[]>('/recyclers/rates', { params });
        return res.data;
      } catch {
        return [];
      }
    }
  });

  // Calculate live estimate in interactive calculator
  const calcConfig = MATERIAL_CONFIGS[calcMaterial];
  const estEarnings = useMemo(() => {
    return Math.round(calcWeight * calcConfig.defaultRate);
  }, [calcWeight, calcConfig]);

  const estPoints = useMemo(() => {
    return Math.round(calcWeight * calcConfig.pointsFactor);
  }, [calcWeight, calcConfig]);

  const estCO2 = useMemo(() => {
    return (calcWeight * calcConfig.co2Factor).toFixed(1);
  }, [calcWeight, calcConfig]);

  // Combine live rates or benchmark fallbacks
  const displayRates = useMemo(() => {
    if (apiRates.length > 0) {
      let filtered = [...apiRates];
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (r) =>
            r.recycler_business_name.toLowerCase().includes(q) ||
            r.material.toLowerCase().includes(q)
        );
      }
      return filtered;
    }

    // Fallback benchmark rates
    return MUNICIPAL_BENCHMARKS.filter((bm) => {
      if (selectedMaterial !== 'all' && bm.material !== selectedMaterial) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          bm.material.toLowerCase().includes(q) ||
          bm.grade.toLowerCase().includes(q)
        );
      }
      return true;
    }).map((bm, index) => ({
      id: index + 100,
      recycler_id: 1,
      recycler_business_name: 'Municipal Certified Aggregator',
      service_zone_ids: [1, 2, 3],
      material: bm.material,
      rate_per_kg: bm.benchmarkRate,
      effective_from: new Date().toISOString()
    }));
  }, [apiRates, selectedMaterial, searchQuery]);

  const handleOpenSellModal = (
    material: MaterialType,
    ratePerKg: number,
    recyclerId?: number,
    recyclerName?: string
  ) => {
    setSellModalData({
      material,
      ratePerKg,
      recyclerId,
      recyclerName: recyclerName || 'Municipal Verified Recycler'
    });
    setSellModalWeight(calcWeight || 15);
    setSellModalAddress(user?.address || '12, 100ft Road, Indiranagar');
    setSellSuccessMsg(null);
  };

  const handleConfirmSell = () => {
    if (!user) {
      navigate('/login/citizen');
      return;
    }
    if (user.role === 'citizen') {
      navigate(
        `/dashboard/user?tab=marketplace&recycler_id=${sellModalData?.recyclerId ?? 1}&material=${sellModalData?.material}&weight=${sellModalWeight}`
      );
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] antialiased">
      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20 transition group-hover:scale-105">
              <Recycle className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-xl font-black tracking-tight text-slate-900 leading-tight">
                Eco<span className="text-emerald-600">Sync</span>
              </span>
              <span className="block -mt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Circular Scrap Board
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <Link to="/" className="hover:text-emerald-700 transition">
              Home
            </Link>
            <span className="text-emerald-600 font-bold border-b-2 border-emerald-600 pb-0.5">
              Scrap Rates Board
            </span>
            <Link to="/login/citizen" className="hover:text-emerald-700 transition">
              Citizen Portal
            </Link>
            <Link to="/login/driver" className="hover:text-emerald-700 transition">
              Driver Field Console
            </Link>
            <Link to="/login/admin" className="hover:text-emerald-700 transition">
              Municipal Admin
            </Link>
          </nav>

          {/* User Auth or Quick Links */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition"
                >
                  <UserCheck className="h-4 w-4 text-emerald-600" />
                  {user.name} ({user.role})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    clearSession();
                    navigate('/');
                  }}
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 transition"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Join Citizen Network <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <section className="relative mb-10 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 sm:p-12 text-white shadow-2xl">
          <div className="pointer-events-none absolute -right-10 -top-10 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 right-40 h-80 w-80 rounded-full bg-lime-500/15 blur-3xl" />

          <div className="relative z-10 max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              CPCB-Compliant Circular Economy Marketplace
            </div>
            <h1 className="text-3xl font-black tracking-tight leading-tight sm:text-5xl mb-4">
              Fair, Transparent Pricing for Segregated Recyclables
            </h1>
            <p className="text-base text-slate-300 leading-relaxed sm:text-lg mb-8">
              Browse real-time scrap purchasing rates posted by verified municipal recycling partners.
              Turn clean segregated waste into recorded earnings and generate official Extended
              Producer Responsibility (EPR) credits.
            </p>

            {/* Badges / Guarantees Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>CPCB-Aligned Ledger</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <Scale className="h-4 w-4 text-amber-400 shrink-0" />
                <span>100% Calibrated Scales</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <Coins className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Instant Digital Payouts</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <TrendingUp className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Live Benchmark Rates</span>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Instant Scrap Value & Impact Calculator */}
        <section className="mb-12 rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                <Calculator className="h-4 w-4" /> Live Estimator
              </span>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">
                Instant Scrap Value & CO₂ Offset Calculator
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Select your recyclable waste stream and weight to project your direct earnings and environmental impact.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase">Quick:</span>
              {[5, 15, 30, 50, 100].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCalcWeight(preset)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    calcWeight === preset
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset}kg
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Stream selector & slider */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category Pills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Select Recyclable Stream
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(Object.keys(MATERIAL_CONFIGS) as MaterialType[]).map((mat) => {
                    const cfg = MATERIAL_CONFIGS[mat];
                    const Icon = cfg.icon;
                    const isSelected = calcMaterial === mat;
                    return (
                      <button
                        key={mat}
                        type="button"
                        onClick={() => setCalcMaterial(mat)}
                        className={`flex items-center gap-2.5 rounded-2xl p-3 text-left transition border ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-600/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{cfg.label}</p>
                          <p className="text-[11px] font-semibold text-emerald-700">
                            ₹{cfg.defaultRate.toFixed(2)}/kg
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Weight Slider */}
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200/70">
                <div className="flex items-center justify-between mb-3">
                  <label htmlFor="calc-weight-slider" className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Estimated Net Weight
                  </label>
                  <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xl font-black text-slate-900">{calcWeight}</span>
                    <span className="text-xs font-bold text-slate-400">kg</span>
                  </div>
                </div>

                <input
                  id="calc-weight-slider"
                  type="range"
                  min="1"
                  max="150"
                  step="1"
                  value={calcWeight}
                  onChange={(e) => setCalcWeight(Number(e.target.value))}
                  aria-label="Estimated scrap weight in kilograms"
                  className="w-full accent-emerald-600 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                  <span>1 kg (Household)</span>
                  <span>50 kg (Society Bulk)</span>
                  <span>150 kg (Commercial)</span>
                </div>
              </div>
            </div>

            {/* Right: Calculated Value Panel */}
            <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

              <div className="relative z-10 space-y-5">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Estimated Doorstep Cash Payout
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-400">
                      ₹{estEarnings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">direct UPI / cash</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-400" /> EcoSync Points
                    </span>
                    <p className="text-lg font-black text-amber-300 mt-0.5">+{estPoints} pts</p>
                    <span className="text-[10px] text-slate-400">Bill credit eligible</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-emerald-400" /> Carbon Offset
                    </span>
                    <p className="text-lg font-black text-emerald-300 mt-0.5">{estCO2} kg</p>
                    <span className="text-[10px] text-slate-400">CO₂e diverted</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleOpenSellModal(
                      calcMaterial,
                      calcConfig.defaultRate,
                      1,
                      'Municipal Certified Aggregator'
                    )
                  }
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-[0.98]"
                >
                  <Coins className="h-4 w-4" /> Book Pickup For This Scrap
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Scrap Price Board Directory */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <TrendingUp className="h-4 w-4 text-emerald-600" /> Verified Rate Card Directory
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-0.5">
                Current Scrap Purchase Rates by Stream
              </h2>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search material or recycler..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            {/* Material Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2 flex items-center gap-1">
                <Filter className="h-3.5 w-3.5" /> Stream:
              </span>
              <button
                type="button"
                onClick={() => setSelectedMaterial('all')}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedMaterial === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Materials
              </button>
              {(Object.keys(MATERIAL_CONFIGS) as MaterialType[]).map((mat) => (
                <button
                  key={mat}
                  type="button"
                  onClick={() => setSelectedMaterial(mat)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition capitalize ${
                    selectedMaterial === mat
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {mat.replace('_', '-')}
                </button>
              ))}
            </div>

            {/* Zone Selector */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <MapPin className="h-4 w-4 text-slate-400" />
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                aria-label="Filter scrap rates by municipal zone"
                className="text-xs font-semibold bg-slate-100 border-none rounded-xl px-3 py-2 text-slate-700 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Service Zones</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rates Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
              ))}
            </div>
          ) : displayRates.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Coins className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No active rates found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                No verified rates match your selected search or zone filter. Try selecting &quot;All Materials&quot; or reset search filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedMaterial('all');
                  setSelectedZone('all');
                  setSearchQuery('');
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayRates.map((rate) => {
                const config =
                  MATERIAL_CONFIGS[rate.material] || MATERIAL_CONFIGS.plastic;
                const Icon = config.icon;
                const numRate = Number(rate.rate_per_kg);

                return (
                  <div
                    key={rate.id}
                    className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-emerald-200"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${config.badgeBg} ${config.badgeColor}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${config.badgeBg} ${config.badgeColor}`}
                            >
                              {config.category}
                            </span>
                            <h3 className="font-black text-slate-900 text-base mt-0.5">
                              {config.label}
                            </h3>
                          </div>
                        </div>

                        {/* Price Tag */}
                        <div className="text-right">
                          <span className="text-2xl sm:text-3xl font-black text-slate-950">
                            ₹{numRate.toFixed(2)}
                          </span>
                          <span className="block text-[11px] font-bold text-slate-400">
                            / kilogram
                          </span>
                        </div>
                      </div>

                      {/* Recycler Info */}
                      <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                        {config.description}
                      </p>

                      <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 mb-4 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-500">Aggregator:</span>
                          <span className="font-bold text-slate-800">
                            {rate.recycler_business_name}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-500">Compliance:</span>
                          <span className="font-bold text-emerald-700 flex items-center gap-1">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            CPCB Registered
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-500">EPR Credits:</span>
                          <span className="font-bold text-purple-700 flex items-center gap-1">
                            <FileCheck2 className="h-3.5 w-3.5 text-purple-600" />
                            Official Certificate
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom CTA */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 font-medium">
                        Effective: {new Date(rate.effective_from).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          handleOpenSellModal(
                            rate.material,
                            numRate,
                            rate.recycler_id,
                            rate.recycler_business_name
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-emerald-600/20"
                      >
                        Sell Scrap <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Circular Economy Transparency Standards */}
        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              <ShieldCheck className="h-4 w-4" /> Integrity Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Zero Exploitation. 100% Traceable Transactions.
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              EcoSync eliminates unfair street middleman markups by connecting residents and housing societies
              directly with licensed material recovery facilities (MRFs).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Scale className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Certified Digital Scales
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Collection partners are mandated to use electronic scales calibrated under Legal Metrology standards.
                No rigged analog scales or hidden tare subtractions.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                CPCB Digital Receipts
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every transaction issues a verifiable cryptographic receipt detailing material type, gross weight,
                unit rate, and EPR certificate serial numbers.
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
              <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Coins className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-2">
                Dual Benefit: Cash + EcoPoints
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive instant bank/UPI payouts for scrap weight, plus bonus municipal EcoPoints to redeem towards
                property tax rebates and utility bill credits.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modal for Selling Scrap */}
      {sellModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              type="button"
              onClick={() => setSellModalData(null)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 rounded-xl p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <Coins className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Sell Segregated {MATERIAL_CONFIGS[sellModalData.material].label}
                </h3>
                <p className="text-xs text-slate-500">
                  Purchaser: {sellModalData.recyclerName} · Rate: ₹{sellModalData.ratePerKg.toFixed(2)}/kg
                </p>
              </div>
            </div>

            {sellSuccessMsg ? (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold text-emerald-900">Pickup Request Scheduled!</h4>
                <p className="text-xs text-emerald-700">{sellSuccessMsg}</p>
                <button
                  type="button"
                  onClick={() => setSellModalData(null)}
                  className="mt-4 px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="sell-weight-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Approximate Scrap Weight (kg)
                  </label>
                  <input
                    id="sell-weight-input"
                    type="number"
                    min="1"
                    max="500"
                    value={sellModalWeight}
                    onChange={(e) => setSellModalWeight(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label htmlFor="sell-address-input" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Address / Ward
                  </label>
                  <input
                    id="sell-address-input"
                    type="text"
                    value={sellModalAddress}
                    onChange={(e) => setSellModalAddress(e.target.value)}
                    placeholder="Enter doorstep address for collection..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/70 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rate Applied:</span>
                    <span className="font-bold text-slate-900">
                      ₹{sellModalData.ratePerKg.toFixed(2)} / kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Total Payout:</span>
                    <span className="font-black text-emerald-700 text-sm">
                      ₹{(sellModalWeight * sellModalData.ratePerKg).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bonus EcoPoints:</span>
                    <span className="font-bold text-amber-600">
                      +{sellModalWeight * 10} pts
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSellModalData(null)}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSell}
                    className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 flex items-center justify-center gap-1.5"
                  >
                    {user ? 'Confirm Pickup Request' : 'Login to Confirm'} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enterprise Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-xs">
          <div>
            <div className="flex items-center gap-2 text-white font-black text-lg mb-3">
              <Recycle className="h-5 w-5 text-emerald-400" /> EcoSync Circular
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              Empowering smart municipal waste operations and fair circular economics across urban wards.
            </p>
            <p className="text-[11px] text-slate-500">
              Regulated by Central Pollution Control Board (CPCB) Guidelines.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/login/citizen" className="hover:text-emerald-400 transition">
                  Citizen Portal
                </Link>
              </li>
              <li>
                <Link to="/login/driver" className="hover:text-emerald-400 transition">
                  Driver Logistics PWA
                </Link>
              </li>
              <li>
                <Link to="/login/admin" className="hover:text-emerald-400 transition">
                  Municipal Command Center
                </Link>
              </li>
              <li>
                <Link to="/rates" className="text-emerald-400 font-semibold">
                  Scrap Price Board
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              Recyclable Categories
            </h4>
            <ul className="space-y-2">
              <li>Plastics (PET, HDPE, PP)</li>
              <li>Paper, Cartons & Cardboard</li>
              <li>Aluminium, Copper & Metals</li>
              <li>Electronic Waste (E-Waste)</li>
              <li>Glass Bottles & Cullet</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">
              Civic Helplines
            </h4>
            <p className="mb-2">Toll-free Municipal Grievance: 1800-425-SYNC</p>
            <p className="mb-2">WhatsApp Pickup Desk: +91 80 2299 0001</p>
            <p>Email: support@ecosync.org</p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} EcoSync Municipal Platform. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/" className="hover:text-slate-300">Privacy Policy</Link>
            <Link to="/" className="hover:text-slate-300">Terms of Service</Link>
            <Link to="/" className="hover:text-slate-300">CPCB EPR Standards</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
