import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Coins, Filter, MapPin, Sparkles, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { MaterialType, PublicRate, Zone } from '../lib/types';
import { useSessionStore } from '../store/session';

const MATERIAL_BADGES: Record<MaterialType, { label: string; color: string; bg: string }> = {
  plastic: { label: 'Plastic (PET, HDPE)', color: 'text-amber-700 border-amber-300', bg: 'bg-amber-50' },
  paper: { label: 'Paper & Cardboard', color: 'text-blue-700 border-blue-300', bg: 'bg-blue-50' },
  metal: { label: 'Metals & Scrap', color: 'text-purple-700 border-purple-300', bg: 'bg-purple-50' },
  e_waste: { label: 'E-Waste (Circuits/Batteries)', color: 'text-rose-700 border-rose-300', bg: 'bg-rose-50' },
  glass: { label: 'Glass Bottles', color: 'text-emerald-700 border-emerald-300', bg: 'bg-emerald-50' }
};

export function PriceBoardPage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialType | 'all'>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');

  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: async () => {
      try {
        const res = await api.get<Zone[]>('/zones');
        return res.data;
      } catch {
        return [];
      }
    }
  });

  const { data: rates = [], isLoading } = useQuery<PublicRate[]>({
    queryKey: ['public-rates', selectedZone, selectedMaterial],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (selectedZone !== 'all') params.zone_id = selectedZone;
      if (selectedMaterial !== 'all') params.material = selectedMaterial;
      const res = await api.get<PublicRate[]>('/recyclers/rates', { params });
      return res.data;
    }
  });

  const handleSellClick = (recyclerId: number, material: MaterialType) => {
    if (!user) {
      navigate('/login/citizen');
      return;
    }
    if (user.role === 'citizen') {
      navigate(`/dashboard/user?tab=marketplace&recycler_id=${recyclerId}&material=${material}`);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Hero header */}
        <div className="rounded-[2.5rem] bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden mb-10">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="h-3.5 w-3.5" /> Live Scrap Price Board
            </span>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
              Fair, Transparent Pricing for Segregated Recyclables
            </h1>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed mb-6">
              Browse real-time scrap purchasing rates posted by verified municipal recycling partners. Turn clean segregated waste into recorded earnings and generate official EPR credits.
            </p>
            <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <ShieldCheck className="h-4 w-4 text-emerald-400" /> CPCB-Aligned Ledger
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <Coins className="h-4 w-4 text-amber-400" /> 100% Verified Weights
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-md">
                <TrendingUp className="h-4 w-4 text-sky-400" /> Immutable Rate History
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Material:
            </span>
            <button
              type="button"
              onClick={() => setSelectedMaterial('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                selectedMaterial === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Materials
            </button>
            {(['plastic', 'paper', 'metal', 'e_waste', 'glass'] as MaterialType[]).map((mat) => (
              <button
                key={mat}
                type="button"
                onClick={() => setSelectedMaterial(mat)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition capitalize ${
                  selectedMaterial === mat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {mat.replace('_', '-')}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <MapPin className="h-4 w-4 text-slate-400" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              aria-label="Filter rates by municipal zone"
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : rates.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Coins className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No active rates found</h3>
            <p className="text-sm text-slate-500 mt-1">
              No verified recyclers currently offer rates matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rates.map((rate) => {
              const badge = MATERIAL_BADGES[rate.material] || { label: rate.material, color: 'text-slate-700', bg: 'bg-slate-100' };
              return (
                <div
                  key={rate.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.color} ${badge.bg}`}>
                        {badge.label}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-slate-900">
                          ₹{Number(rate.rate_per_kg).toFixed(2)}
                        </span>
                        <span className="text-xs font-semibold text-slate-400 block">/ kg</span>
                      </div>
                    </div>

                    <h3 className="font-bold text-slate-900 text-base mb-1">
                      {rate.recycler_business_name}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Municipal Verified Partner
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Updated: {new Date(rate.effective_from).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSellClick(rate.recycler_id, rate.material)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      Sell Now <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
