import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../../lib/api';

interface MissedPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  wardNumber: string;
}

export const MissedPickupModal: React.FC<MissedPickupModalProps> = ({
  isOpen,
  onClose,
  userId,
  wardNumber,
}) => {
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Submit as urgent missed collection complaint
      await api.post('/complaints', {
        user_id: userId,
        category: 'missed_pickup',
        description: `MISSED PICKUP ALERT [Ward ${wardNumber}]: ${notes || 'Doorstep municipal collection vehicle did not arrive during scheduled morning sweep.'} Location: ${address || 'Registered Residence'}`,
      });
      setSubmitted(true);
    } catch {
      setError('Failed to dispatch alert. Please dial the BMC 155304 helpline directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="missed-pickup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-rose-700">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="missed-pickup-title" className="text-lg font-black text-slate-900">
                Report Missed Waste Collection
              </h2>
              <p className="text-xs text-slate-500">
                Direct alert to BMC Ward {wardNumber} Sanitation Inspector
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div className="py-6 text-center space-y-3">
            <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Emergency Ward Sweep Dispatched
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Ticket logged. The Ward {wardNumber} Chief Sanitation Inspector has been alerted. An auxiliary collection vehicle will be routed to your gate.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 rounded-xl bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 hover:bg-emerald-700"
            >
              Return to Citizen Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="missed-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Colony / Gate Address
              </label>
              <input
                id="missed-address"
                type="text"
                placeholder="e.g. E-4/204 Arera Colony, near 10 No. Market"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-600 outline-none"
              />
            </div>

            <div>
              <label htmlFor="missed-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                id="missed-notes"
                rows={3}
                placeholder="Specify if vehicle skipped the street or passed before time slot..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-600 outline-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-bold hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{loading ? 'Transmitting Alert...' : 'Dispatch Alert to Ward'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

