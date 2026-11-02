import React, { useState } from 'react';
import {
  ChevronDown,
  Sparkles,
  Building2,
  Gift,
  Truck,
  CheckCircle2,
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'mission' | 'rewards' | 'driver' | 'roadmap';
  question: string;
  answer: string;
  highlights?: string[];
}

export const FAQ_ITEMS: FAQItem[] = [
  // ── 1. Mission & Operations ──────────────────────────────────
  {
    id: 'faq-01',
    category: 'mission',
    question: 'What is EcoSync and how is it integrated with Bhopal Municipal Corporation (BMC)?',
    answer:
      'EcoSync is Bhopal’s intelligent civic waste management and circular economy platform, developed in partnership with Bhopal Smart City Development Corporation Limited (BSCDCL) and BMC. It coordinates morning doorstep waste collection across all 85 municipal wards, connects fleet telemetry directly to the Bhopal Integrated Command and Control Centre (ICCC), and ensures verified recovery of recyclables.',
    highlights: [
      'Active across all 85 BMC administrative wards and 19 zones.',
      'Sub-second telemetry fed directly to the Bhopal ICCC Command Desk.',
      'Diverts segregated wet waste to Adampur Chhawani bio-methanation and composting plants.',
    ],
  },
  {
    id: 'faq-02',
    category: 'mission',
    question: 'How does 4-stream doorstep waste collection work in Bhopal?',
    answer:
      'Every morning between 07:00 AM and 11:30 AM, BMC electric and CNG collection tippers arrive at households to collect waste separated into four distinct streams: Wet Organic (green bin), Dry Recyclables (blue bin), Domestic Hazardous (red box/bin), and E-Waste (purple drop). Segregation at the source is mandatory under SWM Rules 2016 and directly unlocks citizen EcoPoints.',
    highlights: [
      'Wet Organic: Food scraps, vegetable peels, garden cuttings (never in plastic bags).',
      'Dry Recyclables: Clean paper, cardboard, plastics, tin cans, glass bottles.',
      'Domestic Hazardous: Disinfectant bottles, paint residue, aerosol cans, expired medication.',
      'E-Waste: Discarded wires, batteries, old chargers, small consumer electronics.',
    ],
  },
  {
    id: 'faq-03',
    category: 'mission',
    question: 'How are collection vehicles automatically assigned to wards and colonies?',
    answer:
      'EcoSync uses a Vehicle Routing Problem (VRP) dispatch engine based on Bhopal’s municipal GIS boundaries. Each ward has dedicated primary collection tippers assigned by ward density and historical load volumes. If a vehicle experiences unexpected mechanical issues, the ICCC central dispatcher automatically reroutes an adjacent zone backup within 15 minutes.',
  },

  // ── 2. Citizen Rewards & Legal Metrology ─────────────────────
  {
    id: 'faq-04',
    category: 'rewards',
    question: 'How do citizens earn EcoPoints and climb tiers?',
    answer:
      'Households earn points automatically when their waste is weighed and verified by the collection driver. The calculation awards 50 base points for every verified collection stop plus 5 bonus points per kg of verified segregated waste (capped at 50 bonus points per week to prevent commercial dumping). Maintaining ≥4 consecutive clean collection weeks unlocks a 1.2x streak multiplier.',
    highlights: [
      'Bronze Tier (0–499 pts): Base collection and live vehicle tracking.',
      'Silver Tier (500–1,999 pts): +10% Scrap Price Board bonus and priority support.',
      'Gold Tier (2,000–4,999 pts): 5% BMC Property Tax Rebate eligibility and Metro passes.',
      'Platinum Swachhata Champion (5,000+ pts): 10% BMC Property Tax Rebate and free compost.',
    ],
  },
  {
    id: 'faq-05',
    category: 'rewards',
    question: 'How can citizens redeem EcoPoints for BMC Property Tax rebates and utility vouchers?',
    answer:
      'Citizens can open their Citizen Hub Rewards tab and redeem accumulated EcoPoints for official Bhopal Municipal benefits. For the 5% or 10% Annual Property Tax Rebate, a tamper-proof digital certificate tied to your Bhopal GIS Property ID is generated. You can also redeem points for Bhopal Metro (Bhoj Metro) ₹250 travel passes, free 10 kg ward organic compost bags, or electricity bill credits.',
  },
  {
    id: 'faq-06',
    category: 'rewards',
    question: 'How does EcoSync guarantee accurate weighing under Legal Metrology standards?',
    answer:
      'Every EcoSync driver uses a Bluetooth-linked digital hanging load cell calibrated under CPCB and Department of Legal Metrology regulations (Accuracy Class III). The scale performs automatic digital tare calibration before each weighment. The encrypted gross, tare, and net weights are uploaded with a timestamp and GPS coordinate directly to the immutable database.',
  },
  {
    id: 'faq-07',
    category: 'rewards',
    question: 'What happens if a citizen disputes a weighment or contamination mark?',
    answer:
      'EcoSync features a dispute protection buffer. If a driver flags waste as contaminated, points are placed in "Pending" rather than forfeited outright. The citizen has 72 hours to review the driver photo and submit an appeal with their explanation. The ward sanitary inspector reviews and resolves disputes, ensuring honest citizens are never unfairly penalized.',
  },

  // ── 3. Driver (Swachhata Mitra) Welfare ──────────────────────
  {
    id: 'faq-08',
    category: 'driver',
    question: 'How do collection drivers (Swachhata Mitras) earn performance incentives?',
    answer:
      'Drivers receive a fixed salary supplemented by dynamic, performance-linked civic incentives: ₹50 for completing morning route sweeps on time, ₹10 per verified digital scale weighment with photo, ₹150 weekly for maintaining eco-friendly green speeds (15–25 km/h) with low fuel consumption, and ₹500 monthly if their assigned ward achieves over 85% segregation compliance.',
    highlights: [
      'On-time sweep completion bonus: ₹50/shift.',
      'Digital weighment and photo logging: ₹10/verified stop.',
      'Green speed and VRP route efficiency: ₹150/week.',
      'Ward Cleanliness Champion bonus: ₹500/month.',
    ],
  },
  {
    id: 'faq-09',
    category: 'driver',
    question: 'How are driver healthcare, safety, and direct payments managed?',
    answer:
      'All certified Bhopal Swachhata Mitras are enrolled in the Swachhata Mitra Suraksha Bima Scheme, providing ₹5,00,000 cashless hospitalization coverage at AIIMS Bhopal and Hamidia Hospital, along with regular hepatitis and tetanus vaccinations. Incentives are deposited directly into drivers’ verified bank accounts via Direct Benefit Transfer (DBT) on the 5th of each month.',
  },

  // ── 4. Smart City Roadmap & Coming Soon Innovations ──────────
  {
    id: 'faq-10',
    category: 'roadmap',
    question: 'What is the upcoming AI Contamination Camera Pre-Scan feature?',
    answer:
      'Currently in pilot testing for Q1 2027, this feature will allow citizens to point their smartphone camera at their open green or blue bin for 3 seconds before collection. On-device computer vision models verify segregation compliance with 99.1% accuracy and instantly award an extra +15 EcoPoints before the driver arrives at the gate.',
  },
  {
    id: 'faq-11',
    category: 'roadmap',
    question: 'How will Bhopal Metro (Bhoj Metro) smart card direct NFC redemption work?',
    answer:
      'EcoSync is partnering with Madhya Pradesh Metro Rail Corporation Limited (MPMRCL) to enable direct NFC top-ups. Citizens will be able to tap their Bhoj Metro smart card against their NFC-enabled smartphone to instantly convert EcoPoints into transit ride balances, making public transit truly circular and reward-driven.',
  },
  {
    id: 'faq-12',
    category: 'roadmap',
    question: 'What are Ultrasonic Smart Community Bin Sensors?',
    answer:
      'Solar-powered ultrasonic level sensors will be deployed on public community bins across Bhopal. When a bin reaches 80% volume, it automatically triggers an API alert to the nearest route tipper, preventing overflow and eliminating unnecessary truck trips to half-empty bins.',
  },
  {
    id: 'faq-13',
    category: 'roadmap',
    question: 'What are Adampur Chhawani Bio-CNG Cylinder Subsidies and RWA Green Grants?',
    answer:
      'Two major circular innovations scheduled for 2027: (1) Households with 100% wet waste compliance will receive direct subsidies on piped natural gas (PNG) and 14.2 kg bio-methane cooking cylinders produced at Adampur Chhawani. (2) Neighborhood RWAs can pool community EcoPoints to unlock matching BMC municipal grants of up to ₹25,000 for park solarization, rainwater harvesting, and neighborhood composting.',
  },
];

