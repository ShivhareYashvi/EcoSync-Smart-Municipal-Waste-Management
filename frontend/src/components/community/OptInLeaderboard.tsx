import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Check,
  Eye,
  EyeOff,
  Globe,
  RefreshCw,
  Settings2,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import type {
  IndividualLeaderboardEntry,
  LeaderboardSettings,
  SocietyLeaderboardEntry,
  User,
} from '../../lib/types';

interface OptInLeaderboardProps {
  currentUser?: User | null;
}

export const OptInLeaderboard: React.FC<OptInLeaderboardProps> = ({ currentUser }) => {
  const [tab, setTab] = useState<'individual' | 'societies'>('individual');
  const [scope, setScope] = useState<'city' | 'zone'>('city');
  const [settings, setSettings] = useState<LeaderboardSettings | null>(null);
  const [handleInput, setHandleInput] = useState<string>('');
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [individualEntries, setIndividualEntries] = useState<IndividualLeaderboardEntry[]>([]);
  const [societyEntries, setSocietyEntries] = useState<SocietyLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Load user opt-in preferences
  const fetchSettings = async () => {
    try {
      const res = await api.get<LeaderboardSettings>('/users/me/leaderboard-settings');
      setSettings(res.data);
      setHandleInput(res.data.display_handle || '');
    } catch (err) {
      console.error('Failed to load leaderboard settings:', err);
    }
  };

  // Load leaderboard data
  const fetchLeaderboards = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'individual') {
        const params: Record<string, string | number> = { scope };
        if (scope === 'zone' && currentUser?.zone_id) {
          params.zone_id = currentUser.zone_id;
        }
        const res = await api.get<IndividualLeaderboardEntry[]>('/leaderboards/individual', { params });
        setIndividualEntries(res.data);
      } else {
        const params: Record<string, string | number> = {};
        if (scope === 'zone' && currentUser?.zone_id) {
          params.zone_id = currentUser.zone_id;
        }
        const res = await api.get<SocietyLeaderboardEntry[]>('/leaderboards/societies', { params });
        setSocietyEntries(res.data);
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [tab, scope, currentUser?.zone_id]);

  useEffect(() => {
    void fetchSettings();
  }, []);

  useEffect(() => {
    void fetchLeaderboards();
  }, [fetchLeaderboards]);

  const handleToggleOptIn = async (newOptedIn: boolean) => {
    setIsSavingSettings(true);
    try {
      const res = await api.patch<LeaderboardSettings>('/users/me/leaderboard-settings', {
        opted_in: newOptedIn,
        display_handle: handleInput.trim() || null,
      });
      setSettings(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      fetchLeaderboards();
    } catch (err) {
      console.error('Failed to update leaderboard settings:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSaveHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSavingSettings(true);
    try {
      const res = await api.patch<LeaderboardSettings>('/users/me/leaderboard-settings', {
        opted_in: settings.opted_in,
        display_handle: handleInput.trim() || null,
      });
      setSettings(res.data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setShowSettingsModal(false);
      fetchLeaderboards();
    } catch (err) {
      console.error('Failed to update display handle:', err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Control Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-gray-900">Privacy &amp; Opt-in Status</h3>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  settings?.opted_in
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {settings?.opted_in ? 'Publicly Visible' : 'Hidden (Opted Out)'}
              </span>
            </div>
            <p className="text-xs text-gray-500 max-w-xl">
              Leaderboards are 100% opt-in. You never appear to other citizens unless you explicitly activate this toggle.
              You can also customize your public display pseudonym.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Settings2 className="w-4 h-4 text-gray-500" />
              Custom Handle
            </button>
            <button
              onClick={() => handleToggleOptIn(!settings?.opted_in)}
              disabled={isSavingSettings}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                settings?.opted_in
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
              }`}
            >
              {settings?.opted_in ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Opt Out (Hide Me)
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Opt In (Show on Board)
                </>
              )}
            </button>
          </div>
        </div>

        {/* Edit Handle Form Modal/Drop */}
        {showSettingsModal && (
          <form onSubmit={handleSaveHandle} className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-medium text-gray-700">Display Handle (Pseudonym)</label>
              <input
                type="text"
                maxLength={50}
                placeholder={`e.g. EcoChamp_${currentUser?.id || 101}`}
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[11px] text-gray-400">
                Leave blank to automatically display as &ldquo;Resident #{String(currentUser?.id || 1).padStart(4, '0')}&rdquo;.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="px-4 py-2 text-xs bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800"
              >
                Save Handle
              </button>
            </div>
          </form>
        )}

        {saveSuccess && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <Check className="w-3.5 h-3.5" /> Preferences updated successfully.
          </div>
        )}
      </div>

      {/* Tabs & Scope Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-3">
        {/* Main Tab: Individuals vs Societies */}
        <div className="flex gap-2">
          <button
            onClick={() => setTab('individual')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              tab === 'individual'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Opted-In Citizens
          </button>
          <button
            onClick={() => setTab('societies')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              tab === 'societies'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Housing Societies
          </button>
        </div>

        {/* Scope Pill Filter */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setScope('city')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              scope === 'city'
                ? 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Globe className="w-3 h-3" />
            City-Wide
          </button>
          <button
            onClick={() => setScope('zone')}
            className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
              scope === 'zone'
                ? 'bg-white text-gray-900 shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Users className="w-3 h-3" />
            My Zone
          </button>
        </div>
      </div>

      {/* Leaderboard Table / Rankings */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
          <p className="text-xs font-medium">Loading verified rankings...</p>
        </div>
      ) : tab === 'individual' ? (
        /* Individual Table */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {individualEntries.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Trophy className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-medium text-gray-700">No opted-in participants yet</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Be the first in your community to opt in and inspire your neighbours to segregate waste!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                    <th className="py-3.5 px-4">Citizen Handle</th>
                    <th className="py-3.5 px-4 text-center">Points</th>
                    <th className="py-3.5 px-4 text-center">Compliance</th>
                    <th className="py-3.5 px-4 text-center">Pickups</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {individualEntries.map((entry) => {
                    const isMe = entry.user_id === currentUser?.id;
                    return (
                      <tr
                        key={entry.user_id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isMe ? 'bg-emerald-50/50 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          {entry.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 font-bold">
                              🥇
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-bold">
                              🥈
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-800 font-bold">
                              🥉
                            </span>
                          ) : (
                            <span className="text-gray-500 font-mono text-xs">#{entry.rank}</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 font-medium">
                              {entry.display_handle}
                            </span>
                            {isMe && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">
                          {entry.points} pts
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              entry.compliance_score >= 80
                                ? 'bg-emerald-100 text-emerald-800'
                                : entry.compliance_score >= 50
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {entry.compliance_score}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center text-gray-500 font-mono">
                          {entry.verified_pickups}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Societies Table */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {societyEntries.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-medium text-gray-700">No eligible societies yet</p>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Housing societies need at least 3 active resident households to appear on the public community leaderboard.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-16 text-center">Rank</th>
                    <th className="py-3.5 px-4">Housing Society</th>
                    <th className="py-3.5 px-4 text-center">Active Households</th>
                    <th className="py-3.5 px-4 text-center">Avg Compliance</th>
                    <th className="py-3.5 px-4 text-center">Verified Pickups</th>
                    <th className="py-3.5 px-4 text-center">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {societyEntries.map((soc) => (
                    <tr key={soc.society_id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 text-center font-bold">
                        {soc.rank === 1 ? '🥇' : soc.rank === 2 ? '🥈' : soc.rank === 3 ? '🥉' : `#${soc.rank}`}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">{soc.society_name}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-mono">
                        {soc.active_members}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {soc.average_compliance}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600 font-mono">
                        {soc.total_verified_pickups}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-600">
                        {soc.total_points} pts
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
