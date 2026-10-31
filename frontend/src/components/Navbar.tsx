import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  Layers,
  LogOut,
  Menu,
  Phone,
  Recycle,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  User as UserIcon,
  X
} from 'lucide-react';
import { dashboardPathForRole } from '../lib/navigation';
import { useScrollDirection } from '../lib/useScrollDirection';
import { useSessionStore } from '../store/session';

export interface NavbarProps {
  /**
   * Mode controls visibility and visual style:
   * - 'public': Auto-hides on downward scroll, reveals on upward scroll. Sleek frosted glass.
   * - 'dashboard': Always sticky at top. Includes operational role tabs and profile controls.
   * - 'auth': Minimal distraction-free header with "Back to Home" link and municipal helpline.
   */
  mode?: 'public' | 'dashboard' | 'auth';
  title?: string;
  subtitle?: string;
}

const DASHBOARD_LINKS: Array<{ to: string; label: string; role?: string }> = [
  { to: '/dashboard/user', label: 'Citizen Console', role: 'citizen' },
  { to: '/dashboard/driver', label: 'Driver Console', role: 'driver' },
  { to: '/dashboard/recycler', label: 'Recycler Hub', role: 'recycler' },
  { to: '/dashboard/admin', label: 'Operations Command', role: 'admin' },
  { to: '/dashboard/admin/zones', label: 'Zone Analytics', role: 'admin' },
  { to: '/dashboard/admin/fleet', label: 'Fleet & IoT', role: 'admin' },
  { to: '/dashboard/admin/bulk-generators', label: 'Bulk Generators', role: 'admin' },
  { to: '/dashboard/admin/routes', label: 'Route Dispatch', role: 'admin' },
  { to: '/price-board', label: 'Scrap Rates' },
  { to: '/features', label: 'Platform Features' }
];

