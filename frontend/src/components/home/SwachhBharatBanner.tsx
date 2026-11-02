import React from 'react';
import { Award, CheckCircle2, Recycle, Truck } from 'lucide-react';

export interface SloganItem {
  id: string;
  hindiSlogan: string;
  actionTag: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tagBg: string;
  tagColor: string;
  tagBorder: string;
}

export const SWACHH_SLOGANS: SloganItem[] = [
  {
    id: 'slogan-1',
    hindiSlogan: 'गाड़ी वाला आया घर से कचरा निकाल - 100% स्रोत पृथक्करण हमारा संकल्प!',
    actionTag: 'MORNING COLLECTION PLEDGE',
    subtitle: '100% Doorstep Collection Sweep',
    icon: Truck,
    tagBg: 'bg-emerald-500/20',
    tagColor: 'text-emerald-200',
    tagBorder: 'border-emerald-400/30',
  },
  {
    id: 'slogan-2',
    hindiSlogan: 'गीला कचरा हरे डिब्बे में, सूखा कचरा नीले में - कचरा अलग, तो भोपाल अव्वल!',
    actionTag: 'SOURCE SEGREGATION RULE',
    subtitle: 'Green & Blue Two-Bin Mandate',
    icon: Recycle,
    tagBg: 'bg-sky-500/20',
    tagColor: 'text-sky-200',
    tagBorder: 'border-sky-400/30',
  },
  {
    id: 'slogan-3',
    hindiSlogan: 'स्वच्छ भोपाल, सुंदर भोपाल - एक कदम स्वच्छता की ओर!',
    actionTag: 'SWACHH SURVEKSHAN 2026',
    subtitle: 'Rank #1 Cleanest State Capital',
    icon: Award,
    tagBg: 'bg-amber-500/20',
    tagColor: 'text-amber-200',
    tagBorder: 'border-amber-400/30',
  },
];

export const SwachhBharatBanner: React.FC = () => {
  return (
    <section
      role="region"
      aria-label="Swachh Bharat & Bhopal Municipal Civic Pledges"
      className="relative -mt-6 sm:-mt-8 z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
    >
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950 via-[#006B4F] to-[#008B64] p-5 sm:p-7 text-white shadow-lg shadow-[#009B70]/10">
        {/* Subtle Ambient Glow */}
        <div
          className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Header Bar */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/15 mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs shadow-xs">
              🇮🇳
            </span>
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-emerald-200">
              Swachh Bharat Mission &middot; Bhopal Municipal Corporation
            </span>
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 bg-white/10 px-3 py-0.5 rounded-full border border-white/15">
            Bhopal Civic Pledges
          </span>
        </div>

        {/* 3 Optimized Civic Cards Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {SWACHH_SLOGANS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xs p-4 sm:p-5 flex flex-col justify-between space-y-3.5 hover:bg-white/15 hover:border-white/30 transition-all duration-200 group"
              >
                <div className="space-y-2.5">
                  {/* Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider border ${item.tagBg} ${item.tagColor} ${item.tagBorder}`}
                  >
                    <Icon className="h-3 w-3" />
                    <span>{item.actionTag}</span>
                  </span>

                  {/* Hindi Slogan Typography */}
                  <h3 className="text-base sm:text-lg font-black text-white leading-snug tracking-tight">
                    &ldquo;{item.hindiSlogan}&rdquo;
                  </h3>
                </div>

                {/* Bottom Subtitle Chip */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold text-emerald-200">
                  <span>{item.subtitle}</span>
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 opacity-80 group-hover:opacity-100" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
