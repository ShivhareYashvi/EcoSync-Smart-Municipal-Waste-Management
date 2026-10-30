import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from 'lucide-react';
import { api } from '../lib/api';
import { dashboardPathForRole } from '../lib/navigation';
import type { LoginResponse } from '../lib/types';
import { useSessionStore } from '../store/session';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setSession = useSessionStore((state) => state.setSession);

  const token = searchParams.get('token');
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage('No verification token provided. Please use the link sent to your email.');
      return;
    }

    async function verify() {
      try {
        const res = await api.post<LoginResponse>('/auth/email/verify', { token });
        const { access_token, refresh_token, user, profile_completed } = res.data;
        setSession(access_token, user, refresh_token);
        setSuccess(true);
        setLoading(false);

        // Redirect after 2 seconds
        setTimeout(() => {
          if (!profile_completed) {
            navigate('/complete-profile');
          } else {
            navigate(dashboardPathForRole(user.role));
          }
        }, 2000);
      } catch (err) {
        setLoading(false);
        if (axios.isAxiosError(err)) {
          setErrorMessage(err.response?.data?.detail || err.message);
        } else {
          setErrorMessage('Email verification failed. The link may have expired.');
        }
      }
    }

    verify();
  }, [token, navigate, setSession]);

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          {loading ? (
            <Loader2 className="w-8 h-8 animate-spin" />
          ) : success ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          ) : (
            <AlertCircle className="w-8 h-8 text-rose-600" />
          )}
        </div>

        <div>
          <h1 className="text-2xl font-black text-slate-900">
            {loading ? 'Verifying Your Email...' : success ? 'Email Verified!' : 'Verification Failed'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {loading
              ? 'Please wait while we confirm your municipal account credentials.'
              : success
              ? 'Your email has been verified. Redirecting you to your account setup...'
              : errorMessage}
          </p>
        </div>

        {!loading && !success && (
          <div className="pt-4">
            <Link
              to="/login"
              className="inline-flex py-3 px-6 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

