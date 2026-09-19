import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  Shield,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  Society,
  SocietyDashboard,
  SocietyMembership,
  User,
} from '../../lib/types';

interface SocietyDashboardViewProps {
  currentUser?: User | null;
}

export const SocietyDashboardView: React.FC<SocietyDashboardViewProps> = ({ currentUser }) => {
  const [myMemberships, setMyMemberships] = useState<SocietyMembership[]>([]);
  const [availableSocieties, setAvailableSocieties] = useState<Society[]>([]);
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [dashboard, setDashboard] = useState<SocietyDashboard | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingDashboard, setLoadingDashboard] = useState<boolean>(false);

  // Modal for registering new society
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [newZoneId, setNewZoneId] = useState<number>(currentUser?.zone_id || 1);
  const [newDocPath, setNewDocPath] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load user memberships and available societies
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [membershipsRes, societiesRes] = await Promise.all([
        api.get<SocietyMembership[]>('/societies/me'),
        api.get<Society[]>('/societies'),
      ]);
      setMyMemberships(membershipsRes.data);
      setAvailableSocieties(societiesRes.data);

      if (membershipsRes.data.length > 0) {
        setSelectedSocietyId(membershipsRes.data[0].society_id);
      } else if (societiesRes.data.length > 0) {
        setSelectedSocietyId(societiesRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load societies data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch dashboard whenever selectedSocietyId changes
  useEffect(() => {
    if (!selectedSocietyId) return;
    const fetchDashboard = async () => {
      setLoadingDashboard(true);
      try {
        const res = await api.get<SocietyDashboard>(`/societies/${selectedSocietyId}/dashboard`);
        setDashboard(res.data);
      } catch (err: any) {
        // If 403 (e.g. citizen hasn't joined yet), set dashboard to null
        setDashboard(null);
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, [selectedSocietyId]);

  const handleJoinSociety = async (societyId: number) => {
    try {
      await api.post(`/societies/${societyId}/join`);
      setActionMessage('Successfully joined the housing society!');
      setTimeout(() => setActionMessage(null), 3500);
      loadInitialData();
    } catch (err) {
      console.error('Failed to join society:', err);
    }
  };

  const handleRegisterSociety = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAddress.trim()) return;
    setIsSubmitting(true);
    try {
      await api.post('/societies', {
        name: newName.trim(),
        address: newAddress.trim(),
        zone_id: newZoneId,
        registration_doc_path: newDocPath.trim() || null,
      });
      setShowRegisterModal(false);
      setNewName('');
      setNewAddress('');
      setNewDocPath('');
      setActionMessage('Society registered! Your RWA Admin application has been submitted to the municipal authority.');
      setTimeout(() => setActionMessage(null), 5000);
      loadInitialData();
    } catch (err) {
      console.error('Failed to register society:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
        <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
        <p className="text-xs font-medium">Loading housing society hub...</p>
      </div>
    );
  }

  const activeMembership = myMemberships.find((m) => m.society_id === selectedSocietyId);
  const isPendingAdmin = activeMembership?.role === 'rwa_admin' && activeMembership?.status === 'pending';

  return (
    <div className="space-y-6">
      {/* Top Banner with Actions */}
      <div className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-2xl p-6 text-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5" />
            Zero-Leakage Resident Privacy
          </div>
          <h2 className="text-2xl font-bold tracking-tight">RWA &amp; Housing Society Hub</h2>
          <p className="text-teal-100 text-xs leading-relaxed">
            Collaborate with your residential community. Society statistics are aggregated strictly at the community level.
            Individual household data, low scores, or disputes are never revealed.
          </p>
        </div>

        <button
          onClick={() => setShowRegisterModal(true)}
          className="px-4 py-2.5 bg-white text-emerald-900 font-semibold rounded-xl text-xs flex items-center gap-2 hover:bg-emerald-50 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 text-emerald-700" />
          Register Society / RWA
        </button>
      </div>

      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          {actionMessage}
        </div>
      )}

      {/* Society Selector & Status Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Selected Housing Society
            </label>
            <select
              value={selectedSocietyId || ''}
              onChange={(e) => setSelectedSocietyId(Number(e.target.value))}
              className="block w-full sm:w-80 px-3.5 py-2 text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {availableSocieties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Zone #{s.zone_id})
                </option>
              ))}
            </select>
          </div>

          {/* Membership Status Badge */}
          <div className="flex items-center gap-2">
            {activeMembership ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  {activeMembership.role === 'rwa_admin' ? 'RWA Admin' : 'Active Resident'}
                  {isPendingAdmin && ' (Verification Pending)'}
                </span>
              </div>
            ) : selectedSocietyId ? (
              <button
                onClick={() => handleJoinSociety(selectedSocietyId)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Join This Society
              </button>
            ) : null}
          </div>
        </div>

        {isPendingAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">RWA Admin Verification in Progress</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                The municipal administration is verifying your society documentation. Once approved, you will have official RWA administrative oversight.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard View Content */}
      {loadingDashboard ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400">
          <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-2 text-emerald-600" />
          <p className="text-xs">Computing aggregated community metrics...</p>
        </div>
      ) : !activeMembership && currentUser?.role !== 'admin' ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-3">
          <Building className="w-10 h-10 mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-900 text-sm">Resident Membership Required</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            To safeguard resident privacy and maintain verified community aggregation, you must join this housing society to access the community dashboard.
          </p>
          {selectedSocietyId && (
            <button
              onClick={() => handleJoinSociety(selectedSocietyId)}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700"
            >
              Join Society Now
            </button>
          )}
        </div>
      ) : dashboard ? (
        <div className="space-y-6">
          {/* Privacy Suppression Warning Card if active members < 3 */}
          {dashboard.privacy_suppressed ? (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <Lock className="w-5 h-5 text-amber-600" />
                Aggregated Metrics Temporarily Protected (k-Anonymity)
              </div>
              <p className="text-xs text-amber-950 leading-relaxed max-w-3xl">
                {dashboard.message || 'Aggregate statistics require a minimum of 3 active households to safeguard resident privacy.'}
              </p>
              <div className="bg-amber-100/60 rounded-xl p-3 text-[11px] text-amber-900 space-y-1">
                <p className="font-semibold">Why is this boundary enforced?</p>
                <p>
                  When a society has only 1 or 2 households, an RWA administrator or neighbour could easily deduce the exact compliance score of the other resident. EcoSync strictly suppresses all metric calculations until at least 3 households participate.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-4 text-xs font-medium text-amber-800">
                <span>Current Active Households: <strong>{dashboard.active_members}</strong></span>
                <span>Required for Disclosure: <strong>3</strong></span>
              </div>
            </div>
          ) : (
            /* Full Community Metrics Grid */
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Avg Compliance */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Average Compliance
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {dashboard.average_compliance}%
                  </div>
                  <p className="text-[11px] text-gray-400">Rolling 90-day community rate</p>
                </div>

                {/* Metric 2: Verified Pickups */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Verified Pickups
                  </div>
                  <div className="text-2xl font-black text-gray-900">
                    {dashboard.total_verified_pickups}
                  </div>
                  <p className="text-[11px] text-gray-400">Driver &amp; photo confirmed</p>
                </div>

                {/* Metric 3: Collective Points */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Collective Points
                  </div>
                  <div className="text-2xl font-black text-emerald-700">
                    {dashboard.total_points_earned} pts
                  </div>
                  <p className="text-[11px] text-gray-400">Earned by all residents</p>
                </div>

                {/* Metric 4: Zone Rank */}
                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-1">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zone #{dashboard.zone_id} Rank
                  </div>
                  <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    #{dashboard.zone_rank || 1}
                  </div>
                  <p className="text-[11px] text-gray-400">Among verified zone societies</p>
                </div>
              </div>

              {/* Privacy Guarantee Footer Note */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-xs text-gray-500 flex items-center gap-3">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0" />
                <p>
                  <strong>EcoSync Privacy Standard:</strong> These totals represent collective mathematical aggregates.
                  No individual resident names, flat numbers, or individual pickup scores are stored or accessible through society reports.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Modal: Register Housing Society */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-base">Register Housing Society</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterSociety} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-gray-700">Society / Apartment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Meadows Residents Welfare Association"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-700">Full Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Plot No, Sector, Main Road, City"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-700">Municipal Zone ID *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={newZoneId}
                  onChange={(e) => setNewZoneId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-gray-700">Registration Document Path / URL (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. /uploads/rwa_certificate.pdf"
                  value={newDocPath}
                  onChange={(e) => setNewDocPath(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400">
                  Municipal authority requires verified RWA registration to unlock official admin verification.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  {isSubmitting ? 'Registering...' : 'Register & Apply'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
