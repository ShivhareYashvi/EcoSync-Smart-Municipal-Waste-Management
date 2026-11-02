import React, { useEffect, useState } from 'react';
import {
  X,
  AlertTriangle,
  Send,
  CheckCircle2,
  Clock,
  Camera,
  MapPin,
  Phone,
  ShieldCheck,
  Loader2,
  Check
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import type { User } from '../../lib/types';

interface MissedPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  wardNumber: string;
  user?: User | null;
}

const WASTE_STREAMS = [
  { id: 'wet', label: '🟢 Wet Kitchen Waste', desc: 'Food scraps, peelings, organic' },
  { id: 'dry', label: '🔵 Dry Recyclables', desc: 'Plastic, paper, cardboard, metal' },
  { id: 'sanitary', label: '🔴 Sanitary / Domestic Haz', desc: 'Diapers, medicines, batteries' },
  { id: 'all', label: '🟡 All Bins / Mixed', desc: 'Entire household collection skipped' },
];

const TIME_WINDOWS = [
  'Morning Sweep (7:00 AM - 9:30 AM)',
  'Mid-Day Sweep (11:00 AM - 1:00 PM)',
  'Afternoon Sweep (2:00 PM - 4:00 PM)',
  'Earlier Today (Uncertain exact time)'
];

