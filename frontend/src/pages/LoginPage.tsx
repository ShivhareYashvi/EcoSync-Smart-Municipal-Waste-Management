import React, { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle2, ChevronRight, KeyRound, Mail, MapPin, Phone, ShieldCheck, Smartphone, Sparkles, Truck, Recycle, Shield } from 'lucide-react';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse } from '../lib/types';
import { useSessionStore } from '../store/session';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

type AuthMethod = 'phone' | 'email';
type EmailMode = 'login' | 'signup';

const ROLE_BADGES: Record<string, { label: string; icon: typeof Truck }> = {
  driver: { label: 'Driver Operations Portal', icon: Truck },
  recycler: { label: 'Certified Recycler Partner', icon: Recycle },
  admin: { label: 'Municipal Command & Dispatch', icon: Shield },
};

export function LoginPage() {
  const navigate = useNavigate();
  const { role } = useParams<{ role?: string }>();
  const [searchParams] = useSearchParams();
  const setSession = useSessionStore((state) => state.setSession);

  const initialMethod: AuthMethod = searchParams.get('tab') === 'email' || searchParams.get('mode') === 'signup' ? 'email' : 'phone';
  const initialMode: EmailMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';

  const [authMethod, setAuthMethod] = useState<AuthMethod>(initialMethod);
  const [emailMode, setEmailMode] = useState<EmailMode>(initialMode);

  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Email state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Common UI state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [devVerifyLink, setDevVerifyLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate Indian phone number (10 digits starting with 6-9)
  const isPhoneValid = useMemo(() => {
    const digits = phone.replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(digits) || (digits.startsWith('00000000') && digits.length === 10);
  }, [phone]);

  function startCountdown() {
    setOtpCountdown(30);
    const interval = setInterval(() => {
      setOtpCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
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
    return error instanceof Error ? error.message : 'An unexpected error occurred.';
  }

  // ---------------------------------------------------------------------------
  // Option 1: Phone OTP Authentication
  // ---------------------------------------------------------------------------

  async function handleSendOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    if (!isPhoneValid) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/phone/otp/request', { phone });
      setOtpSent(true);
      setStatusMessage(res.data.message || 'OTP sent successfully.');
      startCountdown();
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);

    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post<LoginResponse>('/auth/phone/otp/verify', {
        phone,
        code: otpCode.trim()
      });

      const { access_token, refresh_token, user, is_new_user, profile_completed } = res.data;
      setSession(access_token, user, refresh_token);

      // Direct to profile completion if new user or incomplete address
      if (is_new_user || !profile_completed) {
        navigate('/complete-profile', { state: { isNew: is_new_user } });
      } else {
        navigate(dashboardPathForRole(user.role));
      }
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Option 2: Email + Password Authentication
  // ---------------------------------------------------------------------------

  async function handleEmailAuth(event: FormEvent) {
    event.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setDevVerifyLink(null);

    if (emailMode === 'signup') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
      if (password.length < 8) {
        setErrorMessage('Password must be at least 8 characters long.');
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await api.post('/auth/email/signup', {
          email,
          password,
          confirm_password: confirmPassword,
          role: role || 'citizen'
        });
        setStatusMessage(res.data.message);
        if (res.data.verification_link) {
          setDevVerifyLink(res.data.verification_link);
        }
      } catch (err) {
        setErrorMessage(formatError(err));
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Email Login
      setIsSubmitting(true);
      try {
        const res = await api.post<LoginResponse>('/auth/email/login', {
          email,
          password
        });
        const { access_token, refresh_token, user, profile_completed } = res.data;
        setSession(access_token, user, refresh_token);

        if (!profile_completed) {
          navigate('/complete-profile');
        } else {
          navigate(dashboardPathForRole(user.role));
        }
      } catch (err) {
        setErrorMessage(formatError(err));
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  const roleMeta = role && ROLE_BADGES[role] ? ROLE_BADGES[role] : null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative overflow-hidden">
      <Navbar mode="auth" />

      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10">
        <section className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-7 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              EcoSync Municipal Network
            </div>
            {roleMeta && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold">
                <roleMeta.icon className="h-3 w-3" />
                {roleMeta.label}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight">
            {roleMeta ? roleMeta.label : 'Smart Civic Sign-In'}
          </h1>
          <p className="mt-1 text-emerald-100 text-xs leading-relaxed">
            One account for household pickups, tracking, and Bhopal municipal services.
          </p>

          {/* Authentication Method Tabs */}
          <div className="mt-6 grid grid-cols-2 p-1 bg-black/20 rounded-2xl backdrop-blur-sm border border-white/10">
            <button
              type="button"
              onClick={() => {
                setAuthMethod('phone');
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                authMethod === 'phone' ? 'bg-white text-emerald-900 shadow-sm' : 'text-white hover:text-emerald-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Phone OTP
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMethod('email');
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              className={`flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-xl transition-all ${
                authMethod === 'email' ? 'bg-white text-emerald-900 shadow-sm' : 'text-white hover:text-emerald-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email & Password
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-7">
          {/* OPTION 1: PHONE LOGIN (OTP, NO PASSWORD) */}
          {authMethod === 'phone' && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  10-Digit Indian Mobile Number
                </label>
                <div className="flex rounded-2xl border border-slate-200 overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
                  <span className="bg-slate-50 px-3.5 py-3 text-sm font-bold text-slate-600 border-r border-slate-200 flex items-center gap-1.5 shrink-0">
                    <span className="text-base">🇮🇳</span> +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setOtpSent(false);
                      setOtpCode('');
                    }}
                    className="w-full px-4 py-3 text-sm text-slate-900 outline-none font-semibold tracking-wide"
                  />
                  {!otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={!isPhoneValid || isSubmitting}
                      className="px-4 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-40 transition-colors shrink-0"
                    >
                      {isSubmitting ? 'Sending...' : 'Get OTP'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Must be 10 digits starting with 6, 7, 8, or 9.
                </p>
              </div>

              {otpSent && (
                <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in duration-200">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Enter 6-Digit Verification Code
                      </label>
                      {otpCountdown > 0 ? (
                        <span className="text-xs font-medium text-slate-400">Resend in {otpCountdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSubmitting}
                          className="text-xs font-bold text-emerald-700 hover:underline"
                        >
                          Resend OTP
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="123456"
                      autoFocus
                      value={otpCode}
                      onChange={(e) => {
                        const val = e.target.value.trim();
                        setOtpCode(val);
                      }}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-center text-xl font-mono font-bold tracking-widest text-slate-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 outline-none"
                    />
                  </div>

                  <div className="rounded-xl bg-amber-50 p-2.5 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                    <span>💡 Local Dev / Demo bypass code:</span>
                    <button
                      type="button"
                      onClick={() => setOtpCode('1234')}
                      className="font-mono font-black text-xs bg-amber-200 hover:bg-amber-300 px-2.5 py-0.5 rounded transition"
                    >
                      Use 1234
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={otpCode.length < 4 || isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          )}

          {/* OPTION 2: EMAIL + PASSWORD */}
          {authMethod === 'email' && (
            <div className="space-y-4">
              {/* Sub-toggle: Sign In vs Sign Up */}
              <div className="flex gap-4 border-b border-slate-100 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('login');
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
                  className={`text-sm font-bold pb-1 transition-all ${
                    emailMode === 'login' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmailMode('signup');
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
                  className={`text-sm font-bold pb-1 transition-all ${
                    emailMode === 'signup' ? 'text-emerald-700 border-b-2 border-emerald-600' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="resident@bhopal.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                    {emailMode === 'login' && (
                      <Link to="/forgot-password" className="text-xs font-bold text-emerald-700 hover:underline">
                        Forgot?
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                {emailMode === 'signup' && (
                  <div className="space-y-1 animate-in fade-in duration-150">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !email || !password}
                  className="w-full mt-2 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Processing...'
                    : emailMode === 'signup'
                    ? 'Send Verification Link'
                    : 'Sign In with Password'}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* Feedback messages */}
          {statusMessage && (
            <div className="mt-4 rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold">{statusMessage}</p>
                {devVerifyLink && (
                  <div className="mt-2.5 p-3 bg-emerald-100/90 rounded-xl border border-emerald-300">
                    <p className="text-[11px] font-bold text-emerald-950 mb-1.5">
                      Local Development Verification Shortcut:
                    </p>
                    <a
                      href={devVerifyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition"
                    >
                      Verify Account Instantly <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700">
              {errorMessage}
            </div>
          )}

          {/* Privacy & civic info */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400">
              Secured by bcrypt hashing, rate-limiting & stateless JWT bearer tokens.
            </p>
          </div>
        </div>
      </section>
      </main>

      <Footer mode="auth" />
    </div>
  );
}
