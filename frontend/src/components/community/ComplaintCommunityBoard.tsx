import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  Filter,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  ThumbsUp,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { Complaint, User } from '../../lib/types';

interface ComplaintCommunityBoardProps {
  currentUser?: User | null;
}

export const ComplaintCommunityBoard: React.FC<ComplaintCommunityBoardProps> = ({ currentUser }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [sortBy, setSortBy] = useState<'upvotes' | 'created_at'>('upvotes');
  const [filterMine, setFilterMine] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [upvotingId, setUpvotingId] = useState<number | null>(null);

  // New complaint form
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [category, setCategory] = useState<string>('missed_pickup');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        sort_by: sortBy,
      };
      if (filterMine && currentUser?.id) {
        params.user_id = currentUser.id;
      }
      const res = await api.get<Complaint[]>('/complaints', { params });
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [sortBy, filterMine, currentUser?.id]);

  useEffect(() => {
    void fetchComplaints();
  }, [fetchComplaints]);

  const handleToggleUpvote = async (complaintId: number) => {
    setUpvotingId(complaintId);
    try {
      const res = await api.post<{ upvoted: boolean; upvote_count: number }>(
        `/complaints/${complaintId}/upvote`
      );
      // Optimistically update complaint in state
      setComplaints((prev) =>
        prev.map((c) => {
          if (c.id === complaintId) {
            return {
              ...c,
              user_has_upvoted: res.data.upvoted,
              upvote_count: res.data.upvote_count,
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to upvote complaint:', err);
    } finally {
      setUpvotingId(null);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !description.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/complaints', {
        user_id: currentUser.id,
        category,
        description: description.trim(),
        image: imageUrl.trim() || null,
      });
      setShowCreateModal(false);
      setDescription('');
      setImageUrl('');
      setActionMsg('Complaint submitted successfully!');
      setTimeout(() => setActionMsg(null), 4000);
      fetchComplaints();
    } catch (err) {
      console.error('Failed to submit complaint:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquareWarning className="w-5 h-5 text-rose-600" />
            Civic Complaints &amp; Community Upvoting
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Upvote existing open issues in your area instead of filing duplicate complaints to help the municipality prioritize.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-gray-500 ml-1.5" />
            <button
              onClick={() => setSortBy('upvotes')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sortBy === 'upvotes'
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Most Upvoted
            </button>
            <button
              onClick={() => setSortBy('created_at')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sortBy === 'created_at'
                  ? 'bg-white text-gray-900 shadow-sm font-semibold'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Latest
            </button>
          </div>

          {/* Filter Mine Switch */}
          <button
            onClick={() => setFilterMine(!filterMine)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
              filterMine
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {filterMine ? 'My Complaints' : 'All Issues'}
          </button>

          {/* File Complaint Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-semibold hover:bg-rose-700 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Report Issue
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionMsg}
        </div>
      )}

      {/* Complaints Grid */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-rose-600" />
          <p className="text-xs font-medium">Loading civic issues...</p>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-2">
          <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="text-sm font-semibold text-gray-800">No active civic complaints</p>
          <p className="text-xs text-gray-400">Your community waste collection is currently running smoothly!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complaints.map((c) => {
            const hasUpvoted = c.user_has_upvoted;
            return (
              <div
                key={c.id}
                className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3 hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-800 uppercase tracking-wider">
                        {c.category.replace('_', ' ')}
                      </span>
                      {c.zone_id && (
                        <span className="text-xs font-medium text-gray-400">
                          Zone #{c.zone_id}
                        </span>
                      )}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : c.status === 'in_review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-800 leading-relaxed font-medium">
                    {c.description}
                  </p>

                  {c.image && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 max-h-36 bg-gray-50">
                      <img
                        src={c.image}
                        alt="Complaint evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                {/* Bottom Row: Timestamp and Upvote Button */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(c.created_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => handleToggleUpvote(c.id)}
                    disabled={upvotingId === c.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      hasUpvoted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${
                        hasUpvoted ? 'fill-white text-white' : 'text-gray-500'
                      }`}
                    />
                    <span>{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                        hasUpvoted ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {c.upvote_count || 0}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Report Issue */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Report Civic Waste Issue</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-gray-700">Issue Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="missed_pickup">Missed Scheduled Pickup</option>
                  <option value="overflowing_bin">Overflowing Community Bin</option>
                  <option value="illegal_dumping">Illegal Waste Dumping</option>
                  <option value="unsegregated_waste">Driver Unsegregated Collection</option>
                  <option value="driver_behavior">Driver Conduct / Behavior</option>
                  <option value="other">Other Civic Issue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-700">Description *</label>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  maxLength={2000}
                  placeholder="Describe location, timing, and nature of the issue..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-700">Photo Proof URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. https://... or /uploads/overflow.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-rose-600 text-white font-semibold rounded-xl hover:bg-rose-700 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
