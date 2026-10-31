import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CheckCircle2, ChevronRight, KeyRound, Mail, Smartphone } from 'lucide-react';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse, OTPResponse } from '../lib/types';
import { useSessionStore } from '../store/session';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);

  const [mode, setMode] = useState<'email' | 'phone'>('email');

  // Email state
  const [email, setEmail] = useState('');

  // Phone state
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Common UI state
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function formatError(error: unknown): string {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === 'string') return detail;
      if (Array.isArray(detail) && detail.length > 0) {
        return detail.map((d: { msg?: string }) => d.msg || JSON.stringify(d)).join(', ');
      }
      return error.message;
    }
    return error instanceof Error ? error.message : 'Unable to process request.';
  }

  async function handleEmailReset(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      const res = await api.post('/auth/email/forgot-password', { email });
      setStatusMessage(res.data.message || 'If registered, password reset instructions have been sent to your email.');
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePhoneRequestOtp() {
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      const res = await api.post<OTPResponse>('/auth/forgot-password', { phone });
      setOtpSent(true);
      setStatusMessage(res.data.message);
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsBusy(false);
    }
  }

  async function handlePhoneReset(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatusMessage(null);
    setIsBusy(true);

    try {
      const res = await api.post<LoginResponse>('/auth/forgot-password/reset', {
        phone,
        code: otpCode.trim(),
        new_password: newPassword,
      });

      const { access_token, refresh_token, user } = res.data;
      setSession(access_token, user, refresh_token);
      navigate(dashboardPathForRole(user.role));
    } catch (err) {
      setErrorMessage(formatError(err));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between relative">
      <Navbar mode="auth" />
      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 relative z-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">Reset Your Password</h1>
          <p className="text-xs text-slate-500">
            Choose your preferred method to recover access to your municipal account.
          </p>

          {/* Mode Switcher */}
          <div className="mt-4 grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setMode('email');
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'email' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email Link
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('phone');
                setErrorMessage(null);
                setStatusMessage(null);
              }}
              className={`py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                mode === 'phone' ? 'bg-white text-emerald-900 shadow-sm' : 'text-slate-500'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              Mobile OTP
            </button>
          </div>
        </div>

        {/* Email Mode */}
        {mode === 'email' && (
          <form onSubmit={handleEmailReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Registered Email</label>
              <input
                type="email"
                required
                placeholder="resident@bhopal.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={isBusy || !email}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isBusy ? 'Sending Reset Link...' : 'Send Password Reset Link'}
              <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Phone OTP Mode */}
        {mode === 'phone' && (
          <form onSubmit={handlePhoneReset} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                10-Digit Mobile Number
              </label>
              <div className="flex rounded-2xl border border-slate-200 overflow-hidden focus-within:border-emerald-600">
                <span className="bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600 border-r border-slate-200">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-3 text-sm outline-none font-semibold"
                />
                <button
                  type="button"
                  onClick={handlePhoneRequestOtp}
                  disabled={isBusy || phone.length < 10}
                  className="px-3 bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  Send OTP
                </button>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">6-Digit OTP</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-center font-mono font-bold text-lg outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBusy || !otpCode || !newPassword}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isBusy ? 'Resetting...' : 'Verify OTP & Reset Password'}
                </button>
              </div>
            )}
          </form>
        )}

        {statusMessage && (
          <div className="rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-700">
            {errorMessage}
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
      </main>
      <Footer mode="auth" />
    </div>
  );
}
