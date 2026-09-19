import React, { useEffect, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Gift,
  RefreshCw,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import { ReferralSummary } from '../../lib/types';

export const ReferralCenter: React.FC = () => {
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await api.get<ReferralSummary>('/referrals/me');
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, []);

  const handleCopyCode = () => {
    if (!summary?.referral_code) return;
    navigator.clipboard.writeText(summary.referral_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyLink = () => {
    if (!summary?.referral_link) return;
    navigator.clipboard.writeText(summary.referral_link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
        <p className="text-xs font-medium">Loading referral rewards...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Hero Card */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Gift className="w-3.5 h-3.5" />
              Community Referral Program
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Invite Neighbours, Earn 100 Points Each
            </h2>
            <p className="text-emerald-100 text-xs leading-relaxed">
              Help your residential society achieve 100% waste segregation.
              Receive <strong>100 bonus compliance points</strong> when your referred resident completes their very first verified pickup!
            </p>
          </div>

          {/* Referral Code Box */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center space-y-2 shrink-0 w-full sm:w-auto">
            <div className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold">
              Your Unique Code
            </div>
            <div className="text-2xl font-black tracking-wider text-white font-mono bg-black/20 px-4 py-1.5 rounded-xl border border-white/10">
              {summary?.referral_code || 'REF-0000'}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-white text-emerald-900 font-semibold text-xs flex items-center gap-1 hover:bg-emerald-50 transition-colors"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 rounded-lg bg-white/20 text-white font-semibold text-xs flex items-center gap-1 hover:bg-white/30 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                {copiedLink ? 'Link Copied' : 'Copy Link'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total Invites
          </div>
          <div className="text-2xl font-black text-gray-900">
            {summary?.total_referrals || 0}
          </div>
          <p className="text-[11px] text-gray-400">Registered neighbours</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Points Awarded
          </div>
          <div className="text-2xl font-black text-emerald-600">
            +{summary?.total_points_earned || 0} pts
          </div>
          <p className="text-[11px] text-gray-400">Credited to your balance</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Completed Pickups
          </div>
          <div className="text-2xl font-black text-blue-600">
            {summary?.completed_referrals || 0}
          </div>
          <p className="text-[11px] text-gray-400">First verified pickup done</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Pending 1st Pickup
          </div>
          <div className="text-2xl font-black text-amber-600">
            {summary?.pending_referrals || 0}
          </div>
          <p className="text-[11px] text-gray-400">Awaiting initial collection</p>
        </div>
      </div>

      {/* Anti-Gaming Policy Card */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-emerald-700 shrink-0" />
        <div>
          <p className="font-semibold text-emerald-900">Verified Pickup Anti-Gaming Guarantee:</p>
          <p className="text-[11px] text-emerald-800 mt-0.5">
            To prevent fake account creation and promote real environmental impact, referral points are released strictly after the invited resident completes their first segregated, driver-verified waste pickup.
          </p>
        </div>
      </div>

      {/* Referrals List Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-600" />
            Your Referral History
          </h3>
          <span className="text-xs text-gray-400">
            {summary?.referrals.length || 0} residents referred
          </span>
        </div>

        {!summary?.referrals || summary.referrals.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Gift className="w-10 h-10 mx-auto text-gray-300" />
            <p className="text-sm font-medium text-gray-700">No referrals yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              Share your referral link with your housing society WhatsApp group to start earning bonus points!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Invited Resident</th>
                  <th className="py-3 px-4 text-center">Registration Date</th>
                  <th className="py-3 px-4 text-center">First Pickup Status</th>
                  <th className="py-3 px-4 text-center">Bonus Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {summary.referrals.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">
                        {item.referred_user_name || `Resident #${String(item.referred_user_id).padStart(4, '0')}`}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 font-mono">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" />
                          Verified Pickup Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pending 1st Pickup
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {item.points_awarded ? (
                        <span className="text-emerald-600">+100 pts</span>
                      ) : (
                        <span className="text-gray-400">0 pts</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
