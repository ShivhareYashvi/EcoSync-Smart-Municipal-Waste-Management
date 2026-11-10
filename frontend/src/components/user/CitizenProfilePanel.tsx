import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  Building,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Home,
  Leaf,
  Loader2,
  LocateFixed,
  MapPin,
  MapPinned,
  Phone,
  QrCode,
  RefreshCw,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Truck,
  UploadCloud,
  User as UserIcon,
  X
} from 'lucide-react';
import { api } from '../../lib/api';
import type { ProfileAddressPayload, User } from '../../lib/types';
import { useSessionStore } from '../../store/session';
import { LocationPickerMap } from '../LocationPickerMap';

// Prominent Bhopal localities with typical Ward and Pincode presets
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

type ProfileTab = 'all' | 'contact' | 'address' | 'gps' | 'docs';

interface CitizenProfilePanelProps {
  currentUser: User;
}

export function CitizenProfilePanel({ currentUser }: CitizenProfilePanelProps) {
  const setUser = useSessionStore((state) => state.setUser);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<ProfileTab>('all');

  // Form edit states
  const [name, setName] = useState(currentUser.name && currentUser.name !== 'Citizen' ? currentUser.name : '');
  const [phone, setPhone] = useState(currentUser.phone ? currentUser.phone.replace('+91', '') : '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [vehicleNumber, setVehicleNumber] = useState(currentUser.vehicle_number || '');

  // Address fields
  const [houseFlat, setHouseFlat] = useState(currentUser.house_flat_number || '163');
  const [streetColony, setStreetColony] = useState(currentUser.street_colony || 'Mandakini Colony');

  // Determine initial locality from presets
  const initialLocalityIsPreset = BHOPAL_LOCALITIES.some(
    (l) => l.name.toLowerCase() === (currentUser.locality || '').toLowerCase() && l.name !== 'Other'
  );
  const [locality, setLocality] = useState(
    initialLocalityIsPreset ? (currentUser.locality || 'Kolar Road') : (currentUser.locality ? 'Other' : 'Kolar Road')
  );
  const [customLocality, setCustomLocality] = useState(
    !initialLocalityIsPreset && currentUser.locality ? currentUser.locality : ''
  );

  const [landmark, setLandmark] = useState(currentUser.landmark || 'Near Jawahar Lal Hsg');
  const [wardNumber, setWardNumber] = useState(currentUser.ward_number || 'Ward 25');
  const [pincode, setPincode] = useState(currentUser.pincode || '462016');

  // Coordinates
  const [latitude, setLatitude] = useState<number>(currentUser.latitude ?? 23.1838);
  const [longitude, setLongitude] = useState<number>(currentUser.longitude ?? 77.4186);

  // Verification & Document fields
  const [electricityBillPath, setElectricityBillPath] = useState<string | null>(
    currentUser.electricity_bill_path || null
  );
  const [uploadingBill, setUploadingBill] = useState(false);
  const [billUploadMessage, setBillUploadMessage] = useState<string | null>(null);

  // UI state
  const [detectingGps, setDetectingGps] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const householdId = currentUser.household_id || `ECO-2026-${String(currentUser.id).padStart(6, '0')}`;

  // Resolved active locality string
  const activeLocality = locality === 'Other' ? (customLocality.trim() || 'Bhopal') : locality;

  // Handle locality change auto-fill
  const handleLocalitySelect = (selected: string) => {
    setLocality(selected);
    const found = BHOPAL_LOCALITIES.find((l) => l.name === selected);
    if (found && selected !== 'Other') {
      if (found.ward) setWardNumber(found.ward);
      if (found.pincode) setPincode(found.pincode);
    }
  };

  // Format full live address string
  const formattedAddressPreview = useMemo(() => {
    const parts = [
      houseFlat.trim(),
      streetColony.trim(),
      activeLocality,
      landmark.trim() ? `Near ${landmark.trim()}` : null,
      wardNumber.trim() ? (wardNumber.toLowerCase().startsWith('ward') ? wardNumber.trim() : `Ward ${wardNumber.trim()}`) : null,
      pincode.trim() ? `Bhopal - ${pincode.trim()}` : 'Bhopal'
    ].filter(Boolean);
    return parts.join(', ');
  }, [houseFlat, streetColony, activeLocality, landmark, wardNumber, pincode]);

  // Check if form has unsaved modifications
  const isDirty = useMemo(() => {
    const origPhone = (currentUser.phone || '').replace('+91', '');
    const currentLoc = locality === 'Other' ? customLocality.trim() : locality;
    const origLoc = currentUser.locality || '';

    return (
      name.trim() !== (currentUser.name || '').trim() ||
      phone.trim() !== origPhone.trim() ||
      email.trim() !== (currentUser.email || '').trim() ||
      vehicleNumber.trim().toUpperCase() !== (currentUser.vehicle_number || '').trim().toUpperCase() ||
      houseFlat.trim() !== (currentUser.house_flat_number || '').trim() ||
      streetColony.trim() !== (currentUser.street_colony || '').trim() ||
      currentLoc !== origLoc.trim() ||
      landmark.trim() !== (currentUser.landmark || '').trim() ||
      wardNumber.trim() !== (currentUser.ward_number || '').trim() ||
      pincode.trim() !== (currentUser.pincode || '').trim() ||
      Math.abs(latitude - (currentUser.latitude ?? 23.1838)) > 0.0001 ||
      Math.abs(longitude - (currentUser.longitude ?? 77.4186)) > 0.0001 ||
      electricityBillPath !== currentUser.electricity_bill_path
    );
  }, [
    name, phone, email, vehicleNumber, houseFlat, streetColony, locality,
    customLocality, landmark, wardNumber, pincode, latitude, longitude,
    electricityBillPath, currentUser
  ]);

  // Reset all edits back to current user data
  const handleReset = () => {
    setName(currentUser.name && currentUser.name !== 'Citizen' ? currentUser.name : '');
    setPhone(currentUser.phone ? currentUser.phone.replace('+91', '') : '');
    setEmail(currentUser.email || '');
    setVehicleNumber(currentUser.vehicle_number || '');
    setHouseFlat(currentUser.house_flat_number || '163');
    setStreetColony(currentUser.street_colony || 'Mandakini Colony');
    const isPreset = BHOPAL_LOCALITIES.some(
      (l) => l.name.toLowerCase() === (currentUser.locality || '').toLowerCase() && l.name !== 'Other'
    );
    setLocality(isPreset ? (currentUser.locality || 'Kolar Road') : (currentUser.locality ? 'Other' : 'Kolar Road'));
    setCustomLocality(!isPreset && currentUser.locality ? currentUser.locality : '');
    setLandmark(currentUser.landmark || 'Near Jawahar Lal Hsg');
    setWardNumber(currentUser.ward_number || 'Ward 25');
    setPincode(currentUser.pincode || '462016');
    setLatitude(currentUser.latitude ?? 23.1838);
    setLongitude(currentUser.longitude ?? 77.4186);
    setElectricityBillPath(currentUser.electricity_bill_path || null);
    setSaveError(null);
    setSaveSuccess('Form reset to saved profile data.');
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(householdId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // High-accuracy GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setSaveError('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    setSaveError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setDetectingGps(false);
        setSaveSuccess('Gate coordinates detected from device GPS!');
        setTimeout(() => setSaveSuccess(null), 4000);
      },
      (err) => {
        setDetectingGps(false);
        setSaveError(`Could not retrieve GPS coordinates (${err.message}). You can drag or click the pin on the map directly.`);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  // Handle Electricity Bill Document Upload
  const handleElectricityBillUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSaveError('File size exceeds the 10MB limit. Please upload a compressed document.');
      return;
    }

    setUploadingBill(true);
    setSaveError(null);
    setBillUploadMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post<{ stored_path: string; public_url: string }>(
        '/uploads/electricity-bills',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      setElectricityBillPath(res.data.stored_path);
      setBillUploadMessage('Electricity bill uploaded successfully! Click "Save Profile" below to apply it to your account.');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to upload document. Please try again.';
      setSaveError(String(message));
    } finally {
      setUploadingBill(false);
    }
  };

  // Validate and submit updated profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    // Validate phone number
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setSaveError('Mobile number must be exactly 10 digits.');
      setSaving(false);
      return;
    }
    if (!/^[6-9]\d{9}$/.test(cleanPhone) && !cleanPhone.startsWith('00000000')) {
      setSaveError('Please enter a valid Indian mobile number starting with 6, 7, 8, or 9.');
      setSaving(false);
      return;
    }

    // Validate required address fields
    if (!houseFlat.trim()) {
      setSaveError('House / Flat / Plot number is required for door-to-door collection.');
      setSaving(false);
      return;
    }
    if (!streetColony.trim()) {
      setSaveError('Street, Colony or Society name is required.');
      setSaving(false);
      return;
    }
    if (locality === 'Other' && !customLocality.trim()) {
      setSaveError('Please enter your locality name.');
      setSaving(false);
      return;
    }
    if (!landmark.trim()) {
      setSaveError('A nearby landmark is required so municipal collection vans can find your gate.');
      setSaving(false);
      return;
    }
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setSaveError('Please enter a valid 6-digit postal pincode (e.g. 462016).');
      setSaving(false);
      return;
    }

    try {
      const payload: ProfileAddressPayload = {
        name: name.trim() || 'Citizen',
        phone: `+91${cleanPhone}`,
        email: email.trim() ? email.trim() : undefined,
        house_flat_number: houseFlat.trim(),
        street_colony: streetColony.trim(),
        locality: activeLocality,
        landmark: landmark.trim(),
        ward_number: wardNumber.trim(),
        pincode: cleanPin,
        latitude,
        longitude,
        vehicle_number: vehicleNumber.trim() ? vehicleNumber.trim().toUpperCase() : undefined,
        electricity_bill_path: electricityBillPath || undefined
      };

      const res = await api.post<User>('/auth/profile-address', payload);
      setUser(res.data);
      setSaveSuccess('Registered Mobile, Gate Address & Civic Profile updated successfully!');
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : 'Failed to update profile. Please verify your fields and try again.';
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

            {/* Resident Details (Dynamically reflects live edits) */}
            <div className="pt-2">
              <p className="text-[11px] font-medium text-emerald-200 uppercase tracking-wider">
                Resident / Property Holder
              </p>
              <h2 className="text-2xl font-black text-white tracking-tight mt-0.5 truncate">
                {name || currentUser.name || 'Citizen'}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="px-2.5 py-1 rounded-xl bg-white/10 text-emerald-100 text-xs font-bold border border-white/10 flex items-center gap-1">
                  <Home className="h-3 w-3 text-emerald-300" />
                  {wardNumber || currentUser.ward_number || 'Ward 25'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-emerald-300" />
                  {phone ? `+91 ${phone}` : (currentUser.phone || 'Phone Unset')}
                </span>
                {currentUser.role === 'driver' && (
                  <span className="px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-200 text-xs font-bold border border-cyan-500/30 flex items-center gap-1 font-mono">
                    <Truck className="h-3 w-3 text-cyan-300" />
                    {vehicleNumber || currentUser.vehicle_number || 'Vehicle Unset'}
                  </span>
                )}
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
                Gate: {houseFlat ? `${houseFlat}, ${streetColony}` : (currentUser.address || 'Registered Doorstep Gate')}
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
        {/* Form Title & Tab Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Official Municipal Property Record
              </span>
              {isDirty && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                  Unsaved Changes
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black text-slate-950 mt-0.5">
              Doorstep Pickup Address &amp; Profile Settings
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Update your registered mobile number, doorstep address, and GPS pin for coordinated municipal rounds.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition shadow-2xs"
                title="Discard unsaved edits"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={detectingGps}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition shadow-2xs disabled:opacity-50"
            >
              {detectingGps ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-700" />
              ) : (
                <LocateFixed className="h-3.5 w-3.5 text-emerald-600" />
              )}
              <span>{detectingGps ? 'Locating...' : 'Detect Gate GPS'}</span>
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-100">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            📋 All Fields
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contact')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'contact'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Phone className="h-3.5 w-3.5" />
            <span>Mobile &amp; Identity</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('address')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'address'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <Building className="h-3.5 w-3.5" />
            <span>Doorstep Address</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gps')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'gps'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <MapPinned className="h-3.5 w-3.5" />
            <span>Gate GPS Pin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('docs')}
            className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${activeTab === 'docs'
              ? 'bg-emerald-700 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Bill Proof (+100 Pts)</span>
            {electricityBillPath && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            )}
          </button>
        </div>

        {/* Feedback Banners */}
        {saveSuccess && (
          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}
        {billUploadMessage && (
          <div className="rounded-2xl bg-emerald-50/90 p-4 border border-emerald-300 text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in duration-150">
            <UploadCloud className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{billUploadMessage}</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200 text-xs font-bold text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* SECTION 1: IDENTITY & CONTACT (Visible on 'all' or 'contact') */}
          {(activeTab === 'all' || activeTab === 'contact') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <UserIcon className="h-4 w-4 text-emerald-600" />
                  Resident Contact &amp; Identity
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  Required for collector coordination
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      10-Digit Mobile Number *
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Primary Contact
                    </span>
                  </div>
                  <div className="flex rounded-2xl border border-slate-200 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                    <span className="bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-600 border-r border-slate-200 shrink-0">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="9876543210"
                      className="w-full bg-white px-3.5 py-3 text-xs font-bold text-slate-800 outline-none font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Drivers will contact this number for doorstep weighment &amp; pickup confirmation.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. resident@bhopal.in"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used for monthly Swachh recycling summaries &amp; EPR credit certificates.
                  </p>
                </div>

                {currentUser.role === 'driver' && (
                  <div className="sm:col-span-2 lg:col-span-3 p-4 rounded-2xl bg-cyan-50/70 border border-cyan-200">
                    <label className="block text-xs font-bold uppercase tracking-wider text-cyan-950 mb-1.5 flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-cyan-700" />
                      Assigned Municipal Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                      placeholder="e.g. MP-04-EC-2024"
                      className="w-full sm:w-80 rounded-xl border border-cyan-300 bg-white px-4 py-2.5 text-xs font-mono font-bold text-slate-900 outline-none uppercase focus:border-cyan-600"
                    />
                    <p className="text-[11px] text-cyan-800 mt-1">
                      Updating this plate synchronizes your live GPS telemetry with dispatch routing.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: STRUCTURED DOORSTEP ADDRESS (Visible on 'all' or 'address') */}
          {(activeTab === 'all' || activeTab === 'address') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Building className="h-4 w-4 text-emerald-600" />
                  Structured Bhopal Property Address
                </h3>
                <span className="text-[11px] font-semibold text-slate-400">
                  BMC Ward Jurisdictions
                </span>
              </div>

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
                    placeholder="e.g. Flat 302, Block B / Plot 45"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
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
                    placeholder="e.g. Mandakini Colony / Gulmohar Enclave"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Locality / Ward Area (Bhopal) *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => handleLocalitySelect(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {BHOPAL_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name} {loc.ward ? `(${loc.ward})` : ''}
                      </option>
                    ))}
                  </select>
                  {locality === 'Other' && (
                    <input
                      type="text"
                      required
                      placeholder="Specify your locality"
                      value={customLocality}
                      onChange={(e) => setCustomLocality(e.target.value)}
                      className="w-full mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600"
                    />
                  )}
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
                    placeholder="e.g. Near Shahpura Lake / Opp. Bansal Hospital"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
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
                    placeholder="e.g. Ward 25 or 48"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs font-mono font-bold text-slate-800 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Live Formatted Address Preview Strip */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Formatted Doorstep Address Preview (As shown to drivers):
                </span>
                <p className="font-semibold text-slate-800 leading-relaxed">
                  {formattedAddressPreview}
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3: GATE GPS LOCATION (Visible on 'all' or 'gps') */}
          {(activeTab === 'all' || activeTab === 'gps') && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <MapPinned className="h-4 w-4 text-emerald-600" />
                  Precise Household Gate Pin (OpenStreetMap)
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-800 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    GPS: {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
                  </span>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingGps}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition flex items-center gap-1 disabled:opacity-50"
                  >
                    {detectingGps ? <Loader2 className="h-3 w-3 animate-spin" /> : <LocateFixed className="h-3 w-3" />}
                    <span>Locate</span>
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Drag the map pin directly over your property gate or entrance. Municipal route optimization uses these exact coordinates so the morning compactor stops right outside your door.
                </p>

                <LocationPickerMap
                  latitude={String(latitude)}
                  longitude={String(longitude)}
                  onLocationChange={(lat, lng) => {
                    setLatitude(Number(lat));
                    setLongitude(Number(lng));
                  }}
                />
              </div>
            </div>
          )}

          {/* SECTION 4: ELECTRICITY BILL & PROOF (Visible on 'all' or 'docs') */}
          {(activeTab === 'all' || activeTab === 'docs') && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  Household Address Proof &amp; Bonus Points
                </h3>
                <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  +100 Green Points
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Electricity Bill / Property Tax Verification
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 max-w-lg leading-relaxed">
                      Linking a digital electricity bill (MPPKVVCL) or Bhopal property receipt verifies your single-household gate and awards an immediate 100-point Swachh bonus.
                    </p>
                  </div>

                  {electricityBillPath ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs fontd-300">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Document Linked
                      </span>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingBill}
                        className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                      >
                        {uploadingBill ? 'Uploading...' : 'Replace'}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingBill}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-50"
                    >
                      {uploadingBill ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UploadCloud className="h-3.5 w-3.5" />}
                      <span>{uploadingBill ? 'Uploading...' : 'Upload Bill (+100 Pts)'}</span>
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleElectricityBillUpload}
                    className="hidden"
                  />
                </div>

                {electricityBillPath && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-600 truncate max-w-md">
                      📄 Document: {electricityBillPath}
                    </span>
                    <a
                      href={`http://localhost:8000/uploads/${electricityBillPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 font-bold hover:underline shrink-0"
                    >
                      <span>View File</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Submit Bar */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              {isDirty ? (
                <span className="font-bold text-amber-700 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  You have unsaved edits. Click save to persist to your municipal account.
                </span>
              ) : (
                <span className="text-slate-400">
                  Profile is synchronized with Bhopal Municipal Corporation records.
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {isDirty && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="w-1/2 sm:w-auto px-4 py-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Discard</span>
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 text-xs font-black text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save</span>
                  </>
                )}
              </button>
            </div>
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
                <X className="h-4 w-4" />
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
              <h4 className="text-base font-black text-slate-900 mt-0.5">{name || currentUser.name}</h4>
              <p className="text-xs text-slate-500 mt-1">
                {wardNumber || currentUser.ward_number || 'Ward 25'} · {houseFlat || currentUser.house_flat_number}, {streetColony || currentUser.street_colony}
              </p>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100">
              Present this QR to the municipal waste collection driver during morning rounds for instant digital weighment &amp; points credit.
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
