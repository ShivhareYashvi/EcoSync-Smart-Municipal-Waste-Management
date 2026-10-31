import { Link } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Flame,
  Globe,
  Heart,
  HelpCircle,
  Layers,
  Leaf,
  MapPin,
  Phone,
  Recycle,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

export interface FooterProps {
  /**
   * - 'public': Comprehensive municipal footer with sitemap, BMC contacts, CPCB compliance, portals.
   * - 'dashboard': Ultra-compact, unobtrusive bottom bar preserving operational workspace.
   * - 'auth': Minimal security & trust statement.
   */
  mode?: 'public' | 'dashboard' | 'auth';
}

export function Footer({ mode = 'public' }: FooterProps) {
  const currentYear = new Date().getFullYear();

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. AUTH MODE: Discreet trust badge
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'auth') {
    return (
      <footer className="w-full py-4 text-center text-xs text-slate-500">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Secured by bcrypt hashing, rate-limiting & stateless JWT bearer tokens</span>
        </p>
        <p className="mt-1 text-[11px] text-slate-400">
          EcoSync Municipal Network · Bhopal Smart City Development Corporation
        </p>
      </footer>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. DASHBOARD MODE: Compact operational status bar
  // ─────────────────────────────────────────────────────────────────────────────
  if (mode === 'dashboard') {
    return (
      <footer className="mt-12 border-t border-slate-200/80 bg-white/60 py-3 backdrop-blur-sm text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">EcoSync Command Center</span>
            <span>·</span>
            <span>Bhopal Municipal Corporation (BMC)</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>All Systems Operational (85 Wards)</span>
            </div>

            <span className="hidden sm:inline text-slate-300">|</span>

            <a
              href="tel:155304"
              className="flex items-center gap-1 text-slate-600 hover:text-emerald-700 transition font-medium"
              title="24x7 Bhopal Municipal Helpline"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-600" />
              <span>Helpline: 155304</span>
            </a>

            <span className="hidden sm:inline text-slate-300">|</span>

            <Link
              to="/price-board"
              className="text-slate-600 hover:text-emerald-700 transition font-medium"
            >
              Scrap Rates
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. PUBLIC MODE: Comprehensive Municipal & Circular Economy Footer
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <footer className="bg-slate-950 text-slate-400 pt-16 pb-12 border-t border-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-5">
          {/* Col 1 & 2: Municipal Branding & Telemetry */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md">
                <Recycle className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight text-white">EcoSync</span>
                <span className="block text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Smart Municipal Waste Management
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-400 max-w-md">
              Next-generation municipal waste intelligence and circular economy platform.
              Bridging citizens, municipal fleet dispatchers, and authorized recyclers with
              transparent pricing, verified Extended Producer Responsibility (EPR) tracking,
              and GPS-guided operations in Bhopal.
            </p>

            {/* Telemetry pill */}
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900/90 px-3.5 py-2 border border-slate-800 text-xs text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>All Systems Operational · Bhopal Wards 1-85 Live · CPCB Aligned</span>
            </div>

            <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 border border-slate-800">
                Swachh Bharat Mission 2.0
              </span>
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 border border-slate-800">
                CPCB EPR Portal Aligned
              </span>
              <span className="rounded-lg bg-slate-900 px-2.5 py-1 border border-slate-800">
                Smart Cities Mission MP
              </span>
            </div>
          </div>

          {/* Col 3: Role Portals */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Civic Portals
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/login/citizen" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  Citizen Doorstep Pickup
                </Link>
              </li>
              <li>
                <Link to="/login/driver" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  Driver Field Console & GPS
                </Link>
              </li>
              <li>
                <Link to="/login/admin" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  Municipal Operations Admin
                </Link>
              </li>
              <li>
                <Link to="/rates" className="hover:text-emerald-400 transition flex items-center gap-1.5">
                  Recycler Scrap Marketplace
                </Link>
              </li>
              <li>
                <Link to="/price-board" className="text-emerald-400 hover:text-emerald-300 transition font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Live Scrap Price Board
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Bhopal Municipal Support & Helplines */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              Municipal Helpline
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="tel:155304"
                  className="font-bold text-emerald-400 hover:underline flex items-center gap-1.5"
                >
                  <span>Toll-Free: 155304</span>
                </a>
                <span className="text-[11px] text-slate-500 block">Bhopal Swachhata 24x7 Helpline</span>
              </li>
              <li className="pt-1">
                <span className="text-slate-300 font-medium">Bhopal Municipal Corp. (BMC)</span>
                <span className="text-[11px] text-slate-500 block">Smart City Office, TT Nagar, Bhopal</span>
              </li>
              <li className="pt-1">
                <span className="text-slate-300 font-medium">Operational Wards:</span>
                <span className="text-[11px] text-slate-500 block">
                  Arera Colony, MP Nagar, Kolar, TT Nagar, Shahpura, Govindpura, Karond
                </span>
              </li>
            </ul>
          </div>

          {/* Col 5: Developer & Civic APIs */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              Developer & APIs
            </p>
            <ul className="space-y-2.5 text-xs">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>OpenAPI / Swagger Specs</span>
                  <ExternalLink className="h-3 w-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/admin"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>SQLAdmin Django Console</span>
                  <ExternalLink className="h-3 w-3 text-slate-600" />
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition flex items-center gap-1"
                >
                  <span>Health & Metrics Telemetry</span>
                  <ExternalLink className="h-3 w-3 text-slate-600" />
                </a>
              </li>
              <li>
                <Link to="/features" className="hover:text-emerald-400 transition">
                  Feature Architecture Guide
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Standards */}
        <div className="mt-12 border-t border-slate-900 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {currentYear} EcoSync Municipal Platform · Bhopal Municipal Corporation (BMC) & Swachh
            Bharat Mission.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <a href="#features" className="hover:text-slate-400 transition">Privacy Policy</a>
            <span>·</span>
            <a href="#features" className="hover:text-slate-400 transition">Civic Terms</a>
            <span>·</span>
            <span className="text-emerald-500 font-medium">Bhopal Ward 47-65 Node Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

