import React, { useState } from 'react';
import {
  BookOpen,
  Building2,
  Gift,
  HeartHandshake,
  MessageSquareWarning,
  Trophy,
} from 'lucide-react';
import { User } from '../../lib/types';
import { SegregationGuide } from '../guide/SegregationGuide';
import { ComplaintCommunityBoard } from './ComplaintCommunityBoard';
import { OptInLeaderboard } from './OptInLeaderboard';
import { ReferralCenter } from './ReferralCenter';
import { SocietyDashboardView } from './SocietyDashboardView';

interface CommunityHubPanelProps {
  currentUser?: User | null;
}

export const CommunityHubPanel: React.FC<CommunityHubPanelProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<
    'leaderboard' | 'society' | 'referrals' | 'guide' | 'complaints'
  >('leaderboard');

  const tabs = [
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'society', label: 'RWA & Society', icon: Building2 },
    { id: 'referrals', label: 'Referrals & Rewards', icon: Gift },
    { id: 'complaints', label: 'Civic Issues & Upvoting', icon: MessageSquareWarning },
    { id: 'guide', label: 'Segregation Guide', icon: BookOpen },
  ] as const;

  return (
    <article className="glass-card rounded-[2rem] p-6 space-y-6">
      {/* Header with Icon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            Phase 4 Community Hub
          </div>
          <h2 className="text-2xl font-black text-slate-950">Citizen Engagement &amp; Community</h2>
          <p className="text-slate-600 text-xs">
            Connect with your housing society, opt into verified leaderboards, report issues, and invite neighbours.
          </p>
        </div>

        {/* Tab navigation pills */}
        <div className="flex flex-wrap gap-1.5 bg-gray-100/90 p-1.5 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-white text-emerald-800 shadow-sm font-bold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'leaderboard' && <OptInLeaderboard currentUser={currentUser} />}
        {activeTab === 'society' && <SocietyDashboardView currentUser={currentUser} />}
        {activeTab === 'referrals' && <ReferralCenter />}
        {activeTab === 'complaints' && <ComplaintCommunityBoard currentUser={currentUser} />}
        {activeTab === 'guide' && <SegregationGuide userLocale={currentUser?.locale_preference} />}
      </div>
    </article>
  );
};
