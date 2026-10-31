import React from 'react';
import { X, HelpCircle, Phone, BookOpen, Keyboard, ShieldCheck } from 'lucide-react';

interface HelpSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-support-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 text-slate-900">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <HelpCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="help-support-title" className="text-lg font-black text-slate-900">
                Citizen Help & Civic Support
              </h2>
              <p className="text-xs text-slate-500">
                Bhopal Municipal Corporation Operations Network
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

        <div className="space-y-4 text-xs text-slate-600">
          {/* Municipal Helpline */}
          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-sm">
              <Phone className="h-4 w-4" aria-hidden="true" />
              <span>Official 24x7 BMC Control Room</span>
            </div>
            <p className="leading-relaxed">
              Toll-Free Helpline: <strong className="text-slate-900 font-mono">155304</strong> or{' '}
              <strong className="text-slate-900 font-mono">1800-233-0014</strong>.
            </p>
            <p className="text-[11px] text-slate-500">
              Available 7 days a week for uncollected garbage, overflow bins, and sanitation emergencies.
            </p>
          </div>

          {/* Waste Segregation Guidelines */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <BookOpen className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span>Waste Segregation Rules (CPCB 2024)</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 leading-normal text-slate-600">
              <li><strong>Green Bin (Wet Waste):</strong> Kitchen scraps, vegetable peels, leftover food, tea leaves.</li>
              <li><strong>Blue Bin (Dry Recyclables):</strong> Clean paper, cardboard, plastic bottles, metal cans.</li>
              <li><strong>Red Bin (Domestic Hazardous):</strong> Expired medicine, syringes, pesticide bottles, chemicals.</li>
              <li><strong>Black Bin (E-Waste):</strong> Broken chargers, mobile phones, batteries, fluorescent bulbs.</li>
            </ul>
          </div>

          {/* Accessibility & Keyboard Navigation */}
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Keyboard className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <span>Keyboard Navigation & Accessibility</span>
            </div>
            <p className="leading-normal">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Tab</kbd> to cycle through controls,{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Enter</kbd> to activate buttons, and{' '}
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[11px]">Esc</kbd> to close any dialog or menu.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 text-white font-bold text-xs px-5 py-2.5 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            Close Help Guide
          </button>
        </div>
      </div>
    </div>
  );
};

