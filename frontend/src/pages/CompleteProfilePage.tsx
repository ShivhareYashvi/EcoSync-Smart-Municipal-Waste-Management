import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  Compass,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  User,
} from 'lucide-react';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { ProfileAddressPayload } from '../lib/types';
import { useSessionStore } from '../store/session';

// Prominent Bhopal localities for quick selection
const BHOPAL_LOCALITIES = [
  'Arera Colony',
  'MP Nagar',
  'Kolar Road',
  'Habibganj',
  'TT Nagar (New Market)',
  'Hoshangabad Road',
  'Shahpura',
  'Govindpura',
  'Berasia Road',
  'Ayodhya Nagar',
  'Bairagarh (Sant Hirdaram Nagar)',
  'Indrapuri',
  'Misrod',
  'Kotra Sultanabad',
  'Karond',
  'Other'
];

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);

  // Form State
  const [name, setName] = useState(user?.name && user.name !== 'Citizen' ? user.name : '');
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace('+91', '') : '');
  const [email, setEmail] = useState(user?.email || '');

  // Structured Indian Government Address Format
  const [houseFlat, setHouseFlat] = useState(user?.house_flat_number || '');
  const [streetColony, setStreetColony] = useState(user?.street_colony || '');
  const [locality, setLocality] = useState(user?.locality || 'Arera Colony');
  const [customLocality, setCustomLocality] = useState('');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [wardNumber, setWardNumber] = useState(user?.ward_number || '');
  const [pincode, setPincode] = useState(user?.pincode || '462016');
  const [latitude, setLatitude] = useState<number | null>(user?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(user?.longitude ?? null);

  // UI state
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Capture GPS coordinates using HTML5 Geolocation API
  function handleUseCurrentLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setIsLocating(false);
        setLocationSuccess(true);
      },
      (error) => {
        setIsLocating(false);
        setLocationSuccess(false);
        setLocationError(`Unable to retrieve location (${error.message}). Please allow GPS permissions.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
      }
      return error.message;
    }
    return error instanceof Error ? error.message : 'Failed to save address.';
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const activeLocality = locality === 'Other' ? customLocality.trim() : locality;
    if (!activeLocality) {
      setErrorMessage('Please specify your locality or area.');
      return;
    }

    // Validate Bhopal pincode
    const pinDigits = pincode.replace(/\D/g, '');
    if (pinDigits.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit postal pincode.');
      return;
    }

    // Mobile number check
    if (!phone && !user?.phone) {
      setErrorMessage('Mobile number is required so collection drivers can call for pickups.');
      return;
    }

    const payload: ProfileAddressPayload = {
      name: name.trim(),
      phone: phone ? (phone.startsWith('+91') ? phone : `+91${phone.replace(/\D/g, '')}`) : undefined,
      email: email ? email.trim() : undefined,
      house_flat_number: houseFlat.trim(),
      street_colony: streetColony.trim(),
      locality: activeLocality,
      landmark: landmark.trim(),
      ward_number: wardNumber.trim(),
      pincode: pinDigits,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    };

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/profile-address', payload);
      setUser(res.data);
      navigate(dashboardPathForRole(res.data.role));
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <section className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-widest">
            <Compass className="w-4 h-4 text-emerald-300" />
            Bhopal Municipal Corporation Route Planning
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Complete Household Profile</h1>
          <p className="mt-1 text-emerald-100 text-xs leading-relaxed max-w-xl">
            In India, municipal route optimization and collector dispatch require structured correspondence
            and GPS coordinates. Please provide your official household details.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Section A: Profile */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-emerald-600" />
              A. Citizen Information
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Mobile Number (Required for pickup calls) *
                </label>
                <div className="flex rounded-2xl border border-slate-200 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20">
                  <span className="bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600 border-r border-slate-200">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-3 text-sm text-slate-900 outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="resident@bhopal.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Section B: Structured Address */}
          <div className="space-y-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Home className="w-4 h-4 text-emerald-600" />
              B. Structured Government Address (Bhopal)
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  House / Flat / Plot Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flat 302, Block B / Plot 45"
                  value={houseFlat}
                  onChange={(e) => setHouseFlat(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Street / Colony / Society Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gulmohar Enclave / 100ft Road"
                  value={streetColony}
                  onChange={(e) => setStreetColony(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Locality / Area (Bhopal) *
                </label>
                <select
                  value={locality}
                  onChange={(e) => setLocality(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                >
                  {BHOPAL_LOCALITIES.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                {locality === 'Other' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter locality name"
                    value={customLocality}
                    onChange={(e) => setCustomLocality(e.target.value)}
                    className="w-full mt-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-emerald-600"
                  />
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Landmark (Very Important for Drivers) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Near Shahpura Lake / Opp. Bansal Hospital"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bhopal Municipal Ward Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ward 42 (Range 1 - 85)"
                  value={wardNumber}
                  onChange={(e) => setWardNumber(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pincode (Bhopal: 462001 - 462047) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="462016"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold"
                />
              </div>
            </div>

            {/* GPS Location Pin via HTML5 Geolocation */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                    Exact Geo-Location Pin (Most Reliable Field for Routing)
                  </h3>
                  <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                    Enables collection drivers to navigate directly to your gate without getting lost.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-50"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Acquiring GPS...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-3.5 h-3.5" />
                      Use Current Location
                    </>
                  )}
                </button>
              </div>

              {locationSuccess && latitude && longitude && (
                <div className="p-2.5 bg-white/80 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    GPS Pinned: {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E
                  </span>
                </div>
              )}

              {locationError && (
                <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  {locationError}
                </p>
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving Address & Setting Up Dispatch...' : 'Save Address & Proceed to Dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}

