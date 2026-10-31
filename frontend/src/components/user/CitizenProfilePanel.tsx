import React, { useState } from 'react';
import {
  AlertCircle,
  Award,
  Building,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  Home,
  Info,
  Landmark,
  Leaf,
  LocateFixed,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  QrCode,
  RefreshCw,
  Save,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { api } from '../../lib/api';
import type { User } from '../../lib/types';
import { useSessionStore } from '../../store/session';
import { LocationPickerMap } from '../LocationPickerMap';

interface CitizenProfilePanelProps {
  currentUser: User;
}

export function CitizenProfilePanel({ currentUser }: CitizenProfilePanelProps) {
  const setUser = useSessionStore((state) => state.setUser);

  // Form edit states
  const [name, setName] = useState(currentUser.name || '');
  const [phone, setPhone] = useState(currentUser.phone ? currentUser.phone.replace('+91', '') : '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [houseFlat, setHouseFlat] = useState(currentUser.house_flat_number || '163');
  const [streetColony, setStreetColony] = useState(currentUser.street_colony || 'Mandakini Colony');
  const [locality, setLocality] = useState(currentUser.locality || 'Kolar Road');
  const [landmark, setLandmark] = useState(currentUser.landmark || 'Near Jawahar Lal Hsg');
  const [wardNumber, setWardNumber] = useState(currentUser.ward_number || '25');
  const [pincode, setPincode] = useState(currentUser.pincode || '462016');
  const [latitude, setLatitude] = useState<number>(currentUser.latitude ?? 23.1838);
  const [longitude, setLongitude] = useState<number>(currentUser.longitude ?? 77.4186);

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const householdId = currentUser.household_id || `ECO-2026-${String(currentUser.id).padStart(6, '0')}`;

  const handleCopyId = () => {
    navigator.clipboard.writeText(householdId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
      },
      () => {
        alert('Could not retrieve device location. Please drop pin on map manually.');
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim().startsWith('+91') ? phone.trim() : `+91${phone.trim()}`,
        email: email.trim() || undefined,
        house_flat_number: houseFlat.trim(),
        street_colony: streetColony.trim(),
        locality: locality.trim(),
        landmark: landmark.trim(),
        ward_number: wardNumber.trim(),
        pincode: pincode.trim(),
        latitude,
        longitude
      };

      const res = await api.post<User>('/auth/profile-address', payload);
      setUser(res.data);
      setSaveSuccess('✅ Registered Gate Address & Civic Profile updated successfully!');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to update profile. Please verify all fields.';
      setSaveError(String(message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header / Digital Civic ID Row ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Official Smart Civic ID Card (5 Cols) */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-950 p-6 sm:p-7 text-white shadow-xl shadow-emerald-950/20 border border-emerald-600/30 flex flex-col justify-between">
          {/* Card Watermark pattern */}
          <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute right-4 top-4 text-emerald-400/20">
            <Sparkles className="h-28 w-28" />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Header / Authority */}
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black tracking-widest uppercase text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Bhopal Smart Municipal Network
                </span>
                <h3 className="text-xl font-black text-white mt-0.5 tracking-tight">
                  Smart Civic Identity
                </h3>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                ACTIVE
              </span>
            </div>

            {/* Resident Details */}
            <div className="pt-2">
              <p className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">
                Resident / Property Holder
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {currentUser.name || 'Citizen'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-emerald-100 text-xs font-bold border border-white/10 flex items-center gap-1">
                  <Home className="h-3 w-3 text-emerald-300" />
                  Ward {currentUser.ward_number || '25'} Node
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-300" />
                  Phone Verified
                </span>
              </div>
            </div>

            {/* Household ID & Gate Ref */}
            <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Household QR Token (CPCB ID)
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 hover:text-white transition"
                  title="Copy Household ID"
                >
                  {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedId ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-sm font-mono font-black text-emerald-100 tracking-wider">
                {householdId}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                Gate: {currentUser.house_flat_number ? `${currentUser.house_flat_number}, ${currentUser.street_colony}` : currentUser.address || 'Registered Doorstep Gate'}
              </p>
            </div>
          </div>

          {/* Bottom QR Code Row */}
          <div className="relative z-10 pt-4 mt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* High Contrast Simulated QR Badge */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="h-14 w-14 rounded-2xl bg-white p-1.5 shadow-md hover:scale-105 transition cursor-pointer group shrink-0"
                title="Click to enlarge Doorstep QR for Driver Scanning"
              >
                <div className="w-full h-full border-2 border-slate-900 rounded-lg flex items-center justify-center p-1 bg-white">
                  <QrCode className="w-full h-full text-slate-900 group-hover:text-emerald-700 transition" />
                </div>
              </button>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  Doorstep Verification QR
                </p>
                <p className="text-[10px] text-emerald-200 mt-0.5">
                  Scan by driver to verify waste segregation
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="text-[11px] font-bold text-emerald-300 underline hover:text-white"
            >
              Enlarge
            </button>
          </div>
        </div>

        {/* CPCB Swachh Segregation & Circular Economy Scorecard (7 Cols) */}
        <div className="lg:col-span-7 glass-card rounded-[2.5rem] p-6 sm:p-7 shadow-sm space-y-5 border border-slate-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <Leaf className="h-4 w-4" /> Swachh Bharat & CPCB Metrics
              </span>
              <h2 className="text-xl font-black text-slate-950 mt-0.5">
                Segregation & Compliance Scorecard
              </h2>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
              Grade A+ Resident
            </span>
          </div>

          {/* 3 Metric Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Segregation Score
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-emerald-600">96%</span>
                <span className="text-xs font-bold text-emerald-700">High</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Zero mixed waste contamination flags
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Landfill Diversion
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900">18.5</span>
                <span className="text-xs font-bold text-slate-500">kg</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Composted & recycled via BMC network
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Carbon Offset
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-blue-600">12.3</span>
                <span className="text-xs font-bold text-blue-600">kg CO₂e</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Greenhouse emissions prevented
              </p>
            </div>
          </div>

          {/* Gamification Tier Progression */}
          <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <Award className="h-4 w-4 text-emerald-600" />
                Current Eco Tier: <strong className="text-emerald-700">Silver Citizen</strong>
              </span>
              <span className="font-bold text-emerald-700">Next: Gold (100 pts)</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-emerald-200/60 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600 transition-all duration-500 w-[65%]" />
            </div>
            <p className="text-[11px] text-emerald-800">
              Earn 35 more points from doorstep segregation to unlock 10% municipal water utility rebate.
            </p>
          </div>

          {/* Segregation Rules Quick Reference */}
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-green-50 border border-green-200">
              <span className="font-bold text-green-900 block text-[11px]">🟢 Wet Waste</span>
              <span className="text-[10px] text-green-700">Kitchen & Food Scraps</span>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="font-bold text-blue-900 block text-[11px]">🔵 Dry Waste</span>
              <span className="text-[10px] text-blue-700">Paper, Plastic & Metals</span>
            </div>
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
              <span className="font-bold text-rose-900 block text-[11px]">🔴 Domestic Haz</span>
              <span className="text-[10px] text-rose-700">Batteries, E-Waste & Glass</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Doorstep Gate & Address Management Form ─────────────────────── */}
      <article className="glass-card rounded-[2.5rem] p-6 sm:p-8 shadow-sm space-y-6 border border-slate-200/80">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
              <MapPin className="h-4 w-4" /> Official Municipal Property Record
            </span>
            <h2 className="text-2xl font-black text-slate-950 mt-0.5">
              Doorstep Pickup Address & Gate GPS Pin
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Drivers use this precise address and GPS coordinates to locate your gate during scheduled morning rounds.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDetectLocation}
            className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-sm"
          >
            <LocateFixed className="h-4 w-4 text-emerald-600" />
            <span>Detect My Gate GPS</span>
          </button>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* Identity Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mithun Sharma"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                10-Digit Mobile (Verified) *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-xs font-bold text-slate-400">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="7631882219"
                  className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. resident@example.com"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Structured Indian Address Fields */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" /> Structured Doorstep Civic Address (Bhopal Jurisdiction)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  House / Flat / Plot No *
                </label>
                <input
                  type="text"
                  required
                  value={houseFlat}
                  onChange={(e) => setHouseFlat(e.target.value)}
                  placeholder="e.g. 163, Flat 4B"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Street / Colony / Society *
                </label>
                <input
                  type="text"
                  required
                  value={streetColony}
                  onChange={(e) => setStreetColony(e.target.value)}
                  placeholder="e.g. Mandakini Colony"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Locality / Area *
                </label>
                <input
                  type="text"
                  required
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  placeholder="e.g. Kolar Road, MP Nagar"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Prominent Landmark *
                </label>
                <input
                  type="text"
                  required
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Jawahar Lal Hsg, Opposite Temple"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Municipal Ward Number *
                </label>
                <input
                  type="text"
                  required
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  placeholder="e.g. 25"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  6-Digit Postal Pincode *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  placeholder="462016"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Doorstep Gate GPS Pin Drop */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <MapPinned className="h-4 w-4 text-emerald-600" /> Confirm Precise Doorstep Gate Location (OpenStreetMap Pin)
              </label>
              <span className="text-[11px] text-slate-500 font-mono">
                {latitude.toFixed(5)}, {longitude.toFixed(5)}
              </span>
            </div>

            <LocationPickerMap
              latitude={String(latitude)}
              longitude={String(longitude)}
              onLocationChange={(lat, lng) => {
                setLatitude(Number(lat));
                setLongitude(Number(lng));
              }}
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>{saving ? 'Saving...' : 'Save & Update Doorstep Gate'}</span>
            </button>
          </div>
        </form>
      </article>

      {/* ── QR Code Enlarged Modal ────────────────────────────────────── */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-[2.5rem] bg-white p-7 text-center shadow-2xl space-y-4 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Doorstep QR Pass
              </span>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Simulated High-Res QR code */}
            <div className="mx-auto h-52 w-52 rounded-2xl bg-slate-50 p-4 border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center">
              <div className="h-44 w-44 rounded-xl bg-white p-3 shadow-inner border border-slate-200 flex items-center justify-center">
                <QrCode className="w-full h-full text-slate-900" />
              </div>
            </div>

            <div>
              <p className="font-mono text-xs font-bold text-emerald-800">{householdId}</p>
              <h4 className="text-base font-black text-slate-900 mt-0.5">{currentUser.name}</h4>
              <p className="text-xs text-slate-500 mt-1">
                Ward {currentUser.ward_number || '25'} · {currentUser.house_flat_number}, {currentUser.street_colony}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
              Present this QR to the municipal waste collection driver during morning rounds for instant digital weighment & points credit.
            </p>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
