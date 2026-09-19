import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Award, Building2 } from 'lucide-react';
import { api } from '../../lib/api';
import type { BrandAccount, EPRCredit } from '../../lib/types';

export function EPRCreditLedgerPanel() {
  const queryClient = useQueryClient();
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [claimingCreditId, setClaimingCreditId] = useState<number | null>(null);

  // Available EPR Credits
  const { data: availableCredits = [], isLoading } = useQuery<EPRCredit[]>({
    queryKey: ['available-epr-credits'],
    queryFn: async () => {
      const res = await api.get<EPRCredit[]>('/epr-credits/available');
      return res.data;
    }
  });

  // Brands list
  const { data: brands = [] } = useQuery<BrandAccount[]>({
    queryKey: ['brand-accounts'],
    queryFn: async () => {
      const res = await api.get<BrandAccount[]>('/brands');
      return res.data;
    }
  });

  // Claim mutation (internal simulation)
  const claimMutation = useMutation({
    mutationFn: async ({ creditId, brandId }: { creditId: number; brandId: number }) => {
      return api.post(`/epr-credits/${creditId}/claim`, { brand_id: brandId });
    },
    onSuccess: () => {
      setClaimingCreditId(null);
      setSelectedBrandId('');
      queryClient.invalidateQueries({ queryKey: ['available-epr-credits'] });
    }
  });

  const totalAvailableKg = availableCredits.reduce(
    (acc, c) => acc + Number(c.credit_amount),
    0
  );

  return (
    <article className="glass-card rounded-[2rem] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              EPR Compliance Ledger
            </span>
            <span className="text-xs text-slate-400 font-semibold">Simulated Internal Settlement</span>
          </div>
          <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-500" /> Extended Producer Responsibility (EPR) Credits
          </h3>
          <p className="text-sm text-slate-600">
            Digital credit pool generated from confirmed segregated recyclables receipts.
          </p>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-right">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Available Credit Pool
          </span>
          <span className="text-2xl font-black text-emerald-700">
            {totalAvailableKg.toFixed(2)} <span className="text-xs font-bold">Credits (kg)</span>
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-400 text-xs">Loading EPR pool...</div>
      ) : availableCredits.length === 0 ? (
        <div className="text-center py-8 bg-white/60 rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No available EPR credits in the pool. Credits are minted when citizens confirm verified scrap sales.
        </div>
      ) : (
        <div className="space-y-3">
          {availableCredits.map((credit) => (
            <div
              key={credit.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400">CREDIT #{credit.id}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 capitalize">
                    {credit.material || 'Material'}
                  </span>
                  <span className="text-xs text-slate-500">
                    Receipt: <strong>{credit.receipt_number || `Receipt #${credit.receipt_id}`}</strong>
                  </span>
                </div>
                <p className="text-sm font-black text-slate-900 mt-1">
                  Credit Volume: {Number(credit.credit_amount).toFixed(2)} Units (kg)
                </p>
              </div>

              <div>
                {claimingCreditId === credit.id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedBrandId}
                      onChange={(e) => setSelectedBrandId(e.target.value)}
                      className="text-xs font-semibold rounded-xl border border-slate-300 p-2 text-slate-800"
                    >
                      <option value="">Select Brand Account</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.org_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!selectedBrandId || claimMutation.isPending}
                      onClick={() =>
                        claimMutation.mutate({
                          creditId: credit.id,
                          brandId: Number(selectedBrandId)
                        })
                      }
                      className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                      Confirm Claim
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimingCreditId(null)}
                      className="px-2 py-2 text-xs text-slate-400"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setClaimingCreditId(credit.id);
                      setSelectedBrandId(brands[0]?.id ? String(brands[0].id) : '');
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                  >
                    <Building2 className="h-3.5 w-3.5" /> Simulate Brand Claim
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
