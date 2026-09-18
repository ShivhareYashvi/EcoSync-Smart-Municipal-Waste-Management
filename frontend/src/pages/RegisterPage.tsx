import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse, OTPResponse, UploadResponse, UserRole } from '../lib/types';
import type { Zone } from '../lib/types';
import { useSessionStore } from '../store/session';

type RegisterForm = {
  name: string;
  phone: string;
  email: string;
  password: string;
  address: string;
  role: UserRole;
  vehicle_number: string;
  zone_id: string;
  business_name: string;
  materials_accepted: string[];
};

const initialForm: RegisterForm = {
  name: '',
  phone: '',
  email: '',
  password: '',
  address: '',
  role: 'citizen',
  vehicle_number: '',
  zone_id: '',
  business_name: '',
  materials_accepted: ['plastic', 'paper']
};

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);
  const [form, setForm] = useState<RegisterForm>(initialForm);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPath, setBillPath] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPath, setDocPath] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpResponse, setOtpResponse] = useState<OTPResponse | null>(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);

  // Fetch zones for the ward selector
  useEffect(() => {
    api.get<Zone[]>('/zones').then((r) => setZones(r.data)).catch(() => {/* zones optional */});
  }, []);

  const canRegister = useMemo(() => otpVerified && !isBusy && verifiedPhone === form.phone, [form.phone, isBusy, otpVerified, verifiedPhone]);

  function updateField<K extends keyof RegisterForm>(field: K, value: RegisterForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'phone') {
      setOtpVerified(false);
      setVerifiedPhone(null);
      setOtpResponse(null);
      setOtpCode('');
    }
  }

  async function uploadBillIfNeeded(): Promise<string | null> {
    if (!billFile || billPath) {
      return billPath;
    }
    const data = new FormData();
    data.append('file', billFile);
    const response = await api.post<UploadResponse>('/uploads/electricity-bills', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setBillPath(response.data.public_url);
    return response.data.public_url;
  }

  async function uploadDocIfNeeded(): Promise<string | null> {
    if (!docFile || docPath) {
      return docPath;
    }
    const data = new FormData();
    data.append('file', docFile);
    const response = await api.post<UploadResponse>('/uploads/verification-docs', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    setDocPath(response.data.public_url);
    return response.data.public_url;
  }

  async function handleRequestOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    setOtpVerified(false);
    setVerifiedPhone(null);
    setIsBusy(true);
    try {
      const response = await api.post<OTPResponse>('/auth/otp/request', { phone: form.phone });
      setOtpResponse(response.data);
      setStatusMessage(response.data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to request OTP.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleVerifyOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const response = await api.post<OTPResponse>('/auth/otp/verify', { phone: form.phone, code: otpCode });
      setOtpVerified(true);
      setVerifiedPhone(form.phone);
      setStatusMessage(response.data.message);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'OTP verification failed.');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpVerified) {
      setErrorMessage('Verify the OTP before creating the account.');
      return;
    }
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);
    try {
      const electricity_bill_path = form.role === 'citizen' ? await uploadBillIfNeeded() : null;
      const verification_doc_url = form.role === 'recycler' ? await uploadDocIfNeeded() : null;
      await api.post('/auth/register', {
        ...form,
        email: form.email || null,
        vehicle_number: form.role === 'driver' ? form.vehicle_number : null,
        business_name: form.role === 'recycler' ? form.business_name : null,
        materials_accepted: form.role === 'recycler' ? form.materials_accepted : null,
        service_zone_ids: form.role === 'recycler' && form.zone_id ? [parseInt(form.zone_id)] : [],
        verification_doc_url,
        zone_id: form.zone_id ? parseInt(form.zone_id) : null,
        electricity_bill_path
      });
      const loginResponse = await api.post<LoginResponse>('/auth/login', {
        phone: form.phone,
        password: form.password
      });
      setSession(loginResponse.data.access_token, loginResponse.data.user);
      navigate(dashboardPathForRole(loginResponse.data.user.role));
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      setIsBusy(false);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setBillFile(file);
    setBillPath(null);
  }

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-10">
      <section className="glass-card mx-auto max-w-2xl rounded-[2rem] p-8">
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-emerald-600">Household verification</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Register for smart waste pickups</h1>
        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Full name" value={form.name} onChange={(event) => updateField('name', event.target.value)} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" type="tel" placeholder="9876543210" value={form.phone} onChange={(event) => updateField('phone', event.target.value)} />
          <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Email" value={form.email} onChange={(event) => updateField('email', event.target.value)} />
          <div className="relative">
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500"
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <select className="rounded-2xl border border-slate-200 px-4 py-3" value={form.role} onChange={(event) => updateField('role', event.target.value as UserRole)}>
            <option value="citizen">Citizen</option>
            <option value="driver">Driver</option>
            <option value="recycler">Recycler</option>
            <option value="admin">Admin</option>
          </select>
          {/* Zone selector */}
          {zones.length > 0 ? (
            <select
              id="register-zone"
              className="rounded-2xl border border-slate-200 px-4 py-3"
              value={form.zone_id}
              onChange={(event) => updateField('zone_id', event.target.value)}
            >
              <option value="">Select your ward / zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-3 text-sm text-slate-400">
              Zone selection not available (zones not yet seeded).
            </div>
          )}
          {form.role === 'driver' && (
            <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Vehicle number" value={form.vehicle_number} onChange={(event) => updateField('vehicle_number', event.target.value)} />
          )}
          {form.role === 'recycler' && (
            <div className="sm:col-span-2 space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <input
                className="w-full rounded-xl border border-slate-300 p-2.5 text-sm"
                placeholder="Registered Business / Scrap Facility Name *"
                required
                value={form.business_name}
                onChange={(e) => updateField('business_name', e.target.value)}
              />
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Accepted Recyclable Materials:
                </label>
                <div className="flex flex-wrap gap-3">
                  {['plastic', 'paper', 'metal', 'e_waste', 'glass'].map((mat) => (
                    <label key={mat} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.materials_accepted.includes(mat)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...form.materials_accepted, mat]
                            : form.materials_accepted.filter((m) => m !== mat);
                          updateField('materials_accepted', next);
                        }}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="capitalize">{mat.replace('_', '-')}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Municipal Trade License / Registration Doc (PDF or Image)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setDocFile(f);
                    setDocPath(null);
                  }}
                  className="text-xs"
                />
              </div>
            </div>
          )}
          <textarea className="rounded-2xl border border-slate-200 px-4 py-3 sm:col-span-2" placeholder="Facility / Household address" rows={3} value={form.address} onChange={(event) => updateField('address', event.target.value)} />
          {form.role === 'citizen' && (
            <label className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 sm:col-span-2">
              Electricity bill upload
              <input className="mt-2 block w-full text-sm font-normal" type="file" accept=".pdf,image/*" onChange={handleFileChange} />
              <span className="mt-2 block text-xs font-normal text-slate-500">{billFile ? billFile.name : billPath ? `Uploaded: ${billPath}` : 'PDF or image proof accepted.'}</span>
            </label>
          )}
          <div className="sm:col-span-2">
            <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <input className="rounded-2xl border border-slate-200 px-4 py-3" placeholder="Enter OTP" value={otpCode} onChange={(event) => setOtpCode(event.target.value)} />
              <button className="rounded-2xl bg-emerald-600 px-5 py-3 font-bold text-white" type="button" onClick={handleRequestOtp} disabled={!form.phone || isBusy}>
                Request OTP
              </button>
              <button className="rounded-2xl bg-slate-950 px-5 py-3 font-bold text-white" type="button" onClick={handleVerifyOtp} disabled={!otpCode || isBusy || !otpResponse}>
                Verify OTP
              </button>
            </div>
            {verifiedPhone && verifiedPhone !== form.phone ? (
              <p className="mt-2 text-xs text-rose-600">Phone changed after OTP verification. Request a new OTP for the updated number.</p>
            ) : null}
          </div>
          <button className="rounded-2xl bg-cyan-600 px-5 py-3 font-bold text-white sm:col-span-2 disabled:opacity-60" type="submit" disabled={!canRegister}>
            Complete registration
          </button>
        </form>
        {statusMessage ? <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{statusMessage}</p> : null}
        {errorMessage ? <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMessage}</p> : null}
        <p className="mt-2 text-xs text-slate-500">{otpResponse ? `Delivery channel: ${otpResponse.delivery_channel}` : 'Request an OTP to begin phone verification.'}</p>
        <p className="mt-6 text-sm text-slate-600">Already registered? <Link className="font-bold text-emerald-700" to="/login">Login</Link>.</p>
      </section>
    </main>
  );
}
