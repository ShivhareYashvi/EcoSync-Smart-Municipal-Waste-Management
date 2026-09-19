import React, { useEffect, useState } from 'react';
import {
  Building,
  CheckCircle,
  Clock,
  ExternalLink,
  FileText,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import type { SocietyMembership } from '../../lib/types';

export const RWAAdminApprovalQueue: React.FC = () => {
  const [pendingAdmins, setPendingAdmins] = useState<SocietyMembership[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get<SocietyMembership[]>('/societies/pending-admins');
      setPendingAdmins(res.data);
    } catch (err) {
      console.error('Failed to fetch pending RWA admins:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleVerify = async (membershipId: number, status: 'active' | 'rejected') => {
    setProcessingId(membershipId);
    try {
      await api.patch(`/societies/memberships/${membershipId}/verify`, { status });
      setFeedback(
        status === 'active'
          ? 'RWA Admin approved successfully!'
          : 'RWA Admin request rejected.'
      );
      setTimeout(() => setFeedback(null), 4000);
      fetchPending();
    } catch (err) {
      console.error('Failed to verify RWA admin:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            RWA Society Admin Verification Queue
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Review and verify apartment residents applying for RWA society administrative oversight.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {feedback}
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
          <p className="text-xs font-medium">Checking pending applications...</p>
        </div>
      ) : pendingAdmins.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-2">
          <UserCheck className="w-10 h-10 mx-auto text-emerald-500" />
          <p className="text-sm font-semibold text-gray-800">Queue is Clear</p>
          <p className="text-xs text-gray-400">No pending RWA Admin applications requiring municipal review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingAdmins.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold text-gray-900 text-sm">
                      {item.society_name || `Society #${item.society_id}`}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    Applicant: {item.user_name || `Resident #${item.user_id}`} ({item.user_email || 'No email'})
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </span>
              </div>

              {item.registration_doc_path && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="truncate max-w-[200px]">{item.registration_doc_path}</span>
                  </div>
                  <a
                    href={item.registration_doc_path}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="text-[11px] text-gray-400">
                Submitted on: {new Date(item.joined_at).toLocaleString()}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  onClick={() => handleVerify(item.id, 'active')}
                  disabled={processingId === item.id}
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve Admin
                </button>
                <button
                  onClick={() => handleVerify(item.id, 'rejected')}
                  disabled={processingId === item.id}
                  className="py-2 px-3 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