export function Navbar({ mode = 'public', title, subtitle }: NavbarProps) {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const clearSession = useSessionStore((state) => state.clearSession);

  // Auto-hide scroll state for public mode
  const { isVisible, isAtTop } = useScrollDirection(12);

  // Mobile menu drawer open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    clearSession();
    navigate('/');
    setMobileMenuOpen(false);
  }

  // 1. AUTH MODE: Minimal distraction-free header
  if (mode === 'auth') {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/60 bg-slate-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-sm transition group-hover:scale-105">
              <Recycle className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">EcoSync</span>
              <span className="hidden sm:inline-block ml-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Civic Access
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="tel:155304"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
              title="Bhopal Municipal Helpline"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>Helpline: 155304</span>
            </a>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-slate-200 transition hover:bg-slate-800 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }

  // 2. DASHBOARD MODE: Always sticky, operational tabs, profile pill
  if (mode === 'dashboard') {
    const userRoleLinks = DASHBOARD_LINKS.filter(
      (link) => !link.role || link.role === user?.role
    );

    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-sm">
        {/* Main Header Strip */}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm transition group-hover:scale-105">
                <Recycle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black tracking-tight text-slate-900">EcoSync</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 border border-emerald-200">
                    {user?.role ? `${user.role} Hub` : 'Operations'}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500">
                  {subtitle || 'Bhopal Municipal Operations Network'}
                </p>
              </div>
            </Link>
          </div>

          {/* Right: User Profile & Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-2 rounded-2xl bg-slate-50 p-1 border border-slate-200">
                <Link
                  to={user.role === 'citizen' ? '/dashboard/user?tab=profile' : `/dashboard/${user.role}`}
                  className="flex items-center gap-2 px-2.5 py-1 hover:bg-white rounded-xl transition cursor-pointer"
                  title="View Civic Profile & ID Card"
                >
                  <div className="h-7 w-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name ? user.name.slice(0, 2) : 'U'}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[130px]">
                      {user.name}
                    </p>
                    <span className="text-[10px] font-semibold text-emerald-700 capitalize flex items-center gap-1">
                      {user.role} <span className="text-[9px] text-slate-400">· ID Card</span>
                    </span>
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-white hover:text-slate-900 transition"
                  title="Switch Role or Account"
                >
                  Switch
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition flex items-center gap-1"
                  title="Sign out of EcoSync"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 transition"
              aria-label="Toggle navigation drawer"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Secondary Tab Bar (Desktop: Clean horizontal row) */}
        <div className="border-t border-slate-100 bg-slate-50/70">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
              {userRoleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            {user && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                    {user.name ? user.name.slice(0, 2) : 'U'}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500 capitalize">{user.role} · Bhopal Hub</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600"
                >
                  Logout
                </button>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2">Navigation</p>
              {userRoleLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-3 py-2 text-sm font-bold transition ${
                      isActive ? 'bg-emerald-50 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="hover:text-emerald-700 font-medium">
                Public Home
              </Link>
              <a href="tel:155304" className="text-emerald-700 font-bold">
                BMC Helpline: 155304
              </a>
            </div>
          </div>
        )}
      </header>
    );
  }

  // 3. PUBLIC MODE: Auto-hides on downward scroll, reveals on upward scroll
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      } ${
        isAtTop
          ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/60 shadow-none'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm transition group-hover:scale-105 group-hover:bg-emerald-700">
            <Recycle className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black tracking-tight text-slate-950">EcoSync</span>
              <span className="hidden sm:inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-800 border border-emerald-200">
                Bhopal Municipal Network
              </span>
            </div>
            <span className="block text-[10px] font-semibold text-slate-400 -mt-0.5">
              Smart Waste & Circular Economy
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden items-center gap-6 md:flex text-xs lg:text-sm font-bold text-slate-600">
          <Link
            to="/features"
            className="transition hover:text-emerald-700"
          >
            Platform Capabilities
          </Link>
          <a
            href="/#circular-loop"
            className="transition hover:text-emerald-700"
          >
            Circular Loop
          </a>
          <a
            href="/#telemetry"
            className="transition hover:text-emerald-700"
          >
            Civic Telemetry
          </a>
          <Link
            to="/price-board"
            className="inline-flex items-center gap-1.5 transition hover:text-emerald-700"
          >
            <span>Scrap Price Board</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
          </Link>
        </nav>

        {/* Right Action / Auth Button */}
        <div className="hidden sm:flex items-center gap-3">
          <a
            href="tel:155304"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:text-emerald-700 text-xs font-semibold transition"
            title="Bhopal Municipal Corporation 24/7 Helpline"
          >
            <Phone className="h-3.5 w-3.5 text-emerald-600" />
            <span>BMC Helpline: 155304</span>
          </a>

          {user ? (
            <div className="flex items-center gap-1.5 rounded-2xl bg-white p-1 border border-slate-200/90 shadow-sm">
              <Link
                to={dashboardPathForRole(user.role)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition"
                title="Open Operational Dashboard"
              >
                <div className="h-7 w-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {user.name ? user.name.slice(0, 2).toUpperCase() : 'U'}
                </div>
                <div className="text-left">
                  <p className="text-xs font-black text-slate-900 leading-none truncate max-w-[120px]">
                    {user.name || 'User'}
                  </p>
                  <span className="text-[10px] font-semibold text-emerald-700 capitalize">
                    {user.role} Hub
                  </span>
                </div>
              </Link>

              {user.role === 'citizen' && (
                <Link
                  to="/dashboard/user?tab=profile"
                  className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition"
                  title="Household Civic ID & Property Gate"
                >
                  Civic ID
                </Link>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Sign out of EcoSync"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
              >
                Log In
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow"
              >
                <span>Citizen Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <Link
              to={dashboardPathForRole(user.role)}
              className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200"
            >
              Console
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 px-6 py-5 backdrop-blur-xl shadow-xl space-y-4 animate-in slide-in-from-top-2">
          <nav className="flex flex-col space-y-3 text-sm font-semibold text-slate-700">
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-700 transition"
            >
              Platform Features
            </a>
            <a
              href="/#circular-loop"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-700 transition"
            >
              Circular Economy Loop
            </a>
            <a
              href="/#telemetry"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 hover:text-emerald-700 transition"
            >
              Civic Impact & Telemetry
            </a>
            <Link
              to="/price-board"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1 text-emerald-700 flex items-center justify-between"
            >
              <span>Scrap Price Board</span>
              <span className="text-[10px] font-bold bg-emerald-100 px-2 py-0.5 rounded-full text-emerald-800">
                Live Rates
              </span>
            </Link>
          </nav>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Portals</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                to="/login/citizen"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Citizen Portal
              </Link>
              <Link
                to="/login/driver"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Driver Console
              </Link>
              <Link
                to="/login/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Municipal Admin
              </Link>
              <Link
                to="/rates"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-800 hover:bg-slate-100"
              >
                Recycler Market
              </Link>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">{user.name}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl border border-slate-200 py-2.5 text-center text-xs font-bold text-slate-700"
                >
                  Log In
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-bold text-white shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

