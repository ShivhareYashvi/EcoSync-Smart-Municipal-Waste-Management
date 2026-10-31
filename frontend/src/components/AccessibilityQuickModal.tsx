import React, { useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  Type,
  SunMoon,
  Link as LinkIcon,
  ZapOff,
  Maximize2,
  Volume2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useAccessibilityStore, type TextScale } from '../store/accessibilityStore';

interface AccessibilityQuickModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityQuickModal: React.FC<AccessibilityQuickModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const {
    highContrast,
    textScale,
    underlinedLinks,
    reducedMotion,
    increasedSpacing,
    screenReaderAssistance,
    setHighContrast,
    setTextScale,
    setUnderlinedLinks,
    setReducedMotion,
    setIncreasedSpacing,
    setScreenReaderAssistance,
    resetToDefaults,
  } = useAccessibilityStore();

  // Escape key handler and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Auto focus close button on open
    setTimeout(() => closeButtonRef.current?.focus(), 50);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const scaleLabels: Record<TextScale, string> = {
    sm: 'Small (14px)',
    base: 'Default (16px)',
    lg: 'Large (18px)',
    xl: 'Extra Large (20px)',
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-a11y-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold">
              <Sliders className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="quick-a11y-title" className="text-lg font-black text-slate-900">
                Accessibility Preferences
              </h2>
              <p className="text-xs text-slate-500">WCAG 2.2 Level AA Display Options</p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close accessibility options"
            className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Controls Grid */}
        <div className="space-y-3.5 text-xs">
          {/* 1. High Contrast */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition">
            <div className="flex items-center gap-3">
              <SunMoon className="h-5 w-5 text-emerald-700 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-900">High Contrast Mode (&gt; 7:1)</p>
                <p className="text-[11px] text-slate-500">Pure high-contrast borders and foregrounds</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
              className={`rounded-xl px-3 py-1.5 font-bold transition border ${
                highContrast
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {highContrast ? 'Enabled [Active]' : 'Enable'}
            </button>
          </div>

          {/* 2. Text Scaling */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Type className="h-5 w-5 text-blue-600 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-bold text-slate-900">Text Scaling Size</p>
                  <p className="text-[11px] text-slate-500">Current: {scaleLabels[textScale]}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {(['sm', 'base', 'lg', 'xl'] as TextScale[]).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setTextScale(scale)}
                  aria-pressed={textScale === scale}
                  className={`rounded-xl py-2 px-1 text-center font-bold border transition ${
                    textScale === scale
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="block capitalize">{scale}</span>
                  <span className="text-[10px] opacity-80">
                    {scale === 'sm' ? '14px' : scale === 'base' ? '16px' : scale === 'lg' ? '18px' : '20px'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Underlined Links */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition">
            <div className="flex items-center gap-3">
              <LinkIcon className="h-5 w-5 text-indigo-600 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-900">Always Underline Links</p>
                <p className="text-[11px] text-slate-500">Differentiates hyperlinks without relying on color</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUnderlinedLinks(!underlinedLinks)}
              aria-pressed={underlinedLinks}
              className={`rounded-xl px-3 py-1.5 font-bold transition border ${
                underlinedLinks
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {underlinedLinks ? 'Active' : 'Off'}
            </button>
          </div>

          {/* 4. Reduced Motion */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition">
            <div className="flex items-center gap-3">
              <ZapOff className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-900">Reduced Motion</p>
                <p className="text-[11px] text-slate-500">Disables animations and transitions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReducedMotion(!reducedMotion)}
              aria-pressed={reducedMotion}
              className={`rounded-xl px-3 py-1.5 font-bold transition border ${
                reducedMotion
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {reducedMotion ? 'Active' : 'Off'}
            </button>
          </div>

          {/* 5. Increased Spacing */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition">
            <div className="flex items-center gap-3">
              <Maximize2 className="h-5 w-5 text-purple-600 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-900">Expanded Touch Spacing</p>
                <p className="text-[11px] text-slate-500">Increases padding and button target spacing</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncreasedSpacing(!increasedSpacing)}
              aria-pressed={increasedSpacing}
              className={`rounded-xl px-3 py-1.5 font-bold transition border ${
                increasedSpacing
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {increasedSpacing ? 'Active' : 'Off'}
            </button>
          </div>

          {/* 6. Screen Reader Guidance */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white transition">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-teal-600 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-bold text-slate-900">Screen Reader Extra Context</p>
                <p className="text-[11px] text-slate-500">Expands spoken descriptions for NVDA / JAWS</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setScreenReaderAssistance(!screenReaderAssistance)}
              aria-pressed={screenReaderAssistance}
              className={`rounded-xl px-3 py-1.5 font-bold transition border ${
                screenReaderAssistance
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {screenReaderAssistance ? 'Active' : 'Off'}
            </button>
          </div>
        </div>

        {/* Footer with Reset and Done */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={resetToDefaults}
            className="flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset to Defaults</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-800 transition"
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};

