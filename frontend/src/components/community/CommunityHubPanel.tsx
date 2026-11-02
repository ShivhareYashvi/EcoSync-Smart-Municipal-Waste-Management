import React, { useEffect, useState } from 'react';
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
  initialTab?: 'leaderboard' | 'society' | 'referrals' | 'guide' | 'complaints';
  activeAction?: 'submit' | 'track' | 'feedback' | null;
  onActionChange?: (action: 'submit' | 'track' | 'feedback' | null) => void;
}

export const CommunityHubPanel: React.FC<CommunityHubPanelProps> = ({
  currentUser,
  initialTab = 'complaints',
  activeAction = null,
  onActionChange,
}) => {
  const [activeTab, setActiveTab] = useState<
    'leaderboard' | 'society' | 'referrals' | 'guide' | 'complaints'
  >(activeAction ? 'complaints' : initialTab);

  // Sync internal tab whenever activeAction (submit/track/feedback) changes
  useEffect(() => {
    if (activeAction) {
      setActiveTab('complaints');
    }
  }, [activeAction]);

  const tabs = [
    { id: 'complaints', label: 'Civic Grievances & SLA', icon: MessageSquareWarning },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    { id: 'society', label: 'RWA & Society', icon: Building2 },
    { id: 'referrals', label: 'Referrals & Rewards', icon: Gift },
    { id: 'guide', label: 'Segregation Guide', icon: BookOpen },
  ] as const;

  const handleTabClick = (tabId: 'leaderboard' | 'society' | 'referrals' | 'guide' | 'complaints') => {
    setActiveTab(tabId);
    if (tabId === 'complaints') {
      onActionChange?.('feedback');
    } else {
      onActionChange?.(null);
    }
  };

  return (
    <article className="glass-card rounded-[2rem] p-6 space-y-6">
      {/* Header with Icon */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider">
            <HeartHandshake className="w-4 h-4" />
            Citizen Community Hub
          </div>
          <h2 className="text-2xl font-black text-slate-950">Citizen Engagement &amp; Community</h2>
          <p className="text-slate-600 text-xs">
            Connect with your housing society, report civic issues, track 24-hour SLAs, and participate in community upvoting.
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
                onClick={() => handleTabClick(tab.id)}
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
        {activeTab === 'complaints' && (
          <ComplaintCommunityBoard
            currentUser={currentUser}
            activeAction={activeAction}
            onActionChange={onActionChange}
          />
        )}
        {activeTab === 'leaderboard' && <OptInLeaderboard currentUser={currentUser} />}
        {activeTab === 'society' && <SocietyDashboardView currentUser={currentUser} />}
        {activeTab === 'referrals' && <ReferralCenter />}
        {activeTab === 'guide' && <SegregationGuide userLocale={currentUser?.locale_preference} />}
      </div>
    </article>
  );
};
