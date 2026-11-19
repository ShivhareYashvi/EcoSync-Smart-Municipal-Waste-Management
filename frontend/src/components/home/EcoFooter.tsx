import React from 'react';
import { Link } from 'react-router-dom';
import {
  Recycle,
  Phone,
  GraduationCap,
} from 'lucide-react';
import { ECO_NAV_ITEMS } from '../../lib/navItems';

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
                <strong>Academic Project Proposal &middot; College Capstone</strong>
              </p>
              <p>
                Conceptual smart waste management model proposed for Bhopal.
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
                  <Link
                    to={item.href}
                    className="hover:text-emerald-400 transition focus-visible:ring-2 focus-visible:ring-emerald-400 rounded"
                  >
                    {item.label}
                  </Link>
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
                  Bhopal Waste Control Room (Reference)
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
                Public Directory Reference: <span className="text-slate-200">Bhopal Municipal Services</span>
              </p>
            </div>
          </div>
        </div>

        {/* Academic Project Proposal Disclaimer */}
        <div className="pt-8 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <p className="text-emerald-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <span>Academic Project Proposal &middot; Not An Official BMC Platform</span>
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-4xl">
            <strong>Disclaimer:</strong> EcoSync is a student college project proposal created strictly for educational, academic, and demonstration purposes. It is a proposed technological concept for municipal solid waste management and is not operated, owned, verified, or officially endorsed by the Bhopal Municipal Corporation (BMC), BSCDCL, CPCB, or any government authority.
          </p>
        </div>

        {/* Bottom Bar: Copyright & Accessibility Statement */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p>
            &copy; 2026 EcoSync · College Project Proposal for Smart Municipal Waste Management.
          </p>

          <div className="flex items-center gap-4">
            <a href="#home" className="hover:text-white transition">
              Back to Top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