export const MissedPickupModal: React.FC<MissedPickupModalProps> = ({
  isOpen,
  onClose,
  userId,
  wardNumber,
  user,
}) => {
  const queryClient = useQueryClient();

  // Clean ward representation (removes duplicated "Ward Ward 25")
  const cleanWard = (wardNumber || '48').replace(/^(ward\s*)+/gi, '').trim() || '48';

  // Form states
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [wasteStream, setWasteStream] = useState('all');
  const [timeWindow, setTimeWindow] = useState(TIME_WINDOWS[0]);
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill from user profile when opened
  useEffect(() => {
    if (isOpen) {
      setSubmitted(false);
      setError(null);

      const defaultAddr = [
        user?.house_flat_number,
        user?.street_colony,
        user?.locality,
        user?.landmark ? `Near ${user.landmark}` : null,
      ]
        .filter(Boolean)
        .join(', ') || user?.address || '';

      setAddress(defaultAddr);
      setPhone(user?.phone ? user.phone.replace('+91', '') : '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  // Handle optional photo upload of uncollected waste/gate
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Photo exceeds 8MB. Please choose a smaller photo.');
      return;
    }

    setUploadingPhoto(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post<{ stored_path: string; public_url: string }>(
        '/uploads/pickup-photos',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setPhotoUrl(res.data.stored_path);
    } catch {
      setError('Could not upload photo. You can still dispatch the alert without it.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const cleanPhoneDigits = phone.replace(/\D/g, '');
    if (cleanPhoneDigits && cleanPhoneDigits.length !== 10) {
      setError('Please provide a valid 10-digit mobile number so the driver can reach you.');
      setLoading(false);
      return;
    }

    if (!address.trim()) {
      setError('Please provide your colony and gate address.');
      setLoading(false);
      return;
    }

    try {
      const structuredDescription = [
        `[24H SLA EMERGENCY MISSED PICKUP - WARD ${cleanWard}]`,
        `Gate Address: ${address.trim()}`,
        `Contact Phone: ${cleanPhoneDigits ? `+91 ${cleanPhoneDigits}` : (user?.phone || 'Not provided')}`,
        `Missed Stream: ${wasteStream.toUpperCase()}`,
        `Time Window: ${timeWindow}`,
        notes.trim() ? `Resident Remarks: ${notes.trim()}` : null,
        `Dispatch SLA: Mandatory 24-hour resolution window under BMC Swachhata Mandate.`,
      ]
        .filter(Boolean)
        .join(' | ');

      await api.post('/complaints', {
        user_id: userId,
        category: 'missed_pickup',
        description: structuredDescription,
        image: photoUrl || undefined,
      });

      // Invalidate relevant caches so driver and citizen view updates immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['user-complaints'] }),
        queryClient.invalidateQueries({ queryKey: ['user-pickups'] }),
        queryClient.invalidateQueries({ queryKey: ['driver-pickups'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-complaints'] }),
      ]);

      setSubmitted(true);
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to dispatch alert. Please dial the BMC 155304 helpline directly.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="missed-pickup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95">
        {/* Header Strip */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="missed-pickup-title" className="text-lg font-black text-slate-900">
                  Report Missed Waste Collection
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-200 uppercase">
                  24h SLA
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Direct emergency alert to BMC Ward {cleanWard} Sanitation Inspector &amp; Fleet Drivers
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-4 animate-in fade-in duration-200">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 shadow-sm">
              <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Emergency Reroute Dispatched to Fleet!
              </h3>
              <p className="text-xs font-semibold text-emerald-700 mt-1">
                24-Hour Municipal Resolution SLA Clock is now active
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Ward Jurisdiction:</span>
                <span className="font-bold text-slate-900">Bhopal Ward {cleanWard}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Gate Address:</span>
                <span className="font-bold text-slate-900 truncate max-w-[240px]">{address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">SLA Target:</span>
                <span className="font-black text-rose-600">Within 24 Hours (Guaranteed)</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 max-w-sm mx-auto leading-relaxed">
              Ticket logged in BMC Central Dispatch. Drivers assigned to Ward {cleanWard} have received your gate details and phone. If not serviced within 24 hours, call toll-free 155304.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-950 text-white font-bold text-xs px-6 py-3 hover:bg-slate-800 transition shadow-sm"
            >
              Return to Citizen Hub
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 24-Hour Municipal SLA Commitment Banner */}
            <div className="rounded-2xl bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 p-3.5 border border-rose-200/80 flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-black text-slate-900 flex items-center gap-1.5">
                  <span>Guaranteed 24-Hour Resolution Timeline</span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-white/80 px-2 py-0.5 rounded-full border border-emerald-300 font-bold">
                    <ShieldCheck className="h-3 w-3 text-emerald-600" /> BMC Citizen Charter
                  </span>
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  Reporting a missed sweep immediately alerts both the Ward Sanitation Inspector and auxiliary fleet drivers with a strict 24-hour SLA countdown.
                </p>
              </div>
            </div>

            {error && (
              <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Address & Contact Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="missed-address" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-emerald-600" /> Colony / Gate Address *
                </label>
                <input
                  id="missed-address"
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Mandakini Colony, Kolar Road"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                />
              </div>

              <div>
                <label htmlFor="missed-phone" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-emerald-600" /> Driver Contact Mobile *
                </label>
                <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <span className="bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600 border-r border-slate-200 shrink-0">
                    +91
                  </span>
                  <input
                    id="missed-phone"
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Waste Stream Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Which Waste Stream Was Missed?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {WASTE_STREAMS.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => setWasteStream(ws.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                      wasteStream === ws.id
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-slate-900">{ws.label}</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">{ws.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Window Missed */}
            <div>
              <label htmlFor="missed-time-window" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Scheduled Collection Slot That Passed
              </label>
              <select
                id="missed-time-window"
                value={timeWindow}
                onChange={(e) => setTimeWindow(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              >
                {TIME_WINDOWS.map((tw) => (
                  <option key={tw} value={tw}>
                    {tw}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Remarks */}
            <div>
              <label htmlFor="missed-notes" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Additional Details (Optional)
              </label>
              <textarea
                id="missed-notes"
                rows={2}
                placeholder="Specify if vehicle skipped the entire lane, arrived earlier than usual, or left bins unemptied..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {/* Optional Photo Proof Upload */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Camera className="h-4 w-4 text-slate-500" />
                <div>
                  <p className="font-bold text-slate-800">Attach Gate / Bin Photo (Optional)</p>
                  <p className="text-[10px] text-slate-500">Helps the auxiliary driver spot your uncollected bin quickly</p>
                </div>
              </div>

              {photoUrl ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300">
                  <Check className="h-3 w-3" /> Photo Attached
                </span>
              ) : (
                <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold text-slate-700 hover:bg-slate-100 transition">
                  {uploadingPhoto ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  <span>{uploadingPhoto ? 'Uploading...' : 'Take Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 text-white px-5 py-2.5 text-xs font-black shadow-md hover:bg-rose-700 transition disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>{loading ? 'Transmitting Alert...' : 'Dispatch Alert to Ward (24h SLA)'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
