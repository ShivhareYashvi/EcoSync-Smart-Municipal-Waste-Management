import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  Filter,
  Image as ImageIcon,
  MapPin,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsUp,
  Trash2,
  Truck,
  Upload,
  User as UserIcon,
  X,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { formatWard, cleanComplaintText } from '../../lib/formatters';
import type { Complaint, User } from '../../lib/types';

interface ComplaintCommunityBoardProps {
  currentUser?: User | null;
  activeAction?: 'submit' | 'track' | 'feedback' | null;
  onActionChange?: (action: 'submit' | 'track' | 'feedback' | null) => void;
}

// Category design system
const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; bg: string; border: string }
> = {
  missed_pickup: {
    label: 'Missed Pickup',
    icon: Truck,
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  illegal_dumping: {
    label: 'Illegal Dumping',
    icon: Trash2,
    color: 'text-rose-800',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  damaged_bin: {
    label: 'Damaged Bin',
    icon: AlertTriangle,
    color: 'text-purple-800',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
  },
  driver_behavior: {
    label: 'Driver Conduct',
    icon: UserIcon,
    color: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  },
  other: {
    label: 'Civic Grievance',
    icon: MessageSquareWarning,
    color: 'text-slate-800',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
  },
};

// Status design system
const STATUS_META: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bg: string;
    border: string;
    step: number;
    description: string;
  }
> = {
  open: {
    label: 'Queued for Dispatch',
    icon: AlertCircle,
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    step: 1,
    description: 'Ticket received by Ward Control. Awaiting collection dispatch.',
  },
  in_review: {
    label: 'En Route / In Review',
    icon: Clock,
    color: 'text-sky-800',
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    step: 2,
    description: 'Sanitation vehicle or inspector dispatched to location.',
  },
  resolved: {
    label: 'Resolved & Cleared',
    icon: CheckCircle2,
    color: 'text-emerald-800',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    step: 3,
    description: 'Waste cleared and doorstep verification complete.',
  },
  rejected: {
    label: 'Closed / Verified',
    icon: XCircle,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    step: 0,
    description: 'Reviewed by Ward Inspector: verified completed sweep via GPS log or merged duplicate.',
  },
};

// Clean duplicate "Ward Ward" and text
function _cleanDescription(desc: string): string {
  if (!desc) return '';
  return desc
    .replace(/\[Ward\s+Ward\s+/gi, '[Ward ')
    .replace(/Ward\s+Ward\s+/gi, 'Ward ')
    .trim();
}

// Calculate 24-hour SLA remaining / status
function computeSla(complaint: Complaint) {
  const createdAtMs = new Date(complaint.created_at).getTime();
  const slaDeadlineMs = createdAtMs + 24 * 3600 * 1000;
  const nowMs = Date.now();
  const isResolved = complaint.status === 'resolved';

  if (isResolved) {
    let resolvedTimeMs = nowMs;
    if (complaint.resolved_at) {
      resolvedTimeMs = new Date(complaint.resolved_at).getTime();
    }
    const elapsedHours = Math.max(0.1, (resolvedTimeMs - createdAtMs) / (3600 * 1000));
    return {
      isResolved: true,
      isOverdue: false,
      isCritical: false,
      badge: 'SLA Met',
      label: `Resolved in ${elapsedHours.toFixed(1)} hrs`,
      color: 'text-emerald-700',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
    };
  }

  const remainingMs = slaDeadlineMs - nowMs;
  const remainingHours = remainingMs / (3600 * 1000);

  if (remainingHours <= 0) {
    const overdueHrs = Math.abs(remainingHours).toFixed(1);
    return {
      isResolved: false,
      isOverdue: true,
      isCritical: true,
      badge: `Breached (+${overdueHrs}h)`,
      label: `Exceeded 24h SLA by ${overdueHrs}h`,
      color: 'text-rose-700',
      bg: 'bg-rose-50',
      border: 'border-rose-300',
    };
  }

  const isCritical = remainingHours <= 6;
  const remH = Math.floor(remainingHours);
  const remM = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));

  return {
    isResolved: false,
    isOverdue: false,
    isCritical,
    badge: `${remH}h ${remM}m left`,
    label: `${remH}h ${remM}m remaining within 24h guarantee`,
    color: isCritical ? 'text-amber-800' : 'text-emerald-800',
    bg: isCritical ? 'bg-amber-50' : 'bg-emerald-50',
    border: isCritical ? 'border-amber-300' : 'border-emerald-200',
  };
}

