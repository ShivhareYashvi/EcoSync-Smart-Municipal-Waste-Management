import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Award, Heart, ShieldCheck } from 'lucide-react';

export interface SloganItem {
  id: string;
  hindiSlogan: string;
  englishMeaning: string;
  subtext: string;
  actionTag: string;
  tagColor: string;
}

export const SWACHH_SLOGANS: SloganItem[] = [
  {
    id: 'slogan-1',
    hindiSlogan: 'गाड़ी वाला आया घर से कचरा निकाल — 100% स्रोत पृथक्करण हमारा संकल्प!',
    englishMeaning: 'The municipal collection vehicle has arrived — 100% source segregation is our pledge!',
    subtext: 'Bhopal Municipal Corporation ensures every morning doorstep sweep counts towards a cleaner neighborhood.',
    actionTag: 'Morning Collection Pledge',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  {
    id: 'slogan-2',
    hindiSlogan: 'गीला कचरा हरे डिब्बे में, सूखा कचरा नीले में — कचरा अलग, तो भोपाल अव्वल!',
    englishMeaning: 'Wet waste in the green bin, dry waste in the blue — Segregate waste to keep Bhopal #1!',
    subtext: 'Segregated wet waste powers decentralized aerobic compost pits and Adampur Chhawani bio-methane plants.',
    actionTag: 'Source Segregation Rule',
    tagColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  {
    id: 'slogan-3',
    hindiSlogan: 'स्वच्छ भोपाल, सुंदर भोपाल — एक कदम स्वच्छता की ओर!',
    englishMeaning: 'Clean Bhopal, Beautiful Bhopal — One collective step towards total civic cleanliness!',
    subtext: 'Join over 85 municipal wards in driving India’s highest Swachh Survekshan circular economy score.',
    actionTag: 'Swachh Survekshan 2026',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
];

export const SwachhBharatBanner: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);

  return (
    <section
      role="region"
      aria-label="Swachh Bharat & Swachh Bhopal Municipal Slogans"
      className="relative -mt-6 sm:-mt-8 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/20 bg-gradient-to-r from-emerald-950 via-[#006B4F] to-[#009B70] p-6 sm:p-8 text-white shadow-xl shadow-[#009B70]/15">
        {/* Tricolor Accent Strip */}
        <div className="absolute top-0 left-0 right-0 h-1.5 flex" aria-hidden="true">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-emerald-400/10 blur-xl" aria-hidden="true" />

        <div className="relative z-10 space-y-6">
          {/* Eyebrow strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#006B4F] text-xs font-black shadow-xs">
                🇮🇳
              </span>
              <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-emerald-200">
                Swachh Bharat Mission &middot; Bhopal Municipal Corporation &middot; Swachh Survekshan 2026
              </span>
            </div>

            <div className="flex items-center gap-2">
              {SWACHH_SLOGANS.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Show slogan ${idx + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    activeIdx === idx ? 'w-8 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Active Slogan Showcase */}
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-8 space-y-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${SWACHH_SLOGANS[activeIdx].tagColor}`}>
                <Award className="h-3 w-3" />
                <span>{SWACHH_SLOGANS[activeIdx].actionTag}</span>
              </span>

              {/* Hindi Slogan - prominent large typography */}
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug tracking-tight">
                "{SWACHH_SLOGANS[activeIdx].hindiSlogan}"
              </h2>

              {/* English Meaning */}
              <p className="text-xs sm:text-sm font-semibold text-emerald-100 italic">
                {SWACHH_SLOGANS[activeIdx].englishMeaning}
              </p>

              {/* Civic Context */}
              <p className="text-xs text-slate-200 leading-relaxed max-w-2xl">
                {SWACHH_SLOGANS[activeIdx].subtext}
              </p>
            </div>

            {/* Quick Slogan Selector Chips on Desktop */}
            <div className="lg:col-span-4 flex flex-col gap-2 border-t border-white/20 pt-4 lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 mb-1">
                Bhopal Civic Pledges:
              </span>
              {SWACHH_SLOGANS.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  className={`rounded-2xl p-3 text-left transition text-xs font-bold border ${
                    activeIdx === idx
                      ? 'bg-white/20 border-white text-white shadow-xs'
                      : 'bg-black/10 border-transparent text-emerald-100 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate mr-2">{item.actionTag}</span>
                    {activeIdx === idx && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
