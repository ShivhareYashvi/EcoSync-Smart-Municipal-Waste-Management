import React, { useState } from 'react';
import { X, Plane, Leaf, Lock, CheckCircle2, ShieldCheck } from 'lucide-react';

interface SkipSweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSkip: (reason: string, notes?: string) => void;
  wardNumber?: string;
}

const SKIP_REASONS = [
  {
    id: 'travel',
    label: 'Out of Town / Traveling',
    description: 'House is closed; no waste generated during this period.',
    icon: Plane,
  },
  {
    id: 'zero_waste',
    label: 'Zero Waste Today',
    description: 'No waste accumulation; bins are completely clean/empty.',
    icon: Leaf,
  },
  {
    id: 'composting',
    label: 'Home Composting Active',
    description: 'Wet waste converted to garden compost; dry waste stored.',
    icon: CheckCircle2,
  },
  {
    id: 'locked',
    label: 'Gate / Property Unavailable',
    description: 'Unable to present bins to the morning collection tipper.',
    icon: Lock,
  },
];

export const SkipSweepModal: React.FC<SkipSweepModalProps> = ({
  isOpen,
  onClose,
  onConfirmSkip,
  wardNumber = 'Ward 48',
}) => {
  const [selectedReason, setSelectedReason] = useState('travel');
  const [customNote, setCustomNote] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onConfirmSkip(
        SKIP_REASONS.find((r) => r.id === selectedReason)?.label || 'Out of Town',
        customNote
      );
      setConfirmed(false);
      onClose();
    }, 900);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="skip-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-800 border border-amber-200">
              <ShieldCheck className="h-3 w-3 text-amber-600" />
              <span>EcoPoints Streak Protected</span>
            </span>
            <h3 id="skip-modal-title" className="text-xl font-black text-slate-900 leading-tight">
              Skip Today's Waste Collection
            </h3>
            <p className="text-xs text-slate-500">
              Notify your {wardNumber} collection driver not to idle outside your gate today.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close skip modal"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Reason Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Select Reason for Skipping:
          </label>
          <div className="grid gap-2">
            {SKIP_REASONS.map((r) => {
              const Icon = r.icon;
              const isSelected = selectedReason === r.id;

              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedReason(r.id)}
                  className={`flex items-start gap-3 rounded-2xl p-3.5 text-left border transition ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600/30 text-emerald-950'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white text-slate-700'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-xl shrink-0 mt-0.5 ${
                      isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{r.description}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Note */}
        <div className="space-y-1.5">
          <label htmlFor="skip-note" className="text-xs font-bold text-slate-700 block">
            Note for Assigned Driver (Optional):
          </label>
          <input
            id="skip-note"
            type="text"
            placeholder="e.g. Back in town on Monday morning"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
          />
        </div>

        {/* Streak Assurance Callout */}
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>EcoPoints Streak Protected:</strong> Advance skip notifications do not penalize your clean segregation score or reset your 1.2x streak multiplier!
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition flex items-center gap-1.5"
          >
            {confirmed ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Marked Skipped!</span>
              </>
            ) : (
              <span>Confirm Skip for Today</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
