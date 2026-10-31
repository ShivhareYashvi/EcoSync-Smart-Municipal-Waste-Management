import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  LogOut,
  Sliders,
  ChevronDown,
  UserCheck,
  Building2,
  Truck,
  Recycle,
  Sparkles,
} from 'lucide-react';
import { useSessionStore } from '../../store/session';
import NotificationInbox from '../NotificationInbox';
import type { User } from '../../lib/types';

interface CitizenHeaderProps {
  currentUser: User;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export const CitizenHeader: React.FC<CitizenHeaderProps> = ({
  currentUser,
  onToggleSidebar,
  sidebarOpen,
}) => {
  const navigate = useNavigate();
  const clearSession = useSessionStore((s) => s.clearSession);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  const getInitials = (name?: string | null) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md transition-colors"
    >
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Menu Toggle + Municipal Branding */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close navigation drawer' : 'Open navigation drawer'}
            aria-expanded={sidebarOpen}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <Link
            to="/dashboard/user"
            className="flex items-center gap-2.5 focus-visible:ring-2 focus-visible:ring-emerald-600 rounded-lg p-1"
            aria-label="EcoSync Bhopal Municipal Operations Network, Citizen Hub Dashboard"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Recycle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base">EcoSync</span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-800 border border-emerald-200 uppercase">
                  Citizen Hub
                </span>
              </div>
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline-block leading-none mt-0.5">
                Bhopal Municipal Operations Network
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Notification Inbox, Accessibility Shortcut, Profile Menu & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Accessibility Quick Settings Shortcut */}
          <Link
            to="/dashboard/user?tab=accessibility"
            aria-label="Open Accessibility & Display Settings"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 transition"
            title="Accessibility Settings (Alt+A)"
          >
            <Sliders className="h-4 w-4" aria-hidden="true" />
          </Link>

          {/* Accessible Notifications Hub */}
          <div className="relative">
            <NotificationInbox />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" aria-hidden="true" />

          {/* Profile & Role Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              aria-expanded={profileDropdownOpen}
              aria-haspopup="menu"
              aria-label={`Citizen menu for ${currentUser.name || 'Resident'}`}
              className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 transition border border-transparent hover:border-slate-200"
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold ring-2 ring-emerald-600/20"
                aria-hidden="true"
              >
                {getInitials(currentUser.name)}
              </div>
              <div className="hidden text-left md:block">
                <p className="text-xs font-bold text-slate-900 leading-none truncate max-w-[120px]">
                  {currentUser.name || 'Citizen'}
                </p>
                <p className="text-[10px] font-medium text-slate-500 mt-0.5">
                  Ward {currentUser.ward_number || '48'} Resident
                </p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" aria-hidden="true" />
            </button>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                role="menu"
                aria-orientation="vertical"
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10 focus:outline-none z-50 animate-in fade-in slide-in-from-top-1"
              >
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-900">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.phone}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                    <UserCheck className="h-3 w-3" />
                    <span>Verified BMC Resident</span>
                  </div>
                </div>

                <Link
                  to="/dashboard/user?tab=profile"
                  role="menuitem"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <UserCheck className="h-4 w-4 text-slate-500" />
                  <span>Citizen Profile & Address</span>
                </Link>

                <Link
                  to="/dashboard/user?tab=accessibility"
                  role="menuitem"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <Sliders className="h-4 w-4 text-slate-500" />
                  <span>Accessibility & Contrast</span>
                </Link>

                {/* Account Switcher Options */}
                <div className="border-t border-slate-100 my-1 pt-1">
                  <span className="block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Switch Workspace
                  </span>
                  <Link
                    to="/dashboard/driver"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Truck className="h-3.5 w-3.5 text-slate-400" />
                    <span>Driver PWA Portal</span>
                  </Link>
                  <Link
                    to="/dashboard/recycler"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-slate-400" />
                    <span>Certified Recycler Ledger</span>
                  </Link>
                  <Link
                    to="/dashboard/admin"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Municipal Admin Console</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout Button */}
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log out of EcoSync"
            className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500 transition"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
