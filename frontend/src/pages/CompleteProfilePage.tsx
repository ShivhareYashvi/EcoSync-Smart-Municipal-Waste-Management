import React, { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  Home,
  Loader2,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { ProfileAddressPayload } from '../lib/types';
import { useSessionStore } from '../store/session';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Prominent Bhopal localities for quick selection with typical ward and pincode presets
const BHOPAL_LOCALITIES: Array<{ name: string; ward: string; pincode: string }> = [
  { name: 'Arera Colony', ward: 'Ward 48', pincode: '462016' },
  { name: 'MP Nagar', ward: 'Ward 36', pincode: '462011' },
  { name: 'Kolar Road', ward: 'Ward 25', pincode: '462042' },
  { name: 'Habibganj', ward: 'Ward 44', pincode: '462024' },
  { name: 'TT Nagar (New Market)', ward: 'Ward 30', pincode: '462003' },
  { name: 'Hoshangabad Road', ward: 'Ward 52', pincode: '462026' },
  { name: 'Shahpura', ward: 'Ward 49', pincode: '462039' },
  { name: 'Govindpura', ward: 'Ward 60', pincode: '462023' },
  { name: 'Ayodhya Nagar', ward: 'Ward 65', pincode: '462041' },
  { name: 'Bairagarh', ward: 'Ward 04', pincode: '462030' },
  { name: 'Indrapuri', ward: 'Ward 58', pincode: '462021' },
  { name: 'Misrod', ward: 'Ward 55', pincode: '462047' },
  { name: 'Kotra Sultanabad', ward: 'Ward 28', pincode: '462007' },
  { name: 'Karond', ward: 'Ward 14', pincode: '462038' },
  { name: 'Other', ward: '', pincode: '462016' },
];

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const user = useSessionStore((state) => state.user);
  const setUser = useSessionStore((state) => state.setUser);

  // Stepper State: 1 = Contact, 2 = Address, 3 = Gate GPS
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Form State
  const [name, setName] = useState(user?.name && user.name !== 'Citizen' ? user.name : '');
  const [phone, setPhone] = useState(user?.phone ? user.phone.replace('+91', '') : '');
  const [email, setEmail] = useState(user?.email || '');

  // Step 2: Structured Indian Government Address Format
  const [houseFlat, setHouseFlat] = useState(user?.house_flat_number || '');
  const [streetColony, setStreetColony] = useState(user?.street_colony || '');
  const [locality, setLocality] = useState(user?.locality || 'Arera Colony');
  const [customLocality, setCustomLocality] = useState('');
  const [landmark, setLandmark] = useState(user?.landmark || '');
  const [wardNumber, setWardNumber] = useState(user?.ward_number || 'Ward 48');
  const [pincode, setPincode] = useState(user?.pincode || '462016');

  // Step 3: Coordinates
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

  // Handle locality change auto-fill
  const handleLocalitySelect = (locName: string) => {
    setLocality(locName);
    const found = BHOPAL_LOCALITIES.find((l) => l.name === locName);
    if (found && locName !== 'Other') {
      if (found.ward) setWardNumber(found.ward);
      if (found.pincode) setPincode(found.pincode);
    }
  };

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
        setLocationError(`Unable to retrieve GPS fix (${error.message}). Moving outdoors often resolves this.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
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

  function validateStep1(): boolean {
    if (!name.trim()) {
      setErrorMessage('Full name is required.');
      return false;
    }
    const pinClean = phone.replace(/\D/g, '');
    if (!pinClean && !user?.phone) {
      setErrorMessage('Mobile number is required for collection driver coordination.');
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  function validateStep2(): boolean {
    if (!houseFlat.trim()) {
      setErrorMessage('Please specify House / Flat / Plot number.');
      return false;
    }
    if (!streetColony.trim()) {
      setErrorMessage('Please specify Street, Colony or Society name.');
      return false;
    }
    if (!landmark.trim()) {
      setErrorMessage('A prominent landmark is required for municipal collection vans.');
      return false;
    }
    const pinDigits = pincode.replace(/\D/g, '');
    if (pinDigits.length !== 6) {
      setErrorMessage('Please enter a valid 6-digit Bhopal postal pincode.');
      return false;
    }
    setErrorMessage(null);
    return true;
  }

  async function handleFinalSubmit(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);

    const activeLocality = locality === 'Other' ? customLocality.trim() : locality;
    if (!activeLocality) {
      setErrorMessage('Please specify your locality or ward area.');
      return;
    }

    const pinDigits = pincode.replace(/\D/g, '');

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
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative overflow-hidden">
      <Navbar mode="auth" />

      {/* Background decoration */}
      <div className="absolute top-0 right-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10">
        <section className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 p-7 sm:p-8 text-white">
          <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-widest">
            <Compass className="w-4 h-4 text-emerald-300" />
            Bhopal Municipal Corporation Onboarding
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">Complete Household Profile</h1>
          <p className="mt-1 text-emerald-100 text-xs leading-relaxed max-w-xl">
            In India, municipal route optimization and collector dispatch require structured correspondence
            and GPS coordinates. Please complete your 3-step profile.
          </p>

          {/* Stepper Progress Bar */}
          <div className="mt-6 flex items-center justify-between gap-2 border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep >= 1 ? 'bg-white text-emerald-900 shadow-sm' : 'bg-white/30 text-white'
              }`}>
                1
              </span>
              <span className="text-xs font-bold text-white hidden sm:inline">Identity</span>
            </div>
            <div className={`h-1 flex-1 rounded-full ${currentStep >= 2 ? 'bg-white' : 'bg-white/20'}`} />
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep >= 2 ? 'bg-white text-emerald-900 shadow-sm' : 'bg-white/30 text-white'
              }`}>
                2
              </span>
              <span className="text-xs font-bold text-white hidden sm:inline">Property Address</span>
            </div>
            <div className={`h-1 flex-1 rounded-full ${currentStep >= 3 ? 'bg-white' : 'bg-white/20'}`} />
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                currentStep === 3 ? 'bg-white text-emerald-900 shadow-sm' : 'bg-white/30 text-white'
              }`}>
                3
              </span>
              <span className="text-xs font-bold text-white hidden sm:inline">Gate GPS Pin</span>
            </div>
          </div>
        </div>

        {/* Step Body */}
        <form onSubmit={handleFinalSubmit} className="p-7 sm:p-8 space-y-6">
          {/* STEP 1: CITIZEN INFORMATION */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Step 1: Household Contact & Identity
                </h2>
                <span className="text-xs font-bold text-slate-400">Step 1 of 3</span>
              </div>

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
                    Mobile Number (For pickup calls) *
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

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep1()) setCurrentStep(2);
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  Proceed to Address <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: STRUCTURED PROPERTY ADDRESS */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-600" />
                  Step 2: Structured Bhopal Property Address
                </h2>
                <span className="text-xs font-bold text-slate-400">Step 2 of 3</span>
              </div>

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
                    placeholder="e.g. Gulmohar Enclave / Kolar Main Rd"
                    value={streetColony}
                    onChange={(e) => setStreetColony(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Locality / Ward Area (Bhopal) *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => handleLocalitySelect(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {BHOPAL_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}
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
                    Landmark (Crucial for Drivers) *
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
                    Municipal Ward Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ward 48"
                    value={wardNumber}
                    onChange={(e) => setWardNumber(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Postal Pincode (462001 - 462047) *
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

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateStep2()) setCurrentStep(3);
                  }}
                  className="px-6 py-3 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-2 shadow-sm"
                >
                  Proceed to Gate GPS <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: GATE GPS PIN & CONFIRMATION */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Step 3: Precise Household Gate GPS Pin
                </h2>
                <span className="text-xs font-bold text-slate-400">Step 3 of 3</span>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <h3 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      Latch Geolocation Coordinates
                    </h3>
                    <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                      Captures your exact property gate so collection trucks route directly to your doorstep.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0 disabled:opacity-50"
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

                {latitude && longitude ? (
                  <div className="p-3 bg-white/90 rounded-xl border border-emerald-300 text-xs text-emerald-900 flex items-center gap-2 font-mono font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      GPS Locked: {latitude.toFixed(6)}° N, {longitude.toFixed(6)}° E
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Coordinates optional — if skipped, drivers will locate you via your registered landmark & house number.
                  </p>
                )}

                {locationError && (
                  <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    {locationError}
                  </p>
                )}
              </div>

              {/* Identity Token Minting Preview */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Municipal Identity To Be Minted:
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">{name}</p>
                    <p className="text-xs text-slate-500">{houseFlat}, {streetColony}, {locality}, {wardNumber}</p>
                  </div>
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ECO-2026-{String(user?.id || 1).padStart(6, '0')}
                  </span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Profile...' : 'Complete Registration & Go to Dashboard'}
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}
        </form>
      </section>
      </main>

      <Footer mode="auth" />
    </div>
  );
}
