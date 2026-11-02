import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Recycle,
  Phone,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Moon,
  Sun,
} from 'lucide-react';
import { useSessionStore } from '../store/session';
import { useAccessibilityStore } from '../store/accessibilityStore';
import { dashboardPathForRole } from '../lib/navigation';
import { ECO_NAV_ITEMS } from '../lib/navItems';

export function EcoNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const darkMode = useAccessibilityStore((s) => s.darkMode);
  const toggleDarkMode = useAccessibilityStore((s) => s.toggleDarkMode);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isItemActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    if (href === '/rates') {
      return (
        location.pathname === '/rates' ||
        location.pathname === '/price-board' ||
        location.pathname === '/scrap' ||
        location.pathname === '/scrap-rates'
      );
    }
    return location.pathname.startsWith(href);
  };

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    navigate(href);
  };

  const citizenHubDestination = user ? dashboardPathForRole(user.role) : '/login';

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E4E7EC] shadow-xs py-2.5'
            : 'bg-white/90 backdrop-blur-sm border-b border-[#E4E7EC]/80 py-3.5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Identity */}
          <Link
            to="/"
            onClick={() => handleNavClick('/')}
            aria-label="EcoSync Bhopal Home"
            className="flex items-center gap-2.5 shrink-0 group focus-visible:ring-2 focus-visible:ring-[#009B70] rounded-xl pr-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009B70] text-white shadow-xs transition group-hover:bg-[#006B4F]">
              <Recycle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <span className="text-lg font-black tracking-tight text-[#101828]">EcoSync</span>
            </div>
          </Link>

          {/* Center: Primary Navigation (Home, Operations, Scrap Rates, About, Blog) */}
          <nav
            role="navigation"
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[#475467]"
          >
            {ECO_NAV_ITEMS.map((item) => {
              const active = isItemActive(item.href);

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative whitespace-nowrap px-3.5 py-1.5 rounded-xl transition text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#009B70] ${
                    active
                      ? 'text-[#006B4F] bg-[#EAFBF4] font-black shadow-2xs'
                      : 'text-[#475467] hover:text-[#101828] hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#009B70] rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: User Actions */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Night Shift / Dark Theme Quick Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              aria-label={darkMode ? 'Switch to Light Theme' : 'Switch to Night Shift Theme'}
              title={darkMode ? 'Switch to Light Theme' : 'Switch to Night Shift Theme'}
              className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-[#E4E7EC] dark:border-slate-700 bg-white dark:bg-slate-900 text-[#475467] dark:text-amber-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-2xs focus-visible:ring-2 focus-visible:ring-[#009B70]"
            >
              {darkMode ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
            </button>

            {/* Municipal Helpline Pill */}
            <a
              href="tel:155304"
              aria-label="Bhopal Municipal Corporation Helpline: 155304"
              title="Bhopal Municipal Corporation 24/7 Helpline"
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] px-2.5 py-1.5 text-xs font-semibold text-[#475467] hover:text-[#006B4F] hover:border-[#009B70]/30 transition"
            >
              <Phone className="h-3.5 w-3.5 text-[#009B70]" aria-hidden="true" />
              <span className="text-[11px]">Helpline: <strong>155304</strong></span>
            </a>

            {/* Citizen Hub Primary CTA */}
            <Link
              to={citizenHubDestination}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#009B70] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#006B4F] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#009B70]"
            >
              {user ? (
                <>
                  <div className="h-4 w-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-black">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <span>Citizen Hub</span>
                </>
              ) : (
                <>
                  <span>Citizen Hub</span>
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </>
              )}
            </Link>

            {/* Mobile / Tablet Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={mobileMenuOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
              className="lg:hidden flex items-center justify-center rounded-xl border border-[#E4E7EC] p-2 text-[#475467] hover:bg-slate-100 hover:text-[#101828] focus-visible:ring-2 focus-visible:ring-[#009B70] transition"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation Menu"
            className="lg:hidden border-t border-[#E4E7EC] bg-white px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2"
          >
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475467] px-3 mb-1">
                Bhopal Smart Platform
              </p>
              {ECO_NAV_ITEMS.map((item) => {
                const active = isItemActive(item.href);

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold text-left transition ${
                      active
                        ? 'bg-[#EAFBF4] text-[#006B4F] font-black border border-[#009B70]/20'
                        : 'text-[#475467] hover:bg-slate-50 hover:text-[#101828]'
                    }`}
                  >
                    <span>{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2">
              <Link
                to={citizenHubDestination}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009B70] py-2.5 text-xs font-bold text-white shadow-xs"
              >
                <span>Open Citizen Hub Console</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>

              <div className="pt-2 flex items-center justify-between text-xs text-[#475467] px-1">
                <span className="flex items-center gap-1 text-[11px]">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#009B70]" aria-hidden="true" />
                  BMC Verified
                </span>
                <a
                  href="tel:155304"
                  className="font-bold text-[#006B4F] hover:underline"
                >
                  Helpline: 155304
                </a>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
