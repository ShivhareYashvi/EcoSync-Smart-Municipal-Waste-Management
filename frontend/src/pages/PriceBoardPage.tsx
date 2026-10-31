import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  AlertCircle,
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Cpu,
  FileCheck2,
  Filter,
  Flame,
  Layers,
  Leaf,
  LogOut,
  MapPin,
  Plus,
  Recycle,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
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

  // Filter States
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Multi-Scrap Selection State: Users can choose 1 or multiple scrap items!
  const [scrapSelections, setScrapSelections] = useState<
    Record<MaterialType, { selected: boolean; weight: number }>
  >({
    paper: { selected: true, weight: 15 },
    plastic: { selected: true, weight: 8 },
    metal: { selected: false, weight: 3 },
    e_waste: { selected: false, weight: 2 },
    glass: { selected: false, weight: 5 },
  });

  // Doorstep Request Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pickupAddress, setPickupAddress] = useState(user?.address || 'Arera Colony, Ward 48, Bhopal');
  const [pickupDate, setPickupDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [pickupSlot, setPickupSlot] = useState('09:00 - 12:00 (Morning)');
  const [pickupNotes, setPickupNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Query Zones
  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: async () => {
      try {
        const res = await api.get<Zone[]>('/zones');
        return res.data;
      } catch {
        return [
          { id: 1, name: 'Bhopal Ward 48 (Arera Colony)', code: 'BPL-W48', city: 'Bhopal', created_at: '' },
          { id: 2, name: 'Bhopal Ward 52 (MP Nagar)', code: 'BPL-W52', city: 'Bhopal', created_at: '' },
          { id: 3, name: 'Bhopal Ward 65 (Kolar Road)', code: 'BPL-W65', city: 'Bhopal', created_at: '' }
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

  // Compute active rate map for quick calculation lookup
  const rateMap = useMemo(() => {
    const map: Record<MaterialType, number> = {
      plastic: MATERIAL_CONFIGS.plastic.defaultRate,
      paper: MATERIAL_CONFIGS.paper.defaultRate,
      metal: MATERIAL_CONFIGS.metal.defaultRate,
      e_waste: MATERIAL_CONFIGS.e_waste.defaultRate,
      glass: MATERIAL_CONFIGS.glass.defaultRate,
    };

    apiRates.forEach((r) => {
      const numRate = Number(r.rate_per_kg);
      if (numRate > 0) {
        map[r.material] = numRate;
      }
    });

    return map;
  }, [apiRates]);

  // Multi-Scrap Dynamic Calculations
  const selectedItemsList = useMemo(() => {
    return (Object.keys(scrapSelections) as MaterialType[])
      .filter((m) => scrapSelections[m].selected && scrapSelections[m].weight > 0)
      .map((m) => {
        const weight = scrapSelections[m].weight;
        const rate = rateMap[m];
        const payout = weight * rate;
        const points = weight * MATERIAL_CONFIGS[m].pointsFactor;
        const co2 = weight * MATERIAL_CONFIGS[m].co2Factor;
        return {
          material: m,
          config: MATERIAL_CONFIGS[m],
          weight,
          rate,
          payout,
          points,
          co2
        };
      });
  }, [scrapSelections, rateMap]);

  const totalWeight = useMemo(
    () => selectedItemsList.reduce((sum, item) => sum + item.weight, 0),
    [selectedItemsList]
  );

  const totalPayout = useMemo(
    () => Math.round(selectedItemsList.reduce((sum, item) => sum + item.payout, 0)),
    [selectedItemsList]
  );

  const totalPoints = useMemo(
    () => Math.round(selectedItemsList.reduce((sum, item) => sum + item.points, 0)),
    [selectedItemsList]
  );

  const totalCO2 = useMemo(
    () => selectedItemsList.reduce((sum, item) => sum + item.co2, 0).toFixed(1),
    [selectedItemsList]
  );

  // Toggle Scrap Material Selection
  const toggleMaterial = (mat: MaterialType) => {
    setScrapSelections((prev) => ({
      ...prev,
      [mat]: {
        ...prev[mat],
        selected: !prev[mat].selected
      }
    }));
  };

  // Change Weight for a specific scrap stream
  const updateWeight = (mat: MaterialType, weight: number) => {
    const validWeight = Math.max(1, Math.min(500, weight));
    setScrapSelections((prev) => ({
      ...prev,
      [mat]: {
        ...prev[mat],
        weight: validWeight
      }
    }));
  };

  // Single-item "Sell Scrap" quick action from cards
  const handleDirectSelect = (mat: MaterialType) => {
    setScrapSelections((prev) => ({
      ...prev,
      [mat]: {
        selected: true,
        weight: Math.max(prev[mat].weight, 5)
      }
    }));
    setIsModalOpen(true);
  };

  // Submit Doorstep Pickup Request
  const handleSubmitRequest = async () => {
    if (!user) {
      navigate('/login?redirect=/price-board');
      return;
    }

    if (selectedItemsList.length === 0) {
      setSubmitError('Please select at least one recyclable material to sell.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // 1. Submit a recycling transaction for each chosen scrap item
      const txnPromises = selectedItemsList.map((item) =>
        api.post('/recycling-transactions', {
          recycler_id: 1, // Default primary verified municipal aggregator
          material: item.material,
          estimated_weight_kg: item.weight
        })
      );

      // 2. Schedule doorstep pickup with collector notes
      const notesSummary = `Doorstep Scrap Collection: ${selectedItemsList
        .map((i) => `${i.config.label} (${i.weight}kg @ ₹${i.rate}/kg)`)
        .join(', ')}. Est. Payout: ₹${totalPayout}. Slot: ${pickupSlot}. Address: ${pickupAddress}. Instructions: ${pickupNotes}`;

      const pickupPromise = api.post('/pickups', {
        user_id: user.id,
        waste_type: 'dry',
        scheduled_date: pickupDate,
        scheduled_time: pickupSlot.startsWith('09') ? '09:30' : '14:30',
        notes: notesSummary
      });

      await Promise.all([...txnPromises, pickupPromise]);

      setSubmitSuccess(
        `Your doorstep collection request has been confirmed! An authorized municipal collector with a calibrated digital scale will visit on ${pickupDate} during ${pickupSlot}.`
      );
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setSubmitError(
        errorObj.response?.data?.detail || errorObj.message || 'Unable to schedule doorstep pickup. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Display Rates for Directory
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
      recycler_business_name: 'Bhopal Smart City Authorized MRF',
      service_zone_ids: [1, 2, 3],
      material: bm.material,
      rate_per_kg: bm.benchmarkRate,
      effective_from: new Date().toISOString()
    }));
  }, [apiRates, selectedMaterial, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1F2937] antialiased">
      {/* Top Header (Auto-hides on scroll down, reveals on scroll up) */}
      <Navbar mode="public" />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 pt-24 pb-12 sm:px-6 lg:px-8">
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
              Select single or multiple scrap streams below to calculate real-time earnings and book a certified
              doorstep pickup with calibrated digital scales.
            </p>

            {/* Badges / Guarantees Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>CPCB-Aligned Ledger</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <Scale className="h-4 w-4 text-amber-400 shrink-0" />
                <span>Certified Digital Scales</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <Coins className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>Instant Cash / UPI</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 p-3 backdrop-blur-md border border-white/10">
                <Truck className="h-4 w-4 text-sky-400 shrink-0" />
                <span>Free Doorstep Pickup</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Multi-Scrap Interactive Doorstep Booker ────────────────────── */}
        <section className="mb-14 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Coins className="h-4 w-4" /> Multi-Item Doorstep Calculator
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                Select Your Scrap Items & Estimate Cash Payout
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tick one or more recyclable materials from your household to calculate instant doorstep payout.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 px-3.5 py-2 rounded-2xl border border-slate-200">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>{selectedItemsList.length} of 5 Streams Selected</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Multi-Stream Checkbox & Weight Inputs */}
            <div className="lg:col-span-7 space-y-4">
              <div className="grid gap-3">
                {(Object.keys(MATERIAL_CONFIGS) as MaterialType[]).map((mat) => {
                  const cfg = MATERIAL_CONFIGS[mat];
                  const Icon = cfg.icon;
                  const currentRate = rateMap[mat];
                  const selection = scrapSelections[mat];
                  const isChecked = selection.selected;
                  const itemPayout = (selection.weight * currentRate).toFixed(2);

                  return (
                    <div
                      key={mat}
                      className={`rounded-2xl border p-4 transition-all ${
                        isChecked
                          ? 'border-emerald-600 bg-emerald-50/40 shadow-sm ring-1 ring-emerald-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* Checkbox + Title */}
                        <label className="flex items-center gap-3 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleMaterial(mat)}
                            className="h-5 w-5 rounded-lg accent-emerald-600 cursor-pointer"
                          />
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${cfg.badgeBg} ${cfg.badgeColor}`}
                          >
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{cfg.label}</span>
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {cfg.category}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-emerald-700">
                              Current Market Rate: ₹{currentRate.toFixed(2)} / kg
                            </p>
                          </div>
                        </label>

                        {/* Weight Stepper & Item Subtotal */}
                        {isChecked ? (
                          <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0">
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200 shadow-sm">
                              <button
                                type="button"
                                onClick={() => updateWeight(mat, selection.weight - 1)}
                                className="h-6 w-6 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                max="500"
                                value={selection.weight}
                                onChange={(e) => updateWeight(mat, Number(e.target.value))}
                                className="w-12 text-center text-sm font-black text-slate-900 outline-none"
                              />
                              <span className="text-xs font-bold text-slate-400 mr-1">kg</span>
                              <button
                                type="button"
                                onClick={() => updateWeight(mat, selection.weight + 1)}
                                className="h-6 w-6 rounded-lg bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-right min-w-[70px]">
                              <span className="text-sm font-black text-emerald-700">₹{itemPayout}</span>
                              <span className="block text-[10px] text-slate-400">payout</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 pl-8 sm:pl-0">
                            Click checkbox to add
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Consolidated Basket Panel */}
            <div className="lg:col-span-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-6 sm:p-7 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Total Doorstep Payout
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {totalWeight} kg scrap total
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-4xl sm:text-5xl font-black text-emerald-400">
                      ₹{totalPayout.toLocaleString('en-IN')}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">direct UPI / cash</span>
                  </div>
                </div>

                {/* Selected Breakdown List */}
                <div className="space-y-2 rounded-2xl bg-white/5 p-4 border border-white/5 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Selected Items Breakdown:
                  </span>
                  {selectedItemsList.length === 0 ? (
                    <p className="text-slate-400 italic text-[11px]">No items selected yet. Check items on the left!</p>
                  ) : (
                    selectedItemsList.map((item) => (
                      <div key={item.material} className="flex justify-between items-center text-slate-200">
                        <span>
                          {item.config.label}: <strong>{item.weight} kg</strong>
                        </span>
                        <span className="font-bold text-emerald-300">₹{item.payout.toFixed(2)}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Badges / Rewards */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-400" /> EcoSync Points
                    </span>
                    <p className="text-lg font-black text-amber-300 mt-0.5">+{totalPoints} pts</p>
                    <span className="text-[10px] text-slate-400">Bill credit eligible</span>
                  </div>
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                    <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1">
                      <Flame className="h-3 w-3 text-emerald-400" /> Carbon Offset
                    </span>
                    <p className="text-lg font-black text-emerald-300 mt-0.5">{totalCO2} kg</p>
                    <span className="text-[10px] text-slate-400">CO₂e diverted</span>
                  </div>
                </div>

                {/* Primary CTA: Book Doorstep Pickup */}
                <button
                  type="button"
                  disabled={selectedItemsList.length === 0}
                  onClick={() => setIsModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Truck className="h-4 w-4" />
                  <span>Raise Doorstep Pickup Request</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Live Scrap Price Board Directory ───────────────────────────── */}
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
                <option value="all">All Service Zones (Bhopal)</option>
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
                        onClick={() => handleDirectSelect(rate.material)}
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

        {/* ── Circular Economy Standards Strip ───────────────────────────── */}
        <section className="mt-16 rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">
              <ShieldCheck className="h-4 w-4" /> Integrity Standard
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Zero Exploitation. 100% Traceable Doorstep Scrap Collection.
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              EcoSync eliminates unfair street middleman markups by connecting residents directly with licensed
              material recovery facilities (MRFs) calibrated under Legal Metrology standards.
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

      {/* ── Doorstep Scrap Collection Booking Modal ────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Doorstep Scrap Collection</h3>
                  <p className="text-xs text-slate-500">CPCB Verified Recycler Pickup Request</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSubmitSuccess(null);
                  setSubmitError(null);
                }}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="py-6 space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="text-xl font-black text-slate-900">Pickup Successfully Scheduled!</h4>
                <p className="text-xs text-slate-600 leading-relaxed px-2">{submitSuccess}</p>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 text-left text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Doorstep Cash:</span>
                    <span className="font-black text-emerald-700 text-sm">₹{totalPayout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Bonus EcoPoints:</span>
                    <span className="font-bold text-amber-600">+{totalPoints} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Preferred Date & Slot:</span>
                    <span className="font-bold text-slate-800">{pickupDate} ({pickupSlot})</span>
                  </div>
                </div>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setSubmitSuccess(null);
                    }}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard/user')}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-700"
                  >
                    View in Citizen Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {/* Selected Items Summary */}
                <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-200/70">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block mb-2">
                    Scrap Streams to be Collected:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {selectedItemsList.map((item) => (
                      <div
                        key={item.material}
                        className="flex justify-between items-center text-xs text-slate-800"
                      >
                        <span className="font-semibold">
                          {item.config.label} · <strong>{item.weight} kg</strong> @ ₹{item.rate}/kg
                        </span>
                        <span className="font-black text-emerald-700">₹{item.payout.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 pt-3 border-t border-emerald-200/80 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Total Net Payout:</span>
                    <span className="text-base font-black text-emerald-800">₹{totalPayout}</span>
                  </div>
                </div>

                {/* Pickup Address */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Doorstep Pickup Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="House/Flat No., Street, Colony, Ward..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Preferred Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Time Window *
                    </label>
                    <select
                      value={pickupSlot}
                      onChange={(e) => setPickupSlot(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-emerald-600"
                    >
                      <option value="09:00 - 12:00 (Morning)">09:00 - 12:00 (Morning)</option>
                      <option value="12:00 - 16:00 (Afternoon)">12:00 - 16:00 (Afternoon)</option>
                      <option value="16:00 - 19:00 (Evening)">16:00 - 19:00 (Evening)</option>
                    </select>
                  </div>
                </div>

                {/* Optional Instructions */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pickup Instructions / Landmark (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={pickupNotes}
                    onChange={(e) => setPickupNotes(e.target.value)}
                    placeholder="e.g. Near Mother Dairy, 2nd floor, cartons tied with rope..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2 text-xs font-medium text-slate-900 outline-none focus:border-emerald-600"
                  />
                </div>

                {submitError && (
                  <div className="rounded-2xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || selectedItemsList.length === 0}
                    onClick={handleSubmitRequest}
                    className="flex-1 rounded-xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      'Scheduling Pickup...'
                    ) : user ? (
                      <>Confirm Doorstep Pickup <ArrowRight className="h-3.5 w-3.5" /></>
                    ) : (
                      <>Login & Confirm Pickup <ArrowRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Comprehensive Municipal Footer */}
      <Footer mode="public" />
    </div>
  );
}
