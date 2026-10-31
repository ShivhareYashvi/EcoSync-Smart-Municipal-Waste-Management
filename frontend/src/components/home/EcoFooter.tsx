import React from 'react';
import { Link } from 'react-router-dom';
import {
  Recycle,
  Phone,
  ShieldCheck,
  Building2,
  Heart,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { ECO_NAV_ITEMS } from '../EcoNav';

export const EcoFooter: React.FC = () => {
  return (
    <footer
      role="contentinfo"
      aria-label="EcoSync Municipal Footer"
      className="border-t border-[#E4E7EC] bg-[#101828] text-white pt-16 pb-12"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Section */}
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#009B70] text-white shadow-sm">
                <Recycle className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white">EcoSync</span>
                <span className="block text-xs font-semibold text-emerald-400">
                  Smart Waste &amp; Circular Economy
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md">
              Connecting Bhopal households, municipal collection fleets, and CPCB-certified recycling facilities into a unified, transparent operating network. Featuring real-time GPS fleet telemetry, doorstep digital weighment, and Swachh Bharat circular rewards.
            </p>

            <div className="pt-2 text-xs text-slate-400 space-y-1">
              <p>
                <strong>Bhopal Municipal Operations Network</strong>
              </p>
              <p>
                Integrated with Bhopal Smart City Development Corporation (BSCDCL) &amp; Swachh Survekshan 2026.
              </p>
            </div>
          </div>

          {/* Quick Navigation (7 exact links) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Platform Sections
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              {ECO_NAV_ITEMS.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="hover:text-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Dedicated Municipal Portals */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Operational Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link to="/dashboard/user" className="hover:text-emerald-400 transition">
                  Citizen Hub &amp; Green Points
                </Link>
              </li>
              <li>
                <Link to="/dashboard/driver" className="hover:text-emerald-400 transition">
                  Driver PWA &amp; Offline Routes
                </Link>
              </li>
              <li>
                <Link to="/dashboard/admin" className="hover:text-emerald-400 transition">
                  Municipal Command Desk (ICCC)
                </Link>
              </li>
              <li>
                <Link to="/dashboard/recycler" className="hover:text-emerald-400 transition">
                  Recycler MRF &amp; EPR Ledger
                </Link>
              </li>
              <li>
                <Link to="/price-board" className="hover:text-emerald-400 transition">
                  Live Scrap Rate Board
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency & Municipal Helplines */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Emergency &amp; Support
            </h4>
            <div className="space-y-2 text-xs text-slate-300">
              <a
                href="tel:18002330014"
                className="block p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  BMC 24/7 Waste Control Room
                </span>
                <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  1800-233-0014
                </span>
              </a>

              <a
                href="tel:155304"
                className="block p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition"
              >
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Bhopal Civic Helpline
                </span>
                <span className="text-sm font-black text-white flex items-center gap-1.5 mt-0.5">
                  <Phone className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  155304
                </span>
              </a>

              <p className="text-[11px] text-slate-400">
                Email: <span className="text-slate-200">controlroom@bhopalcorp.gov.in</span>
              </p>
            </div>
          </div>
        </div>

        {/* Civic Compliance & Verification Badges */}
        <div className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              CPCB Legal Metrology Calibrated
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Building2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              Swachh Bharat Mission Urban 2.0
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Lock className="h-4 w-4 text-emerald-400" aria-hidden="true" />
              AES-256 Encrypted Civic Ledger
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Certified ISO 14001:2015 Environmental Management
          </div>
        </div>

        {/* Bottom Bar: Copyright & Accessibility Statement */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            &copy; 2026 EcoSync · Bhopal Municipal Operations Network. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-emerald-400 font-semibold">WCAG 2.2 Level AA Compliant</span>
            <span>&middot;</span>
            <Link to="/dashboard/user?tab=help" className="hover:text-white transition">
              Accessibility Statement
            </Link>
            <span>&middot;</span>
            <a href="#home" className="hover:text-white transition">
              Back to Top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

