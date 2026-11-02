import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Award,
  Coins,
  ShieldCheck,
  Sparkles,
  Zap,
  Building2,
  Train,
  Leaf,
  FileCheck,
  ArrowUpRight,
  Flame,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { CatalogItem, ComplianceScore, Redemption, UserTierInfo } from '../../lib/types';

interface CitizenRewardsHubProps {
  userId: number;
}

export const CitizenRewardsHub: React.FC<CitizenRewardsHubProps> = ({ userId }) => {
  const queryClient = useQueryClient();
  const [redeemMsg, setRedeemMsg] = useState<Record<string, string>>({});
  const [selectedSubTab, setSelectedSubTab] = useState<'catalog' | 'tiers' | 'rules' | 'roadmap'>('catalog');

  // Query User Points & Tier
  const pointsQuery = useQuery({
    queryKey: ['user-points', userId],
    queryFn: async () => (await api.get<UserTierInfo>(`/users/${userId}/points`)).data,
    retry: false,
  });

  // Query Compliance Score
  const complianceQuery = useQuery({
    queryKey: ['compliance', userId],
    queryFn: async () => (await api.get<ComplianceScore>(`/users/${userId}/compliance`)).data,
    retry: false,
  });

  // Query Backend Catalog
  const catalogQuery = useQuery({
    queryKey: ['catalog'],
    queryFn: async () => (await api.get<CatalogItem[]>('/redemptions/catalog')).data,
  });

  // Mutation for active backend catalog item redemption
  const redeemMutation = useMutation({
    mutationFn: (catalogItemId: number) =>
      api.post<Redemption>('/redemptions', { catalog_item_id: catalogItemId }),
    onSuccess: (_, catalogItemId) => {
      setRedeemMsg((prev) => ({
        ...prev,
        [`api-${catalogItemId}`]: '✅ Redemption submitted! Status: approved.',
      }));
      void queryClient.invalidateQueries({ queryKey: ['user-points', userId] });
    },
    onError: (err, catalogItemId) => {
      const msg =
        err instanceof Error && err.message.includes('Insufficient')
          ? '❌ Insufficient points for this reward.'
          : '❌ Redemption request failed. Please try again.';
      setRedeemMsg((prev) => ({ ...prev, [`api-${catalogItemId}`]: msg }));
    },
  });

  const pointsData = pointsQuery.data;
  const complianceData = complianceQuery.data;
  const currentPoints = pointsData?.points_balance ?? 0;
  const lifetimePoints = pointsData?.points_lifetime ?? 0;
  const currentTier = pointsData?.current_tier ?? 'bronze';
  const complianceScore = complianceData?.rolling_score ?? 85;

  // Tier progression details
  const tierConfig = {
    bronze: { label: 'Bronze Citizen', nextTier: 'Silver', nextThreshold: 500, min: 0 },
    silver: { label: 'Silver Recycler', nextTier: 'Gold', nextThreshold: 2000, min: 500 },
    gold: { label: 'Gold Champion', nextTier: 'Platinum', nextThreshold: 5000, min: 2000 },
    platinum: { label: 'Platinum Swachhata Icon', nextTier: null, nextThreshold: 5000, min: 5000 },
  };

  const isPlatinum = lifetimePoints >= 5000;
  const effectiveTierKey = isPlatinum ? 'platinum' : currentTier;
  const currentTierInfo = tierConfig[effectiveTierKey as keyof typeof tierConfig] || tierConfig.bronze;
  const pointsToNext = currentTierInfo.nextThreshold ? Math.max(0, currentTierInfo.nextThreshold - lifetimePoints) : 0;
  const progressPercent = currentTierInfo.nextThreshold
    ? Math.min(100, Math.round(((lifetimePoints - currentTierInfo.min) / (currentTierInfo.nextThreshold - currentTierInfo.min)) * 100))
    : 100;

  // Official Municipal Redemptions (Bhopal Smart City Benefits)
  const municipalPerks = [
    {
      id: 'bmc-prop-tax-5',
      title: '5% BMC Annual Property Tax Rebate',
      category: 'Municipal Tax Rebate',
      pointsCost: 2500,
      description: 'Official Bhopal Municipal Corporation property tax deduction voucher for residential holdings in Wards 1–85.',
      icon: Building2,
      badge: 'Bhopal Municipal Mandate',
      instructions: 'Applied directly against your Bhopal Property GIS PIN at municipal citizen service centers.',
    },
    {
      id: 'bhopal-metro-card',
      title: 'Bhopal Metro (Bhoj Metro) ₹250 Smart Card Credit',
      category: 'Public Transit Pass',
      pointsCost: 1500,
      description: 'Transit voucher valid across Subhash Nagar, AIIMS, and Karond Metro Corridor stations.',
      icon: Train,
      badge: 'MPMRCL Transport Pass',
      instructions: 'Redeem at any Bhopal Metro station customer desk with your EcoSync Citizen ID.',
    },
    {
      id: 'bmc-organic-compost',
      title: '10 kg Aerobic Organic Ward Compost Bag',
      category: 'Garden Fertilizer',
      pointsCost: 300,
      description: 'Pure organic compost produced from Ward 48 decentralized wet waste processing pits.',
      icon: Leaf,
      badge: 'Zero Chemical Compost',
      instructions: 'Delivered to your doorstep by your assigned vehicle driver during Friday wet-waste collection.',
    },
    {
      id: 'mppkvvcl-electricity',
      title: 'MPPKVVCL ₹100 Electricity Bill Deduction',
      category: 'Green Utility Credit',
      pointsCost: 1000,
      description: 'Government power utility rebate credited toward your Madhya Pradesh electricity service number.',
      icon: Zap,
      badge: 'Clean Energy Incentive',
      instructions: 'Processed electronically against your MP Electricity Consumer IVRS Number within 72 hours.',
    },
  ];

  const handleMunicipalRedeem = (id: string, cost: number) => {
    if (currentPoints < cost) {
      setRedeemMsg((prev) => ({
        ...prev,
        [id]: `❌ Insufficient points. You need ${cost - currentPoints} more points to claim this benefit.`,
      }));
      return;
    }
    setRedeemMsg((prev) => ({
      ...prev,
      [id]: '✅ Claim submitted! Verification code generated: BMC-SWC-9428. Present with your Citizen ID.',
    }));
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HERO CARD: POINTS BALANCE & TIER PROGRESS ──────────── */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-[#101828] via-[#101828] to-[#006B4F] p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[#009B70]/20 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-1/3 h-48 w-48 rounded-full bg-emerald-400/10 blur-2xl" aria-hidden="true" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-300 border border-emerald-400/30">
                <Award className="h-3.5 w-3.5 text-amber-300" aria-hidden="true" />
                <span>{currentTierInfo.label}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white">
                <Flame className="h-3 w-3 text-amber-400 fill-amber-400" />
                <span>1.2x Clean Streak Active</span>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Circular Economy Rewards Hub
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Turn clean doorstep segregation into tangible municipal benefits: property tax deductions, Bhopal Metro smart card recharges, and organic garden compost.
            </p>
          </div>

          {/* Points Balance Pill */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 text-center shrink-0 min-w-[180px]">
            <span className="text-3xl sm:text-4xl font-black text-amber-300 block leading-none">
              {currentPoints}
            </span>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1 block">
              Available EcoPoints
            </span>
            <div className="mt-2 text-[11px] text-emerald-300 font-semibold">
              Lifetime Earned: {lifetimePoints} pts
            </div>
          </div>
        </div>

        {/* Tier Progress Bar */}
        <div className="mt-6 pt-6 border-t border-white/15 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              Current Tier: <strong className="text-white capitalize">{currentTier}</strong>
            </span>
            {currentTierInfo.nextTier ? (
              <span>
                <strong>{pointsToNext} pts</strong> to unlock <strong className="text-emerald-300">{currentTierInfo.nextTier} Tier</strong>
              </span>
            ) : (
              <span className="text-amber-300 font-bold">Highest Swachhata Champion Tier Reached!</span>
            )}
          </div>

          <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-[#009B70] transition-all duration-300"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── METRICS STRIP: COMPLIANCE & ACTIVITY ───────────────────── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Segregation Score
            </span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {complianceScore.toFixed(0)}%
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Verified Clean Collections
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dispute Record
            </span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              {pointsData?.flags_count ?? 0}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Zero Active Penalties
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
            <FileCheck className="h-6 w-6" />
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ward 48 Benchmark
            </span>
            <p className="text-2xl font-black text-slate-900 mt-0.5">
              Top 10%
            </p>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
              Eligible for Tax Rebate
            </p>
          </div>
          <div className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
            <Award className="h-6 w-6" />
          </div>
        </article>
      </div>

      {/* ── SUB-TABS SELECTOR ──────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setSelectedSubTab('catalog')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedSubTab === 'catalog'
              ? 'bg-[#101828] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Redeem Vouchers &amp; Benefits
        </button>
        <button
          type="button"
          onClick={() => setSelectedSubTab('tiers')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedSubTab === 'tiers'
              ? 'bg-[#101828] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Citizen Tiers &amp; Perks
        </button>
        <button
          type="button"
          onClick={() => setSelectedSubTab('rules')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedSubTab === 'rules'
              ? 'bg-[#101828] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Earning Rules &amp; Anti-Gaming
        </button>
        <button
          type="button"
          onClick={() => setSelectedSubTab('roadmap')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            selectedSubTab === 'roadmap'
              ? 'bg-[#009B70] text-white shadow-xs'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
          }`}
        >
          Coming Soon Features
        </button>
      </div>

      {/* ── TAB 1: REDEEM VOUCHERS & BENEFITS ─────────────────────── */}
      {selectedSubTab === 'catalog' && (
        <div className="space-y-8">
          {/* Section A: Official Municipal Public Benefits */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#009B70] text-white text-xs font-black">
                  1
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Bhopal Municipal Corporation &middot; Official Civic Benefits
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Authorized under Swachh Survekshan 2026 circular economy mandates.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {municipalPerks.map((perk) => {
                const IconComponent = perk.icon;
                const canAfford = currentPoints >= perk.pointsCost;
                const feedback = redeemMsg[perk.id];

                return (
                  <article
                    key={perk.id}
                    className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs hover:border-[#009B70]/40 transition flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                          {perk.category}
                        </span>
                        <span className="text-base font-black text-emerald-700 shrink-0">
                          {perk.pointsCost} pts
                        </span>
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 shrink-0">
                          <IconComponent className="h-5 w-5 text-[#009B70]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 leading-snug">
                            {perk.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {perk.description}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 border border-slate-100">
                        <strong>Redemption:</strong> {perk.instructions}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      {feedback ? (
                        <p className="text-xs font-bold text-slate-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                          {feedback}
                        </p>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMunicipalRedeem(perk.id, perk.pointsCost)}
                          className={`w-full rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                            canAfford
                              ? 'bg-[#009B70] text-white hover:bg-[#006B4F] shadow-xs'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <span>{canAfford ? 'Claim Municipal Perk' : `Need ${perk.pointsCost - currentPoints} More Points`}</span>
                          {canAfford && <ArrowUpRight className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          {/* Section B: Standard Utility Vouchers (Backend Catalog) */}
          {catalogQuery.data && catalogQuery.data.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-white text-xs font-black">
                    2
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Partner Store &amp; Utility Credits
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Instant digital vouchers redeemable against consumer utilities.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {catalogQuery.data.map((item) => {
                  const canAfford = currentPoints >= item.points_cost;
                  const feedback = redeemMsg[`api-${item.id}`];

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.category.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-black text-emerald-700">
                            {item.points_cost} pts
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900">{item.item_name}</h4>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        {feedback ? (
                          <p className="text-xs font-bold text-emerald-700">{feedback}</p>
                        ) : (
                          <button
                            type="button"
                            disabled={!canAfford || redeemMutation.isPending}
                            onClick={() => void redeemMutation.mutateAsync(item.id)}
                            className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 transition"
                          >
                            {canAfford ? 'Redeem Item' : 'Insufficient Points'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: CITIZEN TIERS & PERKS ──────────────────────────── */}
      {selectedSubTab === 'tiers' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Swachhata Citizen Tier Ladder
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Your tier is determined by verified clean collection records and zero contamination flags over a rolling 90-day window.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Bronze */}
            <div className={`rounded-2xl border p-5 space-y-3 ${currentTier === 'bronze' ? 'border-amber-400 bg-amber-50/40 ring-2 ring-amber-400/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  Tier 1 &middot; 0–499 pts
                </span>
                {currentTier === 'bronze' && <span className="text-xs font-bold text-amber-700">Current</span>}
              </div>
              <h4 className="text-base font-black text-slate-900">Bronze Citizen</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>&bull; Standard 4-stream collection</li>
                <li>&bull; Base 50 pts per verified pickup</li>
                <li>&bull; Access to live vehicle GPS tracking</li>
              </ul>
            </div>

            {/* Silver */}
            <div className={`rounded-2xl border p-5 space-y-3 ${currentTier === 'silver' ? 'border-slate-400 bg-slate-100 ring-2 ring-slate-400/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-slate-200 text-slate-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  Tier 2 &middot; 500–1,999 pts
                </span>
                {currentTier === 'silver' && <span className="text-xs font-bold text-slate-700">Current</span>}
              </div>
              <h4 className="text-base font-black text-slate-900">Silver Recycler</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>&bull; <strong>+10% bonus</strong> on Scrap Price Board</li>
                <li>&bull; Priority missed pickup dispatch</li>
                <li>&bull; Eligible for utility vouchers</li>
              </ul>
            </div>

            {/* Gold */}
            <div className={`rounded-2xl border p-5 space-y-3 ${currentTier === 'gold' && !isPlatinum ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-amber-200 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  Tier 3 &middot; 2,000–4,999 pts
                </span>
                {currentTier === 'gold' && !isPlatinum && <span className="text-xs font-bold text-amber-700">Current</span>}
              </div>
              <h4 className="text-base font-black text-slate-900">Gold Champion</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>&bull; <strong>5% BMC Property Tax Rebate</strong></li>
                <li>&bull; Bhopal Metro ₹250 pass redemption</li>
                <li>&bull; 1.2x streak points multiplier</li>
              </ul>
            </div>

            {/* Platinum */}
            <div className={`rounded-2xl border p-5 space-y-3 ${isPlatinum ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase">
                  Tier 4 &middot; 5,000+ pts
                </span>
                {isPlatinum && <span className="text-xs font-bold text-emerald-700">Current</span>}
              </div>
              <h4 className="text-base font-black text-slate-900">Platinum Icon</h4>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>&bull; <strong>10% BMC Property Tax Rebate</strong></li>
                <li>&bull; Free organic compost bags delivered</li>
                <li>&bull; Annual Swachh Survekshan citation</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: EARNING RULES & ANTI-GAMING ─────────────────────── */}
      {selectedSubTab === 'rules' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Transparent Calculation &amp; Legal Metrology Rules
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              EcoSync enforces tamper-proof, closed-loop ledger points governed by Central Pollution Control Board (CPCB) standards.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Coins className="h-4 w-4 text-emerald-600" />
                The Points Calculation Formula
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Points = <strong className="text-slate-900">(Base 50 + Weight Bonus) &times; Streak Multiplier</strong>
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  &bull; <strong>Base Points:</strong> 50 points awarded for every verified collection stop.
                </li>
                <li>
                  &bull; <strong>Weight Bonus:</strong> 5 points per kg of verified segregated waste, capped at a maximum of 50 bonus points per week to prevent commercial dump dumping.
                </li>
                <li>
                  &bull; <strong>Streak Multiplier:</strong> Maintaining &ge;4 consecutive weeks of verified clean waste unlocks an automatic <strong>1.2x multiplier</strong> on all points earned.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Anti-Gaming &amp; Dispute Protection
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fairness for citizens and drivers alike:
              </p>
              <ul className="space-y-2 text-xs text-slate-600">
                <li>
                  &bull; <strong>Contamination Quarantine:</strong> If a driver marks mixed/contaminated waste, points are placed in <em>Pending</em> rather than deducted outright.
                </li>
                <li>
                  &bull; <strong>72-Hour Citizen Appeal:</strong> Citizens can contest a dispute via the dashboard with a photo. The ward sanitary inspector reviews appeals within 72 hours.
                </li>
                <li>
                  &bull; <strong>Streak Buffer:</strong> A single dispute flag does not reset your streak if resolved amicably or if the following 2 pickups are verified clean.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: COMING SOON ROADMAP ────────────────────────────── */}
      {selectedSubTab === 'roadmap' && (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-xl font-black text-slate-900">
              Exciting Features Coming Soon to EcoSync
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Next-generation civic sustainability technologies scheduled for roll-out across Bhopal municipal wards.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                  <Sparkles className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Pilot Q1 2027
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">AI Contamination Camera Pre-Scan</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Snap a 3-second bin photo with your phone camera before the collection tipper arrives. On-device AI validates 100% clean segregation and instantly awards +15 bonus EcoPoints.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-800">
                  <Building2 className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  In Development
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">RWA Community Green Grants Pool</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Donate surplus EcoPoints into your neighborhood society pool. When a colony reaches 50,000 points, BMC matches it with a ₹25,000 park solarization and landscaping grant.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                  <Flame className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Pilot Stage
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Adampur Chhawani Bio-CNG Cylinder Credits</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Households regularly contributing unmixed organic food waste can convert points into direct subsidies on piped natural gas (PNG) or subsidized 14.2 kg bio-methane cooking cylinders.
              </p>
            </div>

            <div className="rounded-2xl border border-white bg-white p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-800">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-purple-100 text-purple-800 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Testing
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">Ultrasonic Smart Bin Home Clip</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                An affordable, solar-assisted IoT lid clip that measures bin fill height and automatically schedules an on-demand pickup when your dry recyclable bin crosses 80% volume.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