export const ComplaintCommunityBoard: React.FC<ComplaintCommunityBoardProps> = ({
  currentUser,
  activeAction = null,
  onActionChange,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [sortBy, setSortBy] = useState<'upvotes' | 'created_at'>('upvotes');
  const [filterMine, setFilterMine] = useState<boolean>(activeAction === 'track');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [upvotingId, setUpvotingId] = useState<number | null>(null);

  // Lightbox state for zooming complaint photo proof
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // New complaint form state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(activeAction === 'submit');
  const [category, setCategory] = useState<string>('missed_pickup');
  const [description, setDescription] = useState<string>('');
  const [gateAddress, setGateAddress] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync mode based on external activeAction (sidebar clicks or URL navigation)
  useEffect(() => {
    if (activeAction === 'submit') {
      setShowCreateModal(true);
      setFilterMine(false);
    } else if (activeAction === 'track') {
      setFilterMine(true);
      setShowCreateModal(false);
      setSelectedStatus('all');
    } else if (activeAction === 'feedback') {
      setFilterMine(false);
      setSortBy('upvotes');
      setShowCreateModal(false);
    }
  }, [activeAction]);

  // Populate address default from user profile when modal opens
  useEffect(() => {
    if (showCreateModal && currentUser) {
      if (currentUser.address) setGateAddress(currentUser.address);
    }
  }, [showCreateModal, currentUser]);

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

  // Metric summaries for the top banner
  const metrics = useMemo(() => {
    const total = complaints.length;
    const openCount = complaints.filter((c) => c.status === 'open' || c.status === 'in_review').length;
    const resolvedCount = complaints.filter((c) => c.status === 'resolved').length;
    const missedPickups = complaints.filter((c) => c.category === 'missed_pickup');
    const onTimeMissed = missedPickups.filter((c) => {
      const sla = computeSla(c);
      return !sla.isOverdue;
    }).length;
    const slaRate = missedPickups.length > 0 ? Math.round((onTimeMissed / missedPickups.length) * 100) : 100;
    const myCount = complaints.filter((c) => currentUser?.id && c.user_id === currentUser.id).length;

    return { total, openCount, resolvedCount, missedCount: missedPickups.length, slaRate, myCount };
  }, [complaints, currentUser?.id]);

  // Filtered complaints based on category, status, and search query
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Category filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (selectedStatus === 'active') {
        if (c.status !== 'open' && c.status !== 'in_review') return false;
      } else if (selectedStatus !== 'all' && c.status !== selectedStatus) {
        return false;
      }
      // Search query (matches description, ID, category, or ward)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = `cmp-${String(c.id).padStart(3, '0')}`.toLowerCase();
        const desc = (c.description || '').toLowerCase();
        const cat = (c.category || '').toLowerCase();
        const ward = (c.ward_number || '').toLowerCase();
        const addr = (c.user_address || '').toLowerCase();
        if (
          !code.includes(q) &&
          !desc.includes(q) &&
          !cat.includes(q) &&
          !ward.includes(q) &&
          !addr.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [complaints, selectedCategory, selectedStatus, searchQuery]);

  const handleToggleUpvote = async (complaintId: number) => {
    setUpvotingId(complaintId);
    try {
      const res = await api.post<{ upvoted: boolean; upvote_count: number }>(
        `/complaints/${complaintId}/upvote`
      );
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !description.trim()) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    let finalImageUrl = imageUrl.trim();

    // Upload photo file if user selected one
    if (photoFile) {
      setIsUploadingPhoto(true);
      try {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await api.post<{ photo_url: string }>('/uploads/pickup-photos', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = uploadRes.data.photo_url;
      } catch (err) {
        console.warn('Failed to upload photo file, continuing without photo:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }

    // Compose final description with gate address
    let fullDescription = description.trim();
    if (gateAddress.trim() && !fullDescription.toLowerCase().includes(gateAddress.trim().toLowerCase())) {
      fullDescription = `${fullDescription} (Location: ${gateAddress.trim()})`;
    }

    try {
      await api.post('/complaints', {
        user_id: currentUser.id,
        category,
        description: fullDescription,
        image: finalImageUrl || null,
      });

      setShowCreateModal(false);
      setDescription('');
      setGateAddress('');
      setImageUrl('');
      setPhotoFile(null);
      setPhotoPreview(null);
      setActionMsg('Civic grievance registered successfully! Dispatched to Ward Operations.');
      setTimeout(() => setActionMsg(null), 5000);
      onActionChange?.('track');
      setFilterMine(true);
      void fetchComplaints();
    } catch (err) {
      console.error('Failed to submit complaint:', err);
      setErrorMsg('Failed to submit grievance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Civic Redressal Header & Primary Action */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600">
            <MessageSquareWarning className="w-4 h-4" />
            <span>Swachh Bharat Mission · Civic Grievance &amp; Upvoting Desk</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            Community Grievances &amp; Priority Upvoting
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Submit new civic issues, track real-time resolution under the 24-hour SLA charter, and upvote neighborhood priorities.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => void fetchComplaints()}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition shadow-xs"
            title="Refresh tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              onActionChange?.('submit');
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Complaint</span>
          </button>
        </div>
      </div>

      {/* ── Tri-Option Action Selector Bar (Submit | Track | Feedback) ────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => {
            onActionChange?.('submit');
            setShowCreateModal(true);
          }}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeAction === 'submit' || showCreateModal
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white hover:bg-rose-50 hover:text-rose-700 text-slate-700 shadow-2xs'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Submit Complaint</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onActionChange?.('track');
            setFilterMine(true);
            setShowCreateModal(false);
          }}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            activeAction === 'track' || filterMine
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-blue-50 hover:text-blue-700 text-slate-700 shadow-2xs'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Track Complaints</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeAction === 'track' || filterMine ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-800'
            }`}
          >
            {metrics.myCount > 0 ? `${metrics.myCount} filed` : 'My Tickets'}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onActionChange?.('feedback');
            setFilterMine(false);
            setSortBy('upvotes');
            setShowCreateModal(false);
          }}
          className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
            (activeAction === 'feedback' || (!activeAction && !filterMine)) && !showCreateModal
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 shadow-2xs'
          }`}
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Community Feedback</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              (activeAction === 'feedback' || (!activeAction && !filterMine)) && !showCreateModal
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-800'
            }`}
          >
            {complaints.length}
          </span>
        </button>
      </div>

      {/* High-Visibility Ward Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Ward Tickets</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{metrics.total}</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Across all categories</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
            <MessageSquareWarning className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/90 bg-amber-50/50 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Open &amp; In-Queue</p>
            <h3 className="text-2xl font-black text-amber-900 mt-1">{metrics.openCount}</h3>
            <p className="text-[10px] text-amber-600 mt-0.5">Awaiting resolution</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/90 bg-emerald-50/50 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">24h SLA Compliance</p>
            <h3 className="text-2xl font-black text-emerald-900 mt-1">{metrics.slaRate}%</h3>
            <p className="text-[10px] text-emerald-600 mt-0.5">Resolved within 24 hours</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl border border-teal-200/90 bg-teal-50/50 p-4 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">Resolved &amp; Cleared</p>
            <h3 className="text-2xl font-black text-teal-900 mt-1">{metrics.resolvedCount}</h3>
            <p className="text-[10px] text-teal-600 mt-0.5">Doorstep verified</p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-teal-700">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Success Feedback Alert */}
      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs flex items-center justify-between font-medium shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMsg(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Multi-Faceted Filters Bar */}
      <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3 sm:p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by ticket ID (e.g. CMP-081), colony, ward, or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl text-xs font-semibold shrink-0 shadow-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              type="button"
              onClick={() => setSortBy('upvotes')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sortBy === 'upvotes'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 Most Upvoted
            </button>
            <button
              type="button"
              onClick={() => setSortBy('created_at')}
              className={`px-3 py-1 rounded-lg transition-all ${
                sortBy === 'created_at'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🕒 Latest
            </button>
          </div>

          {/* Filter Mine Switch */}
          <button
            type="button"
            onClick={() => {
              const next = !filterMine;
              setFilterMine(next);
              onActionChange?.(next ? 'track' : 'feedback');
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 shadow-xs ${
              filterMine
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filterMine ? 'Showing My Reports' : 'All Ward Reports'}</span>
          </button>
        </div>

        {/* Secondary Filter Chips: Status & Category */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 text-xs">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Category:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'missed_pickup', label: '🚛 Missed Pickup' },
              { id: 'illegal_dumping', label: '🚯 Illegal Dumping' },
              { id: 'damaged_bin', label: '🗑️ Damaged Bin' },
              { id: 'driver_behavior', label: '👤 Driver Conduct' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Status:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: '⚡ Active / Queued' },
              { id: 'resolved', label: '✅ Resolved' },
              { id: 'rejected', label: 'Closed' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedStatus === st.id
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Complaints Grid */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-14 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-emerald-600" />
          <p className="text-sm font-bold text-slate-700">Loading civic grievances...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to BMC Ward Operations</p>
        </div>
      ) : filterMine && filteredComplaints.length === 0 ? (
        /* Helpful Track Complaints Empty State */
        <div className="bg-white border-2 border-dashed border-blue-200 rounded-3xl p-10 sm:p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">No Complaints Submitted Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              You haven&apos;t filed any civic grievances yet. When you report a missed pickup, illegal dumping, or overflowing bin, you can track its 24-hour SLA countdown, driver progress, and doorstep resolution here.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onActionChange?.('submit');
              setShowCreateModal(true);
            }}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Your First Complaint</span>
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-black text-slate-900">No matching grievances found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || filterMine
              ? 'Try resetting your search query or filters to view all community reports.'
              : 'Ward waste collection and sanitation services are operating normally with zero open tickets!'}
          </p>
          {(searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all' || filterMine) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedStatus('all');
                setFilterMine(false);
                onActionChange?.('feedback');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredComplaints.map((c) => {
            const hasUpvoted = c.user_has_upvoted;
            const isMyComplaint = currentUser?.id && c.user_id === currentUser.id;
            const catMeta = CATEGORY_META[c.category] || CATEGORY_META.other;
            const statusMeta = STATUS_META[c.status] || STATUS_META.open;
            const sla = computeSla(c);
            const CatIcon = catMeta.icon;
            const StatusIcon = statusMeta.icon;
            const cleanedDesc = cleanComplaintText(c.description);
            const wardDisplay = formatWard(c.ward_number);

            return (
              <article
                key={c.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  isMyComplaint ? 'border-emerald-300 ring-1 ring-emerald-200/60' : 'border-slate-200/90'
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Ticket ID, Category, Ward, and Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                        CMP-{String(c.id).padStart(3, '0')}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catMeta.bg} ${catMeta.color} ${catMeta.border}`}
                      >
                        <CatIcon className="w-3 h-3" />
                        <span>{catMeta.label}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-md">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{wardDisplay}</span>
                      </span>
                      {isMyComplaint && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                          <Sparkles className="w-2.5 h-2.5" /> My Ticket
                        </span>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border ${statusMeta.bg} ${statusMeta.color} ${statusMeta.border}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>

                  {/* 24-Hour Municipal SLA Meter for Missed Pickups */}
                  {c.category === 'missed_pickup' && (
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${sla.bg} ${sla.border}`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className={`w-4 h-4 ${sla.color} shrink-0`} />
                        <div>
                          <p className={`text-[11px] font-black ${sla.color}`}>24-Hour Municipal SLA Guarantee</p>
                          <p className="text-[10px] text-slate-600">{sla.label}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white/90 shadow-2xs border ${sla.color}`}
                      >
                        {sla.badge}
                      </span>
                    </div>
                  )}

                  {/* 3-Stage Progress Timeline */}
                  {c.status !== 'rejected' ? (
                    <div className="py-2 px-3 bg-slate-50/80 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">
                          1
                        </span>
                        <span>Reported</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 mx-2 transition-all ${
                          statusMeta.step >= 2 ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`flex items-center gap-1.5 font-bold ${
                          statusMeta.step >= 2 ? 'text-slate-800' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            statusMeta.step >= 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          2
                        </span>
                        <span>Dispatched</span>
                      </div>
                      <div
                        className={`h-0.5 flex-1 mx-2 transition-all ${
                          statusMeta.step >= 3 ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      />
                      <div
                        className={`flex items-center gap-1.5 font-bold ${
                          statusMeta.step >= 3 ? 'text-emerald-700' : 'text-slate-400'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            statusMeta.step >= 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          3
                        </span>
                        <span>Resolved</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] leading-relaxed">
                        <strong>Ticket Closed:</strong> Municipal inspector verified that scheduled collection vehicle completed regular sweep via GPS route log, or this location was resolved under a duplicate ticket.
                      </p>
                    </div>
                  )}

                  {/* Description Text */}
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                    {cleanedDesc}
                  </p>

                  {/* Photo Evidence Thumbnail with Zoom Lightbox Trigger */}
                  {c.image && (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 max-h-40 bg-slate-100">
                      <img
                        src={c.image}
                        alt="Civic evidence"
                        className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-200 cursor-pointer"
                        onClick={() => setLightboxImage(c.image || null)}
                      />
                      <button
                        type="button"
                        onClick={() => setLightboxImage(c.image || null)}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Inspect Photo Evidence</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Bar: Date and Upvote Button */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isMyComplaint ? 'Reported by You' : c.user_name ? `By ${c.user_name}` : 'By Ward Resident'}
                    </span>
                  </div>

                  {/* Priority Upvote Action */}
                  <button
                    type="button"
                    onClick={() => handleToggleUpvote(c.id)}
                    disabled={upvotingId === c.id}
                    title="Upvote if you are facing this same issue in your colony"
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 shadow-xs ${
                      hasUpvoted
                        ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                        : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <ThumbsUp
                      className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-white text-white' : 'text-slate-500'}`}
                    />
                    <span>{hasUpvoted ? 'Upvoted' : 'Upvote'}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                        hasUpvoted ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {c.upvote_count || 0}
                    </span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal for Photo Evidence */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl max-w-2xl w-full p-4 space-y-3 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between text-white border-b border-slate-800 pb-2">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                Verified Grievance Photo Evidence
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden max-h-[70vh] flex items-center justify-center bg-black">
              <img
                src={lightboxImage}
                alt="Enlarged grievance proof"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
            <div className="text-right">
              <a
                href={lightboxImage}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <span>Open full-resolution</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Report Civic Issue with Photo Upload & SLA Info */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1">
                  <MessageSquareWarning className="w-3.5 h-3.5" /> BMC Sanitation Redressal
                </span>
                <h3 className="font-black text-slate-900 text-lg">Report Civic Waste Issue</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  onActionChange?.('feedback');
                }}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
              {/* Category Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Issue Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:ring-2 focus:ring-rose-500 focus:outline-none"
                >
                  <option value="missed_pickup">🚛 Missed Scheduled Waste Pickup (24h SLA)</option>
                  <option value="illegal_dumping">🚯 Illegal Waste Dumping / Open Pile</option>
                  <option value="damaged_bin">🗑️ Overflowing or Damaged Public Bin</option>
                  <option value="driver_behavior">👤 Driver Unsegregated Collection or Misconduct</option>
                  <option value="other">ℹ️ Other Municipal Waste Issue</option>
                </select>
              </div>

              {/* 24-Hour SLA Guarantee Highlight for Missed Pickups */}
              {category === 'missed_pickup' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px]">24-Hour Municipal Emergency SLA Guarantee</p>
                    <p className="text-[10px] text-amber-800 leading-relaxed">
                      Submitting a missed collection automatically schedules an emergency doorstep pickup for today. Both your ward driver and control room will be notified.
                    </p>
                  </div>
                </div>
              )}

              {/* Gate / Colony Address */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Colony / Gate Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. E-4/204 Arera Colony, near 10 No. Market"
                  value={gateAddress}
                  onChange={(e) => setGateAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Description of the Problem *</label>
                <textarea
                  required
                  rows={3}
                  minLength={10}
                  maxLength={2000}
                  placeholder="Describe when the issue occurred, vehicle number if observed, and details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-rose-500 focus:outline-none font-medium"
                />
              </div>

              {/* Photo Proof Upload & Preview */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Photo Evidence (Recommended)</span>
                  <span className="text-[10px] font-normal text-slate-400">JPG, PNG up to 10MB</span>
                </label>

                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 h-32 bg-slate-100 flex items-center justify-center">
                    <img src={photoPreview} alt="Preview" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                        setImageUrl('');
                      }}
                      className="absolute top-2 right-2 bg-slate-900/80 text-white p-1 rounded-lg hover:bg-slate-900 text-xs"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-200 hover:border-rose-400 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="font-bold text-slate-700 text-xs">Click or drag image to upload proof</span>
                    <span className="text-[10px] text-slate-400 mt-0.5">Helps drivers and inspectors locate the waste</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Alternative Direct URL */}
                <input
                  type="text"
                  placeholder="Or paste photo URL (e.g. /uploads/evidence.jpg)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] placeholder-slate-400 focus:outline-none mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    onActionChange?.('feedback');
                  }}
                  className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhoto}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl transition shadow-sm flex items-center gap-2"
                >
                  {(isSubmitting || isUploadingPhoto) && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{isSubmitting ? 'Dispatching...' : 'Dispatch Alert to Ward'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
