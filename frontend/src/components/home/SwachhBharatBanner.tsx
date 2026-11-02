import React from 'react';
import { Award, CheckCircle2, Recycle, Truck, Sparkles } from 'lucide-react';

export interface SloganItem {
  id: string;
  hindiSlogan: string;
  categoryTag: string;
  civicNote: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  tagClass: string;
}

export const SWACHH_SLOGANS: SloganItem[] = [
  {
    id: 'slogan-1',
    hindiSlogan: 'गाड़ी वाला आया घर से कचरा निकाल - 100% स्रोत पृथक्करण हमारा संकल्प!',
    categoryTag: '100% Morning Sweep',
    civicNote: 'Doorstep Collection Mandate',
    icon: Truck,
    accentColor: 'text-emerald-300',
    tagClass: 'bg-emerald-500/15 text-emerald-200 border-emerald-400/30',
  },
  {
    id: 'slogan-2',
    hindiSlogan: 'गीला कचरा हरे डिब्बे में, सूखा कचरा नीले में - कचरा अलग, तो भोपाल अव्वल!',
    categoryTag: 'Two-Bin Segregation',
    civicNote: 'Green & Blue Bin Protocol',
    icon: Recycle,
    accentColor: 'text-sky-300',
    tagClass: 'bg-sky-500/15 text-sky-200 border-sky-400/30',
  },
  {
    id: 'slogan-3',
    hindiSlogan: 'स्वच्छ भोपाल, सुंदर भोपाल - एक कदम स्वच्छता की ओर!',
    categoryTag: 'Swachh Survekshan',
    civicNote: 'Rank #1 Clean State Capital',
    icon: Award,
    accentColor: 'text-amber-300',
    tagClass: 'bg-amber-500/15 text-amber-200 border-amber-400/30',
  },
];

export const SwachhBharatBanner: React.FC = () => {
  return (
    <section
      role="region"
      aria-label="Swachh Bharat & Bhopal Municipal Civic Pledges"
      className="relative -mt-6 sm:-mt-8 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-emerald-950 via-[#005c43] to-[#007a58] p-5 sm:p-7 text-white shadow-xl shadow-emerald-950/20">
        {/* Subtle Ambient Radial Glow */}
        <div
          className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs shadow-xs">
              🇮🇳
            </span>
            <span className="text-xs sm:text-sm font-black tracking-wide text-emerald-100">
              Swachh Bharat Mission &middot; Bhopal Municipal Corporation
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-200 bg-white/10 px-3 py-1 rounded-full border border-white/15 backdrop-blur-xs">
            <Sparkles className="h-3 w-3 text-amber-300" />
            <span>Official Civic Pledges</span>
          </div>
        </div>

        {/* 3 Streamlined, Uncluttered Civic Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {SWACHH_SLOGANS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="relative rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:bg-white/[0.13] hover:border-emerald-300/40 transition-all duration-200 shadow-sm group"
              >
                <div className="space-y-3">
                  {/* Clean Category Badge with Thematic Icon */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border ${item.tagClass}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.categoryTag}</span>
                    </span>
                  </div>

                  {/* Clean Hindi Slogan Typography (Removed redundant curly quotes) */}
                  <p className="text-base sm:text-[17px] font-extrabold text-white leading-snug tracking-normal">
                    {item.hindiSlogan}
                  </p>
                </div>

                {/* Bottom Verification Note */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-emerald-200/90">
                  <span>{item.civicNote}</span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
