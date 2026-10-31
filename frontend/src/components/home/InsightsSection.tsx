import React, { useState } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Share2,
  CheckCircle2,
} from 'lucide-react';

export interface InsightArticle {
  id: string;
  title: string;
  category: string;
  badgeBg: string;
  date: string;
  readTime: string;
  summary: string;
  fullContent: string[];
  author: string;
  role: string;
}

export const INSIGHT_ARTICLES: InsightArticle[] = [
  {
    id: 'art-01',
    title: 'Mastering Household 4-Stream Waste Segregation in Bhopal: A Practical Citizen Guide',
    category: 'Segregation Guide',
    badgeBg: 'bg-emerald-100 text-emerald-800',
    date: 'Oct 28, 2026',
    readTime: '4 min read',
    summary: 'A detailed breakdown of how to organize your home kitchen, bathroom, and utility areas to achieve 100% compliant source sorting and maximize household EcoPoints.',
    author: 'Dr. Sunita Deshmukh',
    role: 'Civic Environmental Consultant, BMC',
    fullContent: [
      'Proper waste segregation at the doorstep is the single most critical factor determining whether waste is converted into valuable compost and recycled commodities or left to generate methane in landfills.',
      '1. Green Stream (Wet Organic): Keep a dedicated ventilated kitchen bin for all food scraps, vegetable peels, tea leaves, and garden trim. Never use plastic liners—use newspaper or biodegradable cornstarch bags.',
      '2. Blue Stream (Dry Recyclables): Rinse milk pouches, plastic bottles, and tin cans to prevent insect infestation. Keep cardboard boxes folded flat to maximize storage and collection efficiency.',
      '3. Red Stream (Domestic Hazardous): Store paint residues, aerosol cans, expired pills, and disinfectant containers in a closed, labeled box away from children.',
      '4. Purple Stream (E-Waste): Never dispose of batteries or electronic cords in common bins. Place them in your purple e-waste drop or hand them directly to your EcoSync collection vehicle for cash payouts.',
    ],
  },
  {
    id: 'art-02',
    title: 'BMC Deploys 45 New Electric Collection Vehicles Across Zones 8 & 11',
    category: 'Municipal Update',
    badgeBg: 'bg-blue-100 text-blue-800',
    date: 'Oct 24, 2026',
    readTime: '3 min read',
    summary: 'Bhopal Municipal Corporation expands its green fleet with zero-emission electric tippers equipped with integrated digital weighment sensors and sub-second GPS telemetry.',
    author: 'Er. R. K. Sharma',
    role: 'Chief Fleet Engineer, BSCDCL',
    fullContent: [
      'In alignment with the National Clean Air Programme (NCAP) and Swachh Survekshan guidelines, Bhopal Municipal Corporation has inducted 45 new zero-emission electric collection tippers into active service.',
      'These vehicles operate across Zone 8 (New Market / TT Nagar) and Zone 11 (Shahpura & Chunabhatti), replacing older diesel compactors. Each vehicle features automated dual-compartment hydraulic tipping, Bluetooth-linked load cells, and sub-second GPS tracking.',
      'The new fleet is projected to reduce municipal fuel expenditures by ₹4.2 Lakhs per month while eliminating over 18 tonnes of tailpipe carbon emissions quarterly.',
    ],
  },
  {
    id: 'art-03',
    title: 'How Arera Colony Diverted 28 Tonnes of Organic Waste to Aerobic Compost in 90 Days',
    category: 'Case Study',
    badgeBg: 'bg-lime-100 text-lime-800',
    date: 'Oct 19, 2026',
    readTime: '5 min read',
    summary: 'A community case study on how Ward 48 resident welfare associations achieved a 94.2% segregation rate, unlocking property tax rebates and community garden compost.',
    author: 'Pradeep Saxena',
    role: 'President, Arera Colony Sector E-3 RWA',
    fullContent: [
      'Over the past 90 days, residents of Arera Colony Sectors E-1 through E-7 collaborated with EcoSync and ward municipal staff to conduct a neighborhood-wide segregation initiative.',
      'By utilizing EcoSync’s real-time vehicle arrival notifications, missed collection logging, and doorstep weighment verification, household participation surged from 68% to over 94%.',
      'The community successfully diverted 28 tonnes of pure wet organic waste from the Adampur Chhawani landfill directly to the ward’s decentralized aerobic composting pits, yielding over 7 tonnes of rich garden fertilizer distributed back to community parks.',
    ],
  },
  {
    id: 'art-04',
    title: 'Understanding the 2026 CPCB Extended Producer Responsibility (EPR) Mandate',
    category: 'Regulatory Policy',
    badgeBg: 'bg-purple-100 text-purple-800',
    date: 'Oct 12, 2026',
    readTime: '6 min read',
    summary: 'How brand producers, fast-moving consumer goods companies, and certified recyclers are utilizing EcoSync digital weighment receipts for verified audit compliance.',
    author: 'Adv. Manisha Trivedi',
    role: 'Environmental Law Practitioner, MP High Court',
    fullContent: [
      'Under the Plastic Waste Management and E-Waste Management Rules issued by the Central Pollution Control Board (CPCB), consumer product manufacturers are legally mandated to recover 100% of the post-consumer packaging materials they place in the market.',
      'EcoSync provides an auditable bridge by generating cryptographically verified digital weighment receipts when recyclables are transferred from households to CPCB-registered recovery facilities.',
      'Brand producers can inspect transparent mass-balance ledgers, verify that collection occurred in verified Bhopal municipal wards, and download digital EPR credit certificates for their mandatory compliance audits.',
    ],
  },
];

