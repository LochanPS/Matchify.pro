import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { formatDateIndian } from '../utils/dateFormat';
import { X, Users, Mail, Phone, MapPin, Trophy, Trash2, Edit3, AlertTriangle } from 'lucide-react';
import { getTournamentDrafts, deleteTournamentDraft } from '../hooks/useTournamentForm';
import VerifiedBadge from '../components/VerifiedBadge';
import {
  TrophyIcon,
  BoltIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  PlusIcon,
  ClipboardDocumentListIcon,
  ArrowRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

export default function OrganizerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [stats, setStats] = useState({ totalTournaments: 0, activeTournaments: 0, totalParticipants: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [allParticipants, setAllParticipants] = useState([]);
  const [deleteDraftModal, setDeleteDraftModal] = useState(null);
  const [playerCode, setPlayerCode] = useState(null);
  const [umpireCode, setUmpireCode] = useState(null);

  useEffect(() => { fetchOrganizerData(); loadDrafts(); fetchUserCodes(); }, []);

  const fetchUserCodes = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user) {
        setPlayerCode(response.data.user.playerCode);
        setUmpireCode(response.data.user.umpireCode);
      }
    } catch (error) {
      console.error('Error fetching user codes:', error);
    }
  };

  const loadDrafts = () => setDrafts(getTournamentDrafts());
  const handleDeleteDraft = (draftId) => { deleteTournamentDraft(draftId); loadDrafts(); setDeleteDraftModal(null); };
  const handleContinueDraft = (draftId) => navigate(`/tournaments/create?draft=${draftId}`);

  const fetchOrganizerData = async () => {
    try {
      const dashboardRes = await api.get('/organizer/dashboard');
      const dashboardData = dashboardRes.data.data;
      const tournamentsRes = await api.get('/tournaments');
      const organizerTournaments = tournamentsRes.data.tournaments.filter(t => t.organizerId === user.id);
      setTournaments(organizerTournaments);
      setAllParticipants(dashboardData.recent_registrations || []);
      setStats({
        totalTournaments: dashboardData.total_tournaments || organizerTournaments.length,
        activeTournaments: dashboardData.tournaments_by_status?.ongoing || 0,
        totalParticipants: dashboardData.total_registrations || 0,
        revenue: dashboardData.revenue?.total || 0
      });
    } catch (error) {
      try {
        const tournamentsRes = await api.get('/tournaments');
        const organizerTournaments = tournamentsRes.data.tournaments.filter(t => t.organizerId === user.id);
        setTournaments(organizerTournaments);
        setStats({ totalTournaments: organizerTournaments.length, activeTournaments: organizerTournaments.filter(t => t.status === 'ongoing').length, totalParticipants: organizerTournaments.reduce((sum, t) => sum + (t._count?.registrations || 0), 0), revenue: 0 });
      } catch (e) { console.error('Fallback failed:', e); }
    } finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Total Tournaments', value: stats.totalTournaments, icon: TrophyIcon, color: 'from-blue-500 to-indigo-600' },
    { label: 'Active Tournaments', value: stats.activeTournaments, icon: BoltIcon, color: 'from-green-500 to-emerald-600' },
    { label: 'Total Participants', value: stats.totalParticipants, icon: UserGroupIcon, color: 'from-purple-500 to-violet-600', clickable: true, onClick: () => setShowParticipantsModal(true) },
    { label: 'Revenue', value: `₹${stats.revenue}`, icon: CurrencyRupeeIcon, color: 'from-amber-500 to-orange-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-indigo-500/30">
                  {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" /> : user?.name?.charAt(0)?.toUpperCase() || 'O'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center"><span className="text-white text-sm">📋</span></div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">Organizer Dashboard</h1>
                  {user?.isVerifiedOrganizer && (
                    <VerifiedBadge type="organizer" size="lg" />
                  )}
                </div>
                <p className="text-white/60">Welcome back, {user?.name}!</p>
                <p className="text-white/40 text-sm mt-1">{user?.email}</p>
              </div>
            </div>
            <Link
              to="/tournaments/create"
              className="px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-green-500/50"
            >
              <PlusIcon className="w-5 h-5" />Create Tournament
            </Link>
            <Link
              to="/organizer/profile"
              className="px-6 py-3 rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2 font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-blue-500/50"
            >
              View Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* My Codes Section */}
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 backdrop-blur-sm border border-indigo-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-lg">🎫</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">My Codes</h3>
              <p className="text-indigo-300 text-sm">Share these codes for registration and assignments</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Code */}
            {playerCode && (
              <div className="bg-slate-800/50 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-blue-400/80 text-sm font-medium">Player Code</span>
                  <span className="text-xs text-gray-400">For partner registration</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-blue-400 font-mono font-bold text-2xl tracking-wider flex-1">{playerCode}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(playerCode)}
                    className="p-2 hover:bg-blue-500/20 rounded-lg transition-colors"
                    title="Copy player code"
                  >
                    <svg className="w-5 h-5 text-blue-400/60 hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {/* Umpire Code */}
            {umpireCode && (
              <div className="bg-slate-800/50 border border-amber-500/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-amber-400/80 text-sm font-medium">Umpire Code</span>
                  <span className="text-xs text-gray-400">For umpire assignments</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-amber-400 font-mono font-bold text-2xl tracking-wider flex-1">{umpireCode}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(umpireCode)}
                    className="p-2 hover:bg-amber-500/20 rounded-lg transition-colors"
                    title="Copy umpire code"
                  >
                    <svg className="w-5 h-5 text-amber-400/60 hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} onClick={stat.onClick} className={`bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 ${stat.clickable ? 'cursor-pointer' : ''}`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
              {stat.clickable && <p className="text-xs text-purple-400 mt-2">Click to view details</p>}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              to="/tournaments/create"
              className="flex items-center gap-4 p-4 rounded-xl border transition-all group bg-slate-700/30 border-white/5 hover:border-blue-500/50"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Create Tournament</p>
                <p className="text-sm text-gray-400">Start a new tournament</p>
              </div>
              <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
            </Link>
            <Link to="/organizer/history" className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-green-500/50 transition-all group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><ClipboardDocumentListIcon className="w-6 h-6 text-white" /></div>
              <div className="flex-1"><p className="font-semibold text-white">Manage Tournaments</p><p className="text-sm text-gray-400">View and edit your tournaments</p></div>
              <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
            </Link>
            <div onClick={() => setShowParticipantsModal(true)} className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-purple-500/50 transition-all group cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"><UserGroupIcon className="w-6 h-6 text-white" /></div>
              <div className="flex-1"><p className="font-semibold text-white">View Participants</p><p className="text-sm text-gray-400">See all registered players</p></div>
              <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
            </div>
          </div>
        </div>

        {/* Tournament Drafts */}
        {drafts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center"><span className="text-white">📝</span></div>
                <div><h2 className="text-lg font-bold text-white">Saved Drafts</h2><p className="text-sm text-amber-400">Continue creating your tournaments</p></div>
                <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-semibold border border-amber-500/30">{drafts.length}</span>
              </div>
            </div>
            <div className="space-y-3">
              {drafts.map((draft) => (
                <div key={draft.id} className="bg-slate-800/50 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-amber-500/50 transition-all">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{draft.formData?.name || 'Untitled Tournament'}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                      <span className="bg-slate-700 px-2 py-0.5 rounded">Step {draft.currentStep || 1} of 6</span>
                      <span>{draft.completedSteps?.length || 0} steps completed</span>
                      {draft.formData?.city && <span>📍 {draft.formData.city}</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Last edited: {new Date(draft.updatedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleContinueDraft(draft.id)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"><Edit3 className="w-4 h-4" />Continue</button>
                    <button onClick={() => setDeleteDraftModal({ draftId: draft.id, draftName: draft.formData?.name || 'Untitled Tournament' })} className="p-2 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors" title="Delete draft"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tournaments */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center"><CalendarIcon className="w-5 h-5 text-white" /></div>
              <h3 className="text-lg font-bold text-white">Recent Tournaments</h3>
            </div>
            <Link to="/organizer/history" className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1">View All<ArrowRightIcon className="w-4 h-4" /></Link>
          </div>
          <div className="p-6">
            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><span className="text-4xl">🏆</span></div>
                <h4 className="text-lg font-semibold text-white mb-2">No tournaments yet</h4>
                <p className="text-gray-400 mb-6">Create your first tournament and start hosting!</p>
                <Link to="/tournaments/create" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"><PlusIcon className="w-5 h-5" />Create Your First Tournament</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.slice(0, 5).map((tournament) => (
                  <div key={tournament.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center"><span className="text-xl">🏆</span></div>
                      <div>
                        <p className="font-semibold text-white">{tournament.name}</p>
                        <p className="text-sm text-gray-400">{tournament.city}, {tournament.state} • {formatDateIndian(tournament.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link to={`/organizer/tournaments/${tournament.id}`} className="text-purple-400 hover:text-purple-300 text-sm">{tournament._count?.registrations || 0} participants</Link>
                      <StatusBadge status={tournament.status} />
                      <div className="flex gap-2">
                        <Link to={`/tournaments/${tournament.id}`} className="px-3 py-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg text-sm font-medium transition-colors">View</Link>
                        <Link to={`/organizer/tournaments/${tournament.id}`} className="px-3 py-1.5 text-green-400 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors">Manage</Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showParticipantsModal && <ParticipantsModal participants={allParticipants} totalRevenue={stats.revenue} onClose={() => setShowParticipantsModal(false)} />}
      
      {deleteDraftModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setDeleteDraftModal(null)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30"><AlertTriangle className="w-8 h-8 text-white" /></div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Draft?</h3>
              <p className="text-gray-400 mb-4">Are you sure you want to delete "<span className="font-semibold text-red-400">{deleteDraftModal.draftName}</span>"?</p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-left">
                <p className="text-sm text-red-400"><strong>⚠️ Warning:</strong></p>
                <ul className="text-sm text-red-300 mt-2 space-y-1"><li>• This action cannot be undone</li><li>• All draft data will be permanently deleted</li></ul>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/10">
              <button onClick={() => setDeleteDraftModal(null)} className="flex-1 py-3 px-4 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition-colors font-medium">Cancel</button>
              <button onClick={() => handleDeleteDraft(deleteDraftModal.draftId)} className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all font-semibold flex items-center justify-center gap-2"><Trash2 className="w-5 h-5" />Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


const StatusBadge = ({ status }) => {
  const styles = {
    published: 'bg-green-500/20 text-green-400 border-green-500/30',
    draft: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    ongoing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  };
  return <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.draft}`}>{status?.charAt(0).toUpperCase() + status?.slice(1)}</span>;
};

const ParticipantsModal = ({ participants, totalRevenue, onClose }) => {
  const groupedByPlayer = participants.reduce((acc, reg) => {
    const key = reg.player_email;
    if (!acc[key]) { acc[key] = { player_name: reg.player_name, player_email: reg.player_email, player_phone: reg.player_phone, player_city: reg.player_city, player_state: reg.player_state, registrations: [] }; }
    acc[key].registrations.push(reg);
    return acc;
  }, {});
  const uniquePlayers = Object.values(groupedByPlayer);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-white/10 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center"><Users className="w-6 h-6 text-white" /></div>
            <div><h2 className="text-xl font-bold text-white">All Participants</h2><p className="text-sm text-gray-400">{uniquePlayers.length} unique players • {participants.length} total registrations</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {uniquePlayers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4"><Users className="w-10 h-10 text-gray-500" /></div>
              <p className="text-gray-400 text-lg font-medium">No participants yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniquePlayers.map((player, index) => {
                const totalAmount = player.registrations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
                const allPaid = player.registrations.every(r => r.payment_status === 'completed');
                return (
                  <div key={player.player_email || index} className="bg-slate-700/30 border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">{player.player_name?.charAt(0)?.toUpperCase() || 'P'}</div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{player.player_name}</h3>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm text-gray-400"><Mail className="w-4 h-4" />{player.player_email}</div>
                            {player.player_phone && <div className="flex items-center gap-2 text-sm text-gray-400"><Phone className="w-4 h-4" />{player.player_phone}</div>}
                            {(player.player_city || player.player_state) && <div className="flex items-center gap-2 text-sm text-gray-400"><MapPin className="w-4 h-4" />{[player.player_city, player.player_state].filter(Boolean).join(', ')}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${allPaid ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>{allPaid ? '✓ All Paid' : 'Pending'}</span>
                        <p className="text-xl font-bold text-emerald-400 mt-2">₹{totalAmount}</p>
                        <p className="text-xs text-gray-500">{player.registrations.length} {player.registrations.length === 1 ? 'category' : 'categories'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/5">
                      <div className="flex flex-wrap gap-2">
                        {player.registrations.map((reg, regIndex) => (
                          <div key={regIndex} className="flex items-center gap-2 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2">
                            <span className="inline-flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-medium"><Trophy className="w-3 h-3" />{reg.tournament_name}</span>
                            <span className="bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded text-xs font-medium">{reg.category_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${reg.payment_status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{reg.payment_status === 'completed' ? '✓ Paid' : 'Pending'}</span>
                            <span className="text-sm font-bold text-gray-300">₹{reg.amount_paid}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-6 border-t border-white/10 bg-emerald-500/10">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Total Revenue</span>
            <span className="text-3xl font-bold text-emerald-400">₹{totalRevenue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
