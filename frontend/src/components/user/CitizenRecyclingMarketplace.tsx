import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle,
  FileCheck,
  PlusCircle,
  Send,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { MaterialType, Recycler, RecyclingReceipt, RecyclingTransaction } from '../../lib/types';

interface Props {
  userId: number;
}

export function CitizenRecyclingMarketplace({ userId }: Props) {
  const queryClient = useQueryClient();
  const [subTab, setSubTab] = useState<'sell' | 'transactions' | 'receipts'>('sell');

  // Form state
  const [selectedRecyclerId, setSelectedRecyclerId] = useState<string>('');
  const [material, setMaterial] = useState<MaterialType>('plastic');
  const [estimatedWeight, setEstimatedWeight] = useState<string>('');
  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [formErr, setFormErr] = useState<string | null>(null);

  // Dispute state
  const [disputeTxnId, setDisputeTxnId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState<string>('');

  // Fetch verified recyclers
  const { data: recyclers = [] } = useQuery<Recycler[]>({
    queryKey: ['verified-recyclers'],
    queryFn: async () => {
      const res = await api.get<Recycler[]>('/recyclers?status=verified');
      return res.data;
    }
  });

  // Fetch citizen transactions
  const { data: transactions = [], isLoading: isTxnLoading } = useQuery<RecyclingTransaction[]>({
    queryKey: ['recycling-transactions', userId],
    queryFn: async () => {
      const res = await api.get<RecyclingTransaction[]>('/recycling-transactions');
      return res.data;
    }
  });

  // Fetch citizen receipts
  const { data: receipts = [] } = useQuery<RecyclingReceipt[]>({
    queryKey: ['recycling-receipts', userId],
    queryFn: async () => {
      const res = await api.get<RecyclingReceipt[]>('/recycling-receipts/me');
      return res.data;
    }
  });

  // Mutation: Request sale
  const requestSaleMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRecyclerId) throw new Error('Please select a recycler');
      const weight = parseFloat(estimatedWeight);
      if (isNaN(weight) || weight <= 0) throw new Error('Please enter a valid weight in kg');

      return api.post('/recycling-transactions', {
        recycler_id: Number(selectedRecyclerId),
        material,
        estimated_weight_kg: weight
      });
    },
    onSuccess: () => {
      setFormMsg('Sale request submitted! The recycler will verify weight upon collection.');
      setFormErr(null);
      setEstimatedWeight('');
      setSelectedRecyclerId('');
      queryClient.invalidateQueries({ queryKey: ['recycling-transactions', userId] });
      setSubTab('transactions');
    },
    onError: (err: unknown) => {
      const errorObj = err as { response?: { data?: { detail?: string } }; message?: string };
      setFormErr(errorObj.response?.data?.detail || errorObj.message || 'Failed to submit sale request');
      setFormMsg(null);
    }
  });

  // Mutation: Confirm transaction
  const confirmMutation = useMutation({
    mutationFn: async (txnId: number) => {
      return api.post(`/recycling-transactions/${txnId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycling-transactions', userId] });
      queryClient.invalidateQueries({ queryKey: ['recycling-receipts', userId] });
    }
  });

  // Mutation: Dispute transaction
  const disputeMutation = useMutation({
    mutationFn: async ({ txnId, reason }: { txnId: number; reason: string }) => {
      return api.post(`/recycling-transactions/${txnId}/dispute`, { reason });
    },
    onSuccess: () => {
      setDisputeTxnId(null);
      setDisputeReason('');
      queryClient.invalidateQueries({ queryKey: ['recycling-transactions', userId] });
    }
  });

  return (
    <article className="glass-card rounded-[2rem] p-6 sm:p-8 space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Recycling Marketplace
            </span>
            <span className="text-xs text-slate-400 font-semibold">Ledger-Only</span>
          </div>
          <h2 className="text-2xl font-black text-slate-950">Sell Segregated Recyclables</h2>
          <p className="text-sm text-slate-600">
            Sell clean dry recyclables to verified buyers at live posted rates and receive official digital receipts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('sell')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'sell' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sell Recyclables
          </button>
          <button
            type="button"
            onClick={() => setSubTab('transactions')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'transactions' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sales ({transactions.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('receipts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              subTab === 'receipts' ? 'bg-slate-950 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Receipts ({receipts.length})
          </button>
        </div>
      </div>

      {/* Sub-tab 1: Sell Form */}
      {subTab === 'sell' && (
        <div className="bg-white/80 rounded-2xl border border-slate-200/80 p-6 space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-emerald-600" /> Initiate Recyclable Material Sale
          </h3>
          <p className="text-xs text-slate-500">
            Select a verified municipal recycler and estimate your material weight. The recycler will weigh the material upon pickup and snapshot the live rate into your digital receipt.
          </p>

          {formMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" /> {formMsg}
            </div>
          )}
          {formErr && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
              <XCircle className="h-4 w-4 shrink-0 text-rose-600" /> {formErr}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              requestSaleMutation.mutate();
            }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Verified Recycler Buyer *
              </label>
              <select
                value={selectedRecyclerId}
                onChange={(e) => setSelectedRecyclerId(e.target.value)}
                required
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a verified recycler</option>
                {recyclers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.business_name} (Accepts: {r.materials_accepted.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Material Type *
              </label>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as MaterialType)}
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="plastic">Plastic (Bottles, HDPE, Containers)</option>
                <option value="paper">Paper & Cardboard</option>
                <option value="metal">Metals (Aluminium, Iron, Brass)</option>
                <option value="e_waste">E-Waste (Electronics, Batteries)</option>
                <option value="glass">Glass (Bottles, Jars)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Estimated Weight (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={estimatedWeight}
                onChange={(e) => setEstimatedWeight(e.target.value)}
                placeholder="e.g. 10.0"
                className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-3 flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                Want to check current market prices first? Visit the public <a href="/price-board" className="text-emerald-600 font-bold underline">Scrap Price Board</a>.
              </span>
              <button
                type="submit"
                disabled={requestSaleMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {requestSaleMutation.isPending ? 'Submitting...' : 'Request Sale Pickup'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-tab 2: Material Sales list */}
      {subTab === 'transactions' && (
        <div className="space-y-3">
          {isTxnLoading ? (
            <div className="text-center py-8 text-slate-400">Loading your sales...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 bg-white/60 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No sales recorded yet. Click "Sell Recyclables" above to initiate your first scrap sale.
            </div>
          ) : (
            transactions.map((txn) => {
              const isLogged = txn.status === 'logged';
              const isConfirmed = txn.status === 'confirmed';
              const isDisputed = txn.status === 'disputed';

              return (
                <div
                  key={txn.id}
                  className="rounded-2xl bg-white border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-400">TXN #{txn.id}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                          {txn.material}
                        </span>
                        {isLogged && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Action: Review & Confirm Weight
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            Confirmed · Receipt Issued
                          </span>
                        )}
                        {isDisputed && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            Disputed · Held for Review
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Buyer: {txn.recycler_business_name || 'Verified Recycler'}
                      </h4>
                    </div>

                    <div className="text-xs text-slate-500 text-right">
                      {new Date(txn.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Weight & Credit Specs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Estimated</span>
                      <strong className="text-slate-800">{txn.estimated_weight_kg ?? 'N/A'} kg</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Actual Verified</span>
                      <strong className="text-slate-900">{txn.weight_kg ? `${txn.weight_kg} kg` : 'Pending Pickup'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Rate Applied</span>
                      <strong className="text-slate-900">{txn.rate_applied ? `₹${Number(txn.rate_applied).toFixed(2)}/kg` : 'Pending'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Credit Amount</span>
                      <strong className="text-emerald-700 text-sm">{txn.amount_credited ? `₹${Number(txn.amount_credited).toFixed(2)}` : 'Pending'}</strong>
                    </div>
                  </div>

                  {/* Logged state: Confirm or Dispute controls */}
                  {isLogged && (
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                      <p className="text-xs text-slate-600">
                        Recycler verified weight at <strong>{txn.weight_kg} kg</strong>. Do you approve the recorded credit of <strong>₹{Number(txn.amount_credited).toFixed(2)}</strong>?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={confirmMutation.isPending}
                          onClick={() => confirmMutation.mutate(txn.id)}
                          className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          Confirm & Issue Receipt
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisputeTxnId(txn.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition"
                        >
                          Dispute
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline Dispute Form */}
                  {disputeTxnId === txn.id && (
                    <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
                      <label className="block text-xs font-bold text-rose-900">
                        Reason for disputing recorded weight/category:
                      </label>
                      <input
                        type="text"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="e.g. Scale read differently or wrong material logged"
                        className="w-full text-xs p-2 rounded-lg border border-rose-300 bg-white"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => setDisputeTxnId(null)}
                          className="px-3 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={disputeMutation.isPending}
                          onClick={() => disputeMutation.mutate({ txnId: txn.id, reason: disputeReason })}
                          className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold"
                        >
                          Submit Dispute
                        </button>
                      </div>
                    </div>
                  )}

                  {txn.receipt && (
                    <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 pt-1">
                      <FileCheck className="h-4 w-4" /> Official Receipt #{txn.receipt.receipt_number} issued.
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sub-tab 3: Digital Receipts */}
      {subTab === 'receipts' && (
        <div className="space-y-3">
          {receipts.length === 0 ? (
            <div className="text-center py-10 bg-white/60 rounded-2xl border border-slate-200 text-slate-500 text-xs">
              No digital receipts issued yet. Receipts are generated automatically when you confirm a verified scrap pickup.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receipts.map((rcp) => (
                <div
                  key={rcp.id}
                  className="rounded-2xl bg-white border border-emerald-200/80 p-5 shadow-sm space-y-2 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-700 tracking-wider">
                      {rcp.receipt_number}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rcp.issued_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block capitalize">
                        {rcp.material} · {rcp.weight_kg} kg
                      </span>
                      <span className="text-sm font-black text-slate-900">
                        ₹{Number(rcp.amount_credited).toFixed(2)}
                      </span>
                    </div>

                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> EPR Verified
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