export const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'mission' | 'rewards' | 'driver' | 'roadmap'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-01');

  const filteredFaqs =
    activeCategory === 'all'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="faq"
      role="region"
      aria-labelledby="faq-heading"
      className="border-t border-[#E4E7EC] bg-[#F7F9FC] py-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2
            id="faq-heading"
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#101828] tracking-tight"
          >
            Questions &amp; <span className="text-[#009B70]">Smart-City Roadmap.</span>
          </h2>

          <p className="text-base sm:text-lg text-[#475467] leading-relaxed">
            Everything you need to know about Bhopal municipal operations, citizen rewards, driver welfare, and upcoming smart-city innovations.
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              activeCategory === 'all'
                ? 'bg-[#101828] text-white shadow-xs'
                : 'bg-white text-[#475467] hover:bg-slate-100 border border-[#E4E7EC]'
            }`}
          >
            All Questions ({FAQ_ITEMS.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('mission')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'mission'
                ? 'bg-[#009B70] text-white shadow-xs'
                : 'bg-white text-[#475467] hover:bg-slate-100 border border-[#E4E7EC]'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Project &amp; Bhopal Operations</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('rewards')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'rewards'
                ? 'bg-[#009B70] text-white shadow-xs'
                : 'bg-white text-[#475467] hover:bg-slate-100 border border-[#E4E7EC]'
            }`}
          >
            <Gift className="h-3.5 w-3.5" />
            <span>Citizen Rewards &amp; Taxes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('driver')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'driver'
                ? 'bg-[#009B70] text-white shadow-xs'
                : 'bg-white text-[#475467] hover:bg-slate-100 border border-[#E4E7EC]'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Driver Welfare &amp; Incentives</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('roadmap')}
            className={`rounded-full px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
              activeCategory === 'roadmap'
                ? 'bg-[#009B70] text-white shadow-xs'
                : 'bg-white text-[#475467] hover:bg-slate-100 border border-[#E4E7EC]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Coming Soon Innovations</span>
          </button>
        </div>

        {/* Accordion Questions List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 bg-white ${
                  isOpen
                    ? 'border-[#009B70] shadow-md ring-1 ring-[#009B70]/20'
                    : 'border-[#E4E7EC] hover:border-slate-300 shadow-2xs'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${faq.id}`}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left transition focus-visible:ring-2 focus-visible:ring-[#009B70] rounded-2xl"
                >
                  <span className="text-base sm:text-lg font-bold text-[#101828] leading-snug">
                    {faq.question}
                  </span>
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ${
                      isOpen
                        ? 'bg-[#EAFBF4] text-[#006B4F] rotate-180'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </div>
                </button>

                {isOpen && (
                  <div
                    id={`faq-answer-${faq.id}`}
                    role="region"
                    aria-labelledby={`faq-question-${faq.id}`}
                    className="px-5 pb-6 sm:px-6 pt-1 text-sm sm:text-base text-[#475467] leading-relaxed border-t border-slate-100 space-y-3 animate-in fade-in duration-200"
                  >
                    <p>{faq.answer}</p>

                    {faq.highlights && faq.highlights.length > 0 && (
                      <div className="rounded-xl bg-[#F7F9FC] p-4 border border-slate-200 space-y-1.5 text-xs sm:text-sm text-[#101828]">
                        <span className="font-bold uppercase tracking-wider text-[11px] text-[#006B4F] block">
                          Key Takeaways:
                        </span>
                        {faq.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#009B70] shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-900 via-[#006B4F] to-[#009B70] p-8 text-white text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1">
            <h3 className="text-xl font-black text-white">Have a specific question about your ward?</h3>
            <p className="text-xs sm:text-sm text-emerald-100">
              Contact the Bhopal Municipal Corporation citizen helpline or connect directly via the Citizen Hub.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href="tel:155304"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-[#006B4F] shadow-sm hover:bg-slate-100 transition"
            >
              <span>Call BMC Helpline (155304)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
