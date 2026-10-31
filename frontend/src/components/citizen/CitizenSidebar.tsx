import React, { useState } from 'react';
import {
  LayoutDashboard,
  Trash2,
  ChevronDown,
  Navigation,
  Sparkles,
  Trophy,
  Users,
  UserCheck,
  Settings,
  Sliders,
  HelpCircle,
  X,
  AlertTriangle,
  History,
  FileText,
  MessageSquare,
  ThumbsUp,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export interface CitizenSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string, subOption?: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenMissedPickupModal: () => void;
  onOpenHelpModal: () => void;
}

export const CitizenSidebar: React.FC<CitizenSidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenMissedPickupModal,
  onOpenHelpModal,
}) => {
  const [wasteMenuOpen, setWasteMenuOpen] = useState(true);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  const isSelected = (tab: string) => activeTab === tab;

  return (
    <>
      {/* Mobile Backdrop with keyboard dismiss */}
      {isOpenMobile && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onCloseMobile();
          }}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Vertical Sidebar Navigation */}
      <aside
        id="citizen-sidebar"
        aria-label="Citizen Hub Primary Navigation"
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/90 bg-white transition-all duration-200 ease-in-out lg:static lg:z-30 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isDesktopCollapsed ? 'lg:w-20' : 'lg:w-64'} w-72`}
      >
        {/* Mobile Header / Close Button */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Navigation Menu</span>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop Collapse Toggle Header */}
        <div className="hidden lg:flex items-center justify-between p-3 border-b border-slate-100">
          <span className={`text-[11px] font-bold uppercase tracking-wider text-slate-400 ${isDesktopCollapsed ? 'sr-only' : 'px-2'}`}>
            Portal Navigation
          </span>
          <button
            type="button"
            onClick={() => setIsDesktopCollapsed((prev) => !prev)}
            aria-label={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-emerald-600"
            title={isDesktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isDesktopCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6" aria-label="Main menu">
          {/* 1. Main Menu Category */}
          <div>
            <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${isDesktopCollapsed ? 'sr-only' : ''}`}>
              Main Menu
            </div>
            <ul className="space-y-1">
              {/* 1. Dashboard Console */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('console');
                    onCloseMobile();
                  }}
                  aria-current={isSelected('console') ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    isSelected('console')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Dashboard Console"
                >
                  <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Dashboard</span>}
                </button>
              </li>

              {/* 2. Waste Collection Submenu */}
              <li>
                <button
                  type="button"
                  onClick={() => setWasteMenuOpen((prev) => !prev)}
                  aria-expanded={wasteMenuOpen}
                  aria-controls="waste-collection-submenu"
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    activeTab === 'history' ? 'text-emerald-800 bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Trash2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    {!isDesktopCollapsed && <span>Waste Collection</span>}
                  </div>
                  {!isDesktopCollapsed && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${wasteMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {/* Submenu Items */}
                {wasteMenuOpen && !isDesktopCollapsed && (
                  <ul id="waste-collection-submenu" className="mt-1 pl-7 pr-1 space-y-1 border-l-2 border-emerald-100 ml-5">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('console', 'pickups');
                          onCloseMobile();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600 text-left"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>My Active Pickups</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('history');
                          onCloseMobile();
                        }}
                        aria-current={isSelected('history') ? 'page' : undefined}
                        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-emerald-600 text-left ${
                          isSelected('history') ? 'text-emerald-700 font-bold bg-emerald-50' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <History className="h-3.5 w-3.5" />
                        <span>Pickup History</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenMissedPickupModal();
                          onCloseMobile();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 text-left"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Report Missed Pickup</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>

              {/* 3. Live Vehicle Tracking */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('console', 'tracking');
                    onCloseMobile();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 transition"
                  title="Live Vehicle Tracking"
                >
                  <Navigation className="h-4 w-4 shrink-0 text-blue-600" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Live Vehicle Tracking</span>}
                </button>
              </li>

              {/* 4. Sell Scrap & Recyclables */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('marketplace');
                    onCloseMobile();
                  }}
                  aria-current={isSelected('marketplace') ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    isSelected('marketplace')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Sell Scrap & Recyclables"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Sell Scrap & Recyclables</span>}
                </button>
              </li>

              {/* 5. Rewards & Compliance */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('rewards');
                    onCloseMobile();
                  }}
                  aria-current={isSelected('rewards') ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    isSelected('rewards')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Rewards & Compliance"
                >
                  <Trophy className="h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Rewards & Compliance</span>}
                </button>
              </li>

              {/* 6. Community & Grievances Submenu */}
              <li>
                <button
                  type="button"
                  onClick={() => setCommunityMenuOpen((prev) => !prev)}
                  aria-expanded={communityMenuOpen}
                  aria-controls="community-grievance-submenu"
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    activeTab === 'community' ? 'text-emerald-800 bg-emerald-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                    {!isDesktopCollapsed && <span>Community & Grievances</span>}
                  </div>
                  {!isDesktopCollapsed && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 transition-transform ${communityMenuOpen ? 'rotate-180' : ''}`}
                      aria-hidden="true"
                    />
                  )}
                </button>

                {communityMenuOpen && !isDesktopCollapsed && (
                  <ul id="community-grievance-submenu" className="mt-1 pl-7 pr-1 space-y-1 border-l-2 border-emerald-100 ml-5">
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('community', 'submit');
                          onCloseMobile();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 text-left"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Submit Complaint</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('community', 'track');
                          onCloseMobile();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 text-left"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Track Complaints</span>
                      </button>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTab('community', 'feedback');
                          onCloseMobile();
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 text-left"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span>Community Feedback</span>
                      </button>
                    </li>
                  </ul>
                )}
              </li>
            </ul>
          </div>

          {/* 2. Account & Accessibility Category */}
          <div className="pt-2 border-t border-slate-100">
            <div className={`px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 ${isDesktopCollapsed ? 'sr-only' : ''}`}>
              Account & Accessibility
            </div>
            <ul className="space-y-1">
              {/* 7. Citizen Profile & ID */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('profile');
                    onCloseMobile();
                  }}
                  aria-current={isSelected('profile') ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    isSelected('profile')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Citizen Profile & ID"
                >
                  <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Citizen Profile & ID</span>}
                </button>
              </li>

              {/* 8. Settings */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('profile');
                    onCloseMobile();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 transition"
                  title="Settings"
                >
                  <Settings className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Settings</span>}
                </button>
              </li>

              {/* 9. Accessibility Settings */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('accessibility');
                    onCloseMobile();
                  }}
                  aria-current={isSelected('accessibility') ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                    isSelected('accessibility')
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100'
                  }`}
                  title="Accessibility Settings (WCAG 2.2 AA)"
                >
                  <Sliders className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Accessibility Settings</span>}
                </button>
              </li>

              {/* 10. Help & Support */}
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onOpenHelpModal();
                    onCloseMobile();
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 transition"
                  title="Help & Support"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
                  {!isDesktopCollapsed && <span>Help & Support</span>}
                </button>
              </li>
            </ul>
          </div>
        </nav>

        {/* Municipal Helpline Footer Note */}
        {!isDesktopCollapsed && (
          <div className="p-3 border-t border-slate-100 bg-slate-50/60 m-3 rounded-2xl">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              BMC Citizen Helpline
            </p>
            <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
              Dial 155304 / 1800-233-0014
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Mon–Sat: 07:00 AM – 07:00 PM
            </p>
          </div>
        )}
      </aside>
    </>
  );
};

