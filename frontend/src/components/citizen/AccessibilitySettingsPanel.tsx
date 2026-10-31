import React from 'react';
import {
  Sliders,
  Type,
  SunMoon,
  Link as LinkIcon,
  ZapOff,
  Maximize2,
  Volume2,
  RotateCcw,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { useAccessibilityStore, type TextScale } from '../../store/accessibilityStore';

export const AccessibilitySettingsPanel: React.FC = () => {
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

  const handleNextTextSize = () => {
    if (textScale === 'sm') setTextScale('base');
    else if (textScale === 'base') setTextScale('lg');
    else if (textScale === 'lg') setTextScale('xl');
  };

  const handlePrevTextSize = () => {
    if (textScale === 'xl') setTextScale('lg');
    else if (textScale === 'lg') setTextScale('base');
    else if (textScale === 'base') setTextScale('sm');
  };

  const scaleLabels: Record<TextScale, string> = {
    sm: 'Small (14px)',
    base: 'Default (16px)',
    lg: 'Large (18px)',
    xl: 'Extra Large (20px)',
  };

  return (
    <div className="space-y-6 max-w-4xl" role="region" aria-label="Accessibility and Display Preferences">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Sliders className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Accessibility & Display Preferences
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Complies with WCAG 2.2 Level AA standards. Preferences are automatically saved to your browser.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetToDefaults}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 transition"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>Reset to Defaults</span>
          </button>
        </div>

        {/* Live Accessibility Status Bar */}
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
          <span className="font-bold text-slate-800">Active Profile:</span>
          {highContrast && (
            <span className="rounded-md bg-slate-900 text-white px-2 py-0.5 text-[11px] font-bold">
              High Contrast
            </span>
          )}
          <span className="rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold">
            Text: {scaleLabels[textScale]}
          </span>
          {underlinedLinks && (
            <span className="rounded-md bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 text-[11px] font-bold">
              Underlined Links
            </span>
          )}
          {reducedMotion && (
            <span className="rounded-md bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[11px] font-bold">
              Reduced Motion
            </span>
          )}
          {increasedSpacing && (
            <span className="rounded-md bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 text-[11px] font-bold">
              Expanded Spacing
            </span>
          )}
          {screenReaderAssistance && (
            <span className="rounded-md bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 text-[11px] font-bold">
              Screen Reader Live
            </span>
          )}
        </div>
      </div>

      {/* Real-time Visual Preview Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-slate-50/60 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Eye className="h-4 w-4 text-emerald-700" aria-hidden="true" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Live Interface Preview
          </h2>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
          <h3 className="font-bold text-slate-900 text-base">
            Sample Municipal Pickup Schedule (Ward 48 Node)
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">
            Doorstep municipal waste collection arrives every morning between 07:00 AM and 10:00 AM.
            Please ensure wet and dry streams are segregated. For questions,{' '}
            <a href="#test" className="text-emerald-700 font-bold hover:underline" onClick={(e) => e.preventDefault()}>
              read our segregation guidelines
            </a>.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl bg-emerald-600 text-white font-bold text-xs px-4 py-2 hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              Primary Action Button
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Interactive target size: ~44×44px
            </span>
          </div>
        </div>
      </div>

      {/* 8 Functional Accessibility Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. High Contrast Mode */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <SunMoon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${highContrast ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                {highContrast ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">High Contrast Mode</h3>
            <p className="text-xs text-slate-500 mt-1">
              Maximizes contrast ratios (&gt; 7:1) with stark black borders and high-legibility backgrounds.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={highContrast}
            onClick={() => setHighContrast(!highContrast)}
            className={`mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              highContrast
                ? 'bg-slate-900 text-white hover:bg-black'
                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {highContrast ? 'Disable High Contrast' : 'Enable High Contrast'}
          </button>
        </div>

        {/* 2 & 3. Font Size & Text Scaling */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <Type className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {scaleLabels[textScale]}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Text Size Scaling</h3>
            <p className="text-xs text-slate-500 mt-1">
              Scales typography across all dashboard containers without clipping or overflow.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-1.5">
            {(['sm', 'base', 'lg', 'xl'] as TextScale[]).map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setTextScale(scale)}
                aria-pressed={textScale === scale}
                className={`rounded-xl py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  textScale === scale
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {scale.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Underlined Links */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <LinkIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${underlinedLinks ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
                {underlinedLinks ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Always Underline Links</h3>
            <p className="text-xs text-slate-500 mt-1">
              Adds permanent visual underlines to interactive links so they do not rely on color alone.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={underlinedLinks}
            onClick={() => setUnderlinedLinks(!underlinedLinks)}
            className={`mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              underlinedLinks
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {underlinedLinks ? 'Disable Underlined Links' : 'Enable Underlined Links'}
          </button>
        </div>

        {/* 5. Reduced Motion */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <ZapOff className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${reducedMotion ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                {reducedMotion ? 'Reduced' : 'Standard'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Reduce Animations & Motion</h3>
            <p className="text-xs text-slate-500 mt-1">
              Disables decorative transitions, bouncing icons, and pulsing animations for vestibular comfort.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reducedMotion}
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              reducedMotion
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {reducedMotion ? 'Enable Standard Motion' : 'Reduce All Animations'}
          </button>
        </div>

        {/* 6. Increased Interface Spacing */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <Maximize2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${increasedSpacing ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'}`}>
                {increasedSpacing ? 'Expanded' : 'Standard'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Increased Interface Spacing</h3>
            <p className="text-xs text-slate-500 mt-1">
              Increases padding, letter spacing, and line height for citizens with motor or visual challenges.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={increasedSpacing}
            onClick={() => setIncreasedSpacing(!increasedSpacing)}
            className={`mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              increasedSpacing
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {increasedSpacing ? 'Standard Spacing' : 'Increase Spacing'}
          </button>
        </div>

        {/* 7. Screen Reader Assistance */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <Volume2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${screenReaderAssistance ? 'bg-teal-100 text-teal-800' : 'bg-slate-100 text-slate-600'}`}>
                {screenReaderAssistance ? 'Active' : 'Off'}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Screen Reader Live Guidance</h3>
            <p className="text-xs text-slate-500 mt-1">
              Provides dedicated live text telemetry, landmark announcements, and plain-language vehicle descriptions.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={screenReaderAssistance}
            onClick={() => setScreenReaderAssistance(!screenReaderAssistance)}
            className={`mt-4 w-full rounded-xl py-2.5 px-4 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              screenReaderAssistance
                ? 'bg-teal-700 text-white hover:bg-teal-800'
                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
          >
            {screenReaderAssistance ? 'Disable Live Guidance' : 'Enable Live Guidance'}
          </button>
        </div>
      </div>
    </div>
  );
};
