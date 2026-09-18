import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Camera,
  CheckCircle,
  Clock,
  Coins,
  FileCheck,
  PlusCircle,
  RefreshCw,
  Scale,
  ShieldCheck,
  Tag,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { MaterialType, RateCard, Recycler, RecyclingTransaction } from '../../lib/types';
import { useSessionStore } from '../../store/session';

export function RecyclerDashboard() {
  const queryClient = useQueryClient();
  const user = useSessionStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<'requests' | 'rates'>('requests');
  const [selectedTxn, setSelectedTxn] = useState<RecyclingTransaction | null>(null);
  const [actualWeight, setActualWeight] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [logError, setLogError] = useState<string | null>(null);

  // Rate card form state
  const [rateMaterial, setRateMaterial] = useState<MaterialType>('plastic');
  const [ratePerKg, setRatePerKg] = useState<string>('');
  const [rateError, setRateError] = useState<string | null>(null);

  // Fetch current recycler profile
  const { data: recycler, isLoading: isRecyclerLoading } = useQuery<Recycler>({
    queryKey: ['my-recycler-profile'],
    queryFn: async () => {
      const res = await api.get<Recycler>('/recyclers/me');
      return res.data;
    }
  });

  // Fetch rate cards
  const { data: rateCards = [] } = useQuery<RateCard[]>({
    queryKey: ['recycler-rates', recycler?.id],
    queryFn: async () => {
      if (!recycler?.id) return [];
      const res = await api.get<RateCard[]>(`/recyclers/${recycler.id}/rates`);
      return res.data;
    },
    enabled: !!recycler?.id
  });

  // Fetch transactions
  const { data: transactions = [], isLoading: isTxnLoading } = useQuery<RecyclingTransaction[]>({
    queryKey: ['recycling-transactions'],
    queryFn: async () => {
      const res = await api.get<RecyclingTransaction[]>('/recycling-transactions');
      return res.data;
    }
  });

  // Mutation to post rate
  const postRateMutation = useMutation({
    mutationFn: async (payload: { material: MaterialType; rate_per_kg: number }) => {
      if (!recycler?.id) throw new Error('No recycler profile found');
      return api.post(`/recyclers/${recycler.id}/rates`, payload);
    },
    onSuccess: () => {
      setRateError(null);
      setRatePerKg('');
      queryClient.invalidateQueries({ queryKey: ['recycler-rates', recycler?.id] });
      queryClient.invalidateQueries({ queryKey: ['public-rates'] });
    },
    onError: (err: any) => {
      setRateError(err.response?.data?.detail || 'Failed to update rate card');
    }
  });

  // Mutation to log pickup
  const logPickupMutation = useMutation({
    mutationFn: async ({ txnId, weight, photo }: { txnId: number; weight: number; photo?: string }) => {
      return api.post(`/recycling-transactions/${txnId}/log`, {
        weight_kg: weight,
        photo_url: photo || null
      });
    },
    onSuccess: () => {
      setSelectedTxn(null);
      setActualWeight('');
      setPhotoUrl('');
      setLogError(null);
      queryClient.invalidateQueries({ queryKey: ['recycling-transactions'] });
    },
    onError: (err: any) => {
      setLogError(err.response?.data?.detail || 'Failed to log pickup');
    }
  });

  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      const data = new FormData();
      data.append('file', file);
      const res = await api.post('/uploads/pickup-photos', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPhotoUrl(res.data.public_url);
    } catch {
      setLogError('Photo upload failed');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;
    const w = parseFloat(actualWeight);
    if (isNaN(w) || w <= 0) {
      setLogError('Please enter a valid weight in kg');
      return;
    }
    logPickupMutation.mutate({
      txnId: selectedTxn.id,
      weight: w,
      photo: photoUrl || undefined
    });
  };

  const handleRateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = parseFloat(ratePerKg);
    if (isNaN(r) || r <= 0) {
      setRateError('Please enter a valid rate in ₹/kg');
      return;
    }
    postRateMutation.mutate({
      material: rateMaterial,
      rate_per_kg: r
    });
  };

  if (isRecyclerLoading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-emerald-600" />
        Loading recycler control center...
      </div>
    );
  }

  const isVerified = recycler?.verification_status === 'verified';
  const isPending = recycler?.verification_status === 'pending';

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Recycler Partner Portal
              </span>
              {isVerified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="h-3 w-3" /> Verified Partner
                </span>
              )}
              {isPending && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                  <Clock className="h-3 w-3" /> Verification Pending
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {recycler?.business_name || user?.name}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Accepted materials: {(recycler?.materials_accepted || []).join(', ') || 'All materials'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'requests'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sale Requests ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'rates'
                  ? 'bg-slate-950 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Price Rate Cards
            </button>
          </div>
        </div>

        {isPending && (
          <div className="mt-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <strong className="font-bold">Pending Municipal Approval:</strong> Your account is in the admin verification queue. Once verified by municipal operations, your posted rate cards will automatically appear on the public scrap price board.
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Requests & Pickup Logging */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900">Incoming Material Sale Requests</h3>
            <span className="text-xs font-semibold text-slate-400">
              Citizens requesting pickup at posted rates
            </span>
          </div>

          {isTxnLoading ? (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-400 animate-pulse">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Scale className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No sale requests yet</p>
              <p className="text-xs text-slate-500 mt-1">
                When citizens initiate scrap sales to your business, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {transactions.map((txn) => {
                const isRequested = txn.status === 'requested';
                const isLogged = txn.status === 'logged';
                const isConfirmed = txn.status === 'confirmed';
                const isDisputed = txn.status === 'disputed';

                return (
                  <div
                    key={txn.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          TXN #{txn.id}
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 capitalize">
                          {txn.material}
                        </span>
                        {isRequested && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            Action Required: Log Weight
                          </span>
                        )}
                        {isLogged && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                            Awaiting Citizen Confirm
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Confirmed & Receipt Issued
                          </span>
                        )}
                        {isDisputed && (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            Disputed by Citizen
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-slate-900">
                        Citizen: {txn.citizen_name || 'Citizen User'} ({txn.citizen_phone || 'Phone hidden'})
                      </h4>

                      <div className="text-xs text-slate-500 flex flex-wrap gap-4">
                        <span>Est. Weight: <strong>{txn.estimated_weight_kg ? `${txn.estimated_weight_kg} kg` : 'N/A'}</strong></span>
                        {txn.weight_kg && (
                          <span>Actual Weight: <strong>{txn.weight_kg} kg</strong></span>
                        )}
                        {txn.rate_applied && (
                          <span>Rate Snapshot: <strong>₹{Number(txn.rate_applied).toFixed(2)}/kg</strong></span>
                        )}
                        {txn.amount_credited && (
                          <span className="text-emerald-700 font-bold">
                            Credited: ₹{Number(txn.amount_credited).toFixed(2)}
                          </span>
                        )}
                        {txn.receipt && (
                          <span className="text-slate-600 font-semibold">
                            Receipt: <strong>{txn.receipt.receipt_number}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      {isRequested && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTxn(txn);
                            setActualWeight(String(txn.estimated_weight_kg || ''));
                            setPhotoUrl('');
                            setLogError(null);
                          }}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                        >
                          Log Pickup Weight
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal to log pickup */}
          {selectedTxn && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-slate-900">
                    Log Verified Pickup (TXN #{selectedTxn.id})
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedTxn(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleLogSubmit} className="space-y-4">
                  {logError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                      {logError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Material: {selectedTxn.material.toUpperCase()}
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Citizen estimated: {selectedTxn.estimated_weight_kg} kg
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Actual Verified Weight (kg) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={actualWeight}
                      onChange={(e) => setActualWeight(e.target.value)}
                      placeholder="e.g. 15.50"
                      className="w-full text-sm font-semibold rounded-xl border border-slate-300 p-3 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                      Collection Proof Photo (Optional)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        id="pickup-photo-upload"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(file);
                        }}
                      />
                      <label
                        htmlFor="pickup-photo-upload"
                        className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                      >
                        <Camera className="h-4 w-4" />
                        {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </label>
                      {photoUrl && (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle className="h-3.5 w-3.5" /> Photo Attached
                        </span>
                      )}
                    </div>
                  </div>

                  {actualWeight && parseFloat(actualWeight) > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                      <div className="font-bold flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-emerald-600" /> Rate Snapshot Preview:
                      </div>
                      <p>
                        Current rate for {selectedTxn.material} will be permanently snapshotted into the transaction ledger upon submission.
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedTxn(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={logPickupMutation.isPending}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
                    >
                      {logPickupMutation.isPending ? 'Logging...' : 'Confirm & Log Pickup'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Rate Card Management */}
      {activeTab === 'rates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Post/Update Rate Form */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm lg:col-span-1">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-emerald-600" /> Post / Update Rate Card
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set your live scrap purchasing rate. Updating a rate deactivates the prior rate while keeping historical snapshots intact.
            </p>

            <form onSubmit={handleRateSubmit} className="space-y-4">
              {rateError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {rateError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Recyclable Material
                </label>
                <select
                  value={rateMaterial}
                  onChange={(e) => setRateMaterial(e.target.value as MaterialType)}
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="plastic">Plastic</option>
                  <option value="paper">Paper</option>
                  <option value="metal">Metal</option>
                  <option value="e_waste">E-Waste</option>
                  <option value="glass">Glass</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Rate per Kilogram (₹ / kg) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={ratePerKg}
                  onChange={(e) => setRatePerKg(e.target.value)}
                  placeholder="e.g. 18.50"
                  className="w-full text-sm font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={postRateMutation.isPending || !isVerified}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm disabled:opacity-50"
              >
                {!isVerified
                  ? 'Verification Required'
                  : postRateMutation.isPending
                  ? 'Posting Rate...'
                  : 'Publish Active Rate'}
              </button>
            </form>
          </div>

          {/* Active Rates Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm lg:col-span-2">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-500" /> Current & Historical Rate Cards
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Active rates are surfaced directly on the public price board.
            </p>

            {rateCards.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-sm">
                No rate cards posted yet. Use the form on the left to set your first scrap rate.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Material</th>
                      <th className="pb-3">Rate (₹/kg)</th>
                      <th className="pb-3">Effective Date</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rateCards.map((rc) => (
                      <tr key={rc.id} className={rc.active ? 'bg-emerald-50/30' : 'text-slate-400'}>
                        <td className="py-3 font-bold text-slate-900 capitalize">
                          {rc.material}
                        </td>
                        <td className="py-3 font-black text-slate-900">
                          ₹{Number(rc.rate_per_kg).toFixed(2)}
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(rc.effective_from).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-right">
                          {rc.active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                              Archived
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