export const InsightsSection: React.FC = () => {
  const [selectedArticle, setSelectedArticle] = useState<InsightArticle | null>(null);

  return (
    <section
      id="insights"
      role="region"
      aria-labelledby="insights-heading"
      className="border-t border-[#E4E7EC] bg-white py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAFBF4] text-[#006B4F] text-xs font-bold uppercase tracking-wider border border-[#009B70]/20">
            <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Civic Knowledge &amp; Updates</span>
          </span>

          <h2
            id="insights-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
          >
            Insights &amp; <span className="text-[#009B70]">Municipal Updates.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
            Educational articles, waste segregation best practices, fleet modernization announcements, and circular economy research from Bhopal.
          </p>
        </div>

        {/* Article Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {INSIGHT_ARTICLES.map((art) => (
            <article
              key={art.id}
              className="rounded-3xl border border-[#E4E7EC] bg-[#F7F9FC] p-6 space-y-4 hover:border-[#009B70]/50 hover:bg-white hover:shadow-lg transition flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${art.badgeBg}`}>
                    {art.category}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-[#475467]">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    <span>{art.readTime}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-[#101828] group-hover:text-[#006B4F] transition leading-snug">
                  {art.title}
                </h3>

                <p className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                  {art.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[#475467] text-[11px] font-medium">{art.date}</span>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(art)}
                  aria-label={`Read full article: ${art.title}`}
                  className="font-bold text-[#006B4F] hover:underline flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-[#009B70] rounded-lg px-1 py-0.5"
                >
                  <span>Read Article</span>
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Accessible Article Reader Modal */}
        {selectedArticle && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-modal-title"
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          >
            <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-6">
              {/* Modal Top Bar */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${selectedArticle.badgeBg}`}>
                    {selectedArticle.category}
                  </span>
                  <h3 id="article-modal-title" className="text-xl sm:text-2xl font-black text-[#101828] leading-tight">
                    {selectedArticle.title}
                  </h3>
                  <p className="text-xs text-[#475467] pt-1">
                    By <strong>{selectedArticle.author}</strong> ({selectedArticle.role}) · {selectedArticle.date}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  aria-label="Close article"
                  className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition focus-visible:ring-2 focus-visible:ring-[#009B70]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Modal Article Content */}
              <div className="space-y-4 text-xs sm:text-sm text-[#475467] leading-relaxed">
                {selectedArticle.fullContent.map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-[#475467] flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#009B70]" aria-hidden="true" />
                  Verified Municipal Civic Education
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedArticle(null)}
                  className="rounded-xl bg-[#101828] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition focus-visible:ring-2 focus-visible:ring-[#009B70]"
                >
                  Close Reader
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

