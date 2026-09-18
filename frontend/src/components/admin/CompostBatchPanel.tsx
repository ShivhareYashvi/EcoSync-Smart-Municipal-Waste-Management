import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Leaf, PlusCircle, Sprout } from 'lucide-react';
import { api } from '../../lib/api';
import { CompostBatch, CompostBatchStatus, Zone } from '../../lib/types';

export function CompostBatchPanel() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [zoneId, setZoneId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>(
    new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  );
  const [periodEnd, setPeriodEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customWeight, setCustomWeight] = useState<string>('');
  const [buyerNote, setBuyerNote] = useState<string>('');
  const [formErr, setFormErr] = useState<string | null>(null);

  // Fetch zones
  const { data: zones = [] } = useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: async () => {
      const res = await api.get<Zone[]>('/zones');
      return res.data;
    }
  });

  // Fetch compost batches
  const { data: batches = [], isLoading } = useQuery<CompostBatch[]>({
    queryKey: ['compost-batches'],
    queryFn: async () => {
      const res = await api.get<CompostBatch[]>('/compost-batches');
      return res.data;
    }
  });

  // Create batch mutation
  const createBatchMutation = useMutation({
    mutationFn: async () => {
      if (!zoneId) throw new Error('Please select a zone');
      const payload: any = {
        zone_id: Number(zoneId),
        period_start: periodStart,
        period_end: periodEnd,
        buyer_note: buyerNote || null
      };
      if (customWeight && parseFloat(customWeight) > 0) {
        payload.total_weight_kg = parseFloat(customWeight);
      }
      return api.post('/compost-batches', payload);
    },
    onSuccess: () => {
      setShowCreateModal(false);
      setCustomWeight('');
      setBuyerNote('');
      setFormErr(null);
      queryClient.invalidateQueries({ queryKey: ['compost-batches'] });
    },
    onError: (err: any) => {
      setFormErr(err.response?.data?.detail || err.message || 'Failed to create compost batch');
    }
  });

  // Advance status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: CompostBatchStatus; note?: string }) => {
      return api.patch(`/compost-batches/${id}/status`, {
        status,
        buyer_note: note || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compost-batches'] });
    }
  });

  return (
    <article className="glass-card rounded-[2rem] p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider">
              Organic Waste Recovery
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
            <Leaf className="h-6 w-6 text-emerald-600" /> Municipal Compost Batch Tracking
          </h3>
          <p className="text-sm text-slate-600">
            Aggregate wet-waste from verified household collections into cured compost batches.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setZoneId(zones[0]?.id ? String(zones[0].id) : '');
            setShowCreateModal(true);
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle className="h-4 w-4" /> Create Compost Batch
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-400 text-xs">Loading compost batches...</div>
      ) : batches.length === 0 ? (
        <div className="text-center py-8 bg-white/60 rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No compost batches tracked yet. Click "Create Compost Batch" to aggregate wet waste.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch) => {
            const isCollected = batch.status === 'collected';
            const isComposting = batch.status === 'composting';
            const isCompleted = batch.status === 'completed';

            return (
              <div
                key={batch.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-400">BATCH #{batch.id}</span>
                    {isCollected && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Stage 1: Collected
                      </span>
                    )}
                    {isComposting && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        Stage 2: Composting
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Stage 3: Completed
                      </span>
                    )}
                  </div>

                  <h4 className="text-base font-bold text-slate-900">
                    Zone: {batch.zone_name || `Zone #${batch.zone_id}`}
                  </h4>

                  <div className="text-xs text-slate-500 space-y-1 mt-2">
                    <p>
                      Period: <strong>{batch.period_start}</strong> to <strong>{batch.period_end}</strong>
                    </p>
                    <p className="text-sm font-black text-slate-900">
                      Total Wet Waste: {Number(batch.total_weight_kg).toFixed(2)} kg
                    </p>
                    {batch.buyer_note && (
                      <p className="p-2 bg-slate-50 rounded-lg text-slate-600 text-[11px] italic">
                        "{batch.buyer_note}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Created {new Date(batch.created_at).toLocaleDateString()}
                  </span>

                  <div>
                    {isCollected && (
                      <button
                        type="button"
                        onClick={() => updateStatusMutation.mutate({ id: batch.id, status: 'composting' })}
                        className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        Start Curing <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                    {isComposting && (
                      <button
                        type="button"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: batch.id,
                            status: 'completed',
                            note: 'Batch fully cured & ready for nursery/agricultural distribution'
                          })
                        }
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        Mark Completed <CheckCircle2 className="h-3 w-3" />
                      </button>
                    )}
                    {isCompleted && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <Sprout className="h-4 w-4" /> Ready for Offtake
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h4 className="text-lg font-black text-slate-900 mb-2">Create Compost Batch</h4>
            <p className="text-xs text-slate-500 mb-4">
              Aggregate wet waste from completed zone pickups within the specified date range.
            </p>

            {formErr && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium mb-3">
                {formErr}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createBatchMutation.mutate();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Target Municipal Zone *
                </label>
                <select
                  value={zoneId}
                  onChange={(e) => setZoneId(e.target.value)}
                  required
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900"
                >
                  <option value="">Select Zone</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Period End *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Custom Weight Override (kg, Optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={customWeight}
                  onChange={(e) => setCustomWeight(e.target.value)}
                  placeholder="Auto-calculated from pickups if blank"
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Buyer Note / Nursery Offtake (Optional)
                </label>
                <input
                  type="text"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="e.g. Allocated to Horticulture Dept."
                  className="w-full text-xs font-semibold rounded-xl border border-slate-300 p-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBatchMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                >
                  {createBatchMutation.isPending ? 'Creating...' : 'Initialize Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </article>
  );
}
