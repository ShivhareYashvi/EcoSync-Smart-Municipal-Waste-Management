import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { api } from '../../lib/api';
import { Recycler, RecyclerVerificationStatus } from '../../lib/types';

export function RecyclerVerificationQueue() {
  const queryClient = useQueryClient();

  const { data: pendingRecyclers = [], isLoading } = useQuery<Recycler[]>({
    queryKey: ['pending-recyclers'],
    queryFn: async () => {
      const res = await api.get<Recycler[]>('/recyclers/pending');
      return res.data;
    }
  });

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: RecyclerVerificationStatus }) => {
      return api.patch(`/recyclers/${id}/verify`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-recyclers'] });
      queryClient.invalidateQueries({ queryKey: ['verified-recyclers'] });
      queryClient.invalidateQueries({ queryKey: ['public-rates'] });
    }
  });

  return (
    <article className="glass-card rounded-[2rem] p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-950 flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" /> Recycler Verification Queue
          </h3>
          <p className="text-sm text-slate-600">
            Review trade licenses and municipal permits to authorize recyclers on the public scrap board.
          </p>
        </div>
        <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" /> {pendingRecyclers.length} Pending
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-6 text-slate-400 text-xs">Loading pending queue...</div>
      ) : pendingRecyclers.length === 0 ? (
        <div className="text-center py-8 bg-white/60 rounded-2xl border border-slate-200 text-slate-500 text-xs">
          No pending recyclers awaiting verification. All registered partners are processed.
        </div>
      ) : (
        <div className="space-y-3">
          {pendingRecyclers.map((rec) => (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">{rec.business_name}</h4>
                <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                  <span>Materials: <strong>{rec.materials_accepted.join(', ') || 'All'}</strong></span>
                  <span>Registered: {new Date(rec.created_at).toLocaleDateString()}</span>
                  {rec.verification_doc_url && (
                    <a
                      href={rec.verification_doc_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-600 font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      View License <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ id: rec.id, status: 'verified' })}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Check className="h-3.5 w-3.5" /> Approve Partner
                </button>
                <button
                  type="button"
                  disabled={verifyMutation.isPending}
                  onClick={() => verifyMutation.mutate({ id: rec.id, status: 'rejected' })}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
