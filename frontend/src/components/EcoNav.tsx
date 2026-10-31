import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Recycle,
  Phone,
  Sliders,
  Menu,
  X,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { useSessionStore } from '../store/session';
import { dashboardPathForRole } from '../lib/navigation';
import { AccessibilityQuickModal } from './AccessibilityQuickModal';

export interface EcoNavItem {
  label: string;
  href: string;
  isExternal?: boolean;
}

export const ECO_NAV_ITEMS: EcoNavItem[] = [
  { label: 'Home', href: '/#home' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'Operations', href: '/#operations' },
  { label: 'Recycling', href: '/#recycling' },
  { label: 'Scrap', href: '/#scrap' },
  { label: 'About', href: '/#about' },
  { label: 'Insights', href: '/#insights' },
];

export const EcoNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSessionStore((s) => s.user);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [a11yModalOpen, setA11yModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);

  // Scrollspy to automatically highlight the current visible section
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);

      const sectionIds = ['home', 'solutions', 'operations', 'recycling', 'scrap', 'about', 'insights'];
      const scrollPosition = window.scrollY + 140;

      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sectionIds[i]);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync hash on navigation
  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.replace('#', '');
      setActiveSection(hash);
    }
  }, [location.hash]);

  // Handle smooth scroll navigation
  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);

    if (href.startsWith('/#')) {
      const targetId = href.replace('/#', '');
      if (location.pathname === '/') {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          setActiveSection(targetId);
          window.history.replaceState(null, '', `/#${targetId}`);
          return;
        }
      } else {
        navigate(`/#${targetId}`);
      }
    } else {
      navigate(href);
    }
  };

  const citizenHubDestination = user ? dashboardPathForRole(user.role) : '/login';

  return (
    <>
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header
        role="banner"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-[#E4E7EC] shadow-sm py-2.5'
            : 'bg-white/90 backdrop-blur-sm border-b border-[#E4E7EC]/80 py-3.5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand Identity */}
          <Link
            to="/"
            onClick={() => handleNavClick('/#home')}
            aria-label="EcoSync Bhopal Home"
            className="flex items-center gap-2.5 shrink-0 group focus-visible:ring-2 focus-visible:ring-[#009B70] rounded-xl pr-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#009B70] text-white shadow-sm transition group-hover:bg-[#006B4F]">
              <Recycle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1.5 leading-tight">
                <span className="text-lg font-black tracking-tight text-[#101828]">EcoSync</span>
                <span className="hidden sm:inline-block rounded-md bg-[#EAFBF4] px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#006B4F] border border-[#009B70]/20">
                  Bhopal
                </span>
              </div>
              <p className="text-[10px] font-medium text-[#475467] truncate leading-none mt-0.5">
                Smart Waste &amp; Circular Economy
              </p>
            </div>
          </Link>

          {/* Center: Primary Navigation (Exact 7 labels and order) */}
          <nav
            role="navigation"
            aria-label="Primary Navigation"
            className="hidden xl:flex items-center gap-1 text-xs font-bold text-[#475467]"
          >
            {ECO_NAV_ITEMS.map((item) => {
              const itemKey = item.href.replace('/#', '');
              const isActive = activeSection === itemKey;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => handleNavClick(item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative whitespace-nowrap px-3 py-1.5 rounded-lg transition text-xs font-bold focus-visible:ring-2 focus-visible:ring-[#009B70] ${
                    isActive
                      ? 'text-[#006B4F] bg-[#EAFBF4] font-black'
                      : 'text-[#475467] hover:text-[#101828] hover:bg-slate-50'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
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
            {/* Accessibility Quick Toggle Button */}
            <button
              type="button"
              onClick={() => setA11yModalOpen(true)}
              aria-label="Open Display and Accessibility Settings"
              title="WCAG 2.2 Accessibility Options (High Contrast, Large Text, Motion)"
              className="flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-white p-2 sm:px-2.5 sm:py-1.5 text-xs font-bold text-[#475467] hover:bg-slate-50 hover:text-[#101828] focus-visible:ring-2 focus-visible:ring-[#009B70] transition shadow-2xs"
            >
              <Sliders className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
              <span className="hidden md:inline">Accessibility</span>
            </button>

            {/* Municipal Helpline Pill (Optional access) */}
            <a
              href="tel:18002330014"
              aria-label="Bhopal Municipal Corporation 24/7 Helpline: 1800-233-0014"
              title="Bhopal Municipal Corporation 24/7 Central Control Room"
              className="hidden lg:flex items-center gap-1.5 rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] px-2.5 py-1.5 text-xs font-semibold text-[#475467] hover:text-[#006B4F] hover:border-[#009B70]/30 transition"
            >
              <Phone className="h-3.5 w-3.5 text-[#009B70]" aria-hidden="true" />
              <span className="text-[11px]">Helpline: <strong>1800-233-0014</strong></span>
            </a>

            {/* Citizen Hub Primary CTA */}
            <Link
              to={citizenHubDestination}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#009B70] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#006B4F] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#009B70]"
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
              className="xl:hidden flex items-center justify-center rounded-xl border border-[#E4E7EC] p-2 text-[#475467] hover:bg-slate-100 hover:text-[#101828] focus-visible:ring-2 focus-visible:ring-[#009B70] transition"
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
            className="xl:hidden border-t border-[#E4E7EC] bg-white px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2"
          >
            {/* Navigation Links in Exact Order */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#475467] px-3 mb-1">
                Bhopal Smart Platform
              </p>
              {ECO_NAV_ITEMS.map((item) => {
                const itemKey = item.href.replace('/#', '');
                const isActive = activeSection === itemKey;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleNavClick(item.href)}
                    className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-bold text-left transition ${
                      isActive
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

            {/* Mobile Actions Bar */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setA11yModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#E4E7EC] bg-[#F7F9FC] py-2.5 text-xs font-bold text-[#101828]"
              >
                <Sliders className="h-4 w-4 text-[#009B70]" aria-hidden="true" />
                <span>Accessibility &amp; High Contrast Settings</span>
              </button>

              <Link
                to={citizenHubDestination}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#009B70] py-2.5 text-xs font-bold text-white shadow-sm"
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
                  href="tel:18002330014"
                  className="font-bold text-[#006B4F] hover:underline"
                >
                  Helpline: 1800-233-0014
                </a>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Quick Accessibility Modal Accessible from EcoNav */}
      <AccessibilityQuickModal
        isOpen={a11yModalOpen}
        onClose={() => setA11yModalOpen(false)}
      />
    </>
  );
};

