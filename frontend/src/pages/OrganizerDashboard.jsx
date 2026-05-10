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
    { label: 'Total Tournaments', value: stats.totalTournaments, icon: TrophyIcon, gradient: 'linear-gradient(135deg,#00bcd4,#00d4ff)', glow: 'rgba(0,212,255,0.12)' },
    { label: 'Active Tournaments', value: stats.activeTournaments, icon: BoltIcon, gradient: 'linear-gradient(135deg,#00c853,#00ff88)', glow: 'rgba(0,255,136,0.12)' },
    { label: 'Total Participants', value: stats.totalParticipants, icon: UserGroupIcon, gradient: 'linear-gradient(135deg,#a855f7,#7c3aed)', glow: 'rgba(168,85,247,0.12)', clickable: true, onClick: () => setShowParticipantsModal(true) },
    { label: 'Revenue', value: `₹${stats.revenue}`, icon: CurrencyRupeeIcon, gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.12)' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#07071a' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'rgba(0,255,136,0.3)', borderTopColor: '#00ff88' }} />
          <p className="mt-4 font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#07071a' }}>
      {/* Background orbs */}
      <div className="fixed top-0 bottom-0 pointer-events-none overflow-hidden" style={{ left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: "480px" }}>
        <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-3xl opacity-[0.06]" style={{ background: '#a855f7' }} />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: '#00ff88' }} />
      </div>

      {/* Hero Header */}
      <div className="relative border-b" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-2xl"
                  style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)', boxShadow: '0 8px 25px rgba(168,85,247,0.3)', color: '#fff' }}>
                  {user?.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" /> : user?.name?.charAt(0)?.toUpperCase() || 'O'}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#a855f7' }}><span className="text-sm">📋</span></div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold text-white">Organizer Dashboard</h1>
                  {user?.isVerifiedOrganizer && <VerifiedBadge type="organizer" size="lg" />}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>Welcome back, {user?.name}!</p>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{user?.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/tournaments/create" className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)', color: '#003320' }}>
                <PlusIcon className="w-4 h-4" />Create Tournament
              </Link>
              <Link to="/organizer/profile" className="px-5 py-2.5 rounded-xl flex items-center gap-2 font-semibold text-sm border"
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)' }}>
                View Profile
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* My Codes Section */}
        <div className="rounded-2xl p-6 mb-8 border" style={{ background: 'rgba(168,85,247,0.06)', borderColor: 'rgba(168,85,247,0.2)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
              <span className="text-white text-lg">🎫</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">My Codes</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Share these codes for registration and assignments</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Code */}
            {playerCode && (
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(0,212,255,0.25)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'rgba(0,212,255,0.85)' }}>Player Code</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>For partner registration</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-2xl tracking-wider flex-1" style={{ color: '#00d4ff' }}>{playerCode}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(playerCode)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    title="Copy player code"
                  >
                    <svg className="w-5 h-5" style={{ color: 'rgba(0,212,255,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {/* Umpire Code */}
            {umpireCode && (
              <div className="rounded-xl p-4 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(251,191,36,0.25)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'rgba(251,191,36,0.85)' }}>Umpire Code</span>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>For umpire assignments</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-2xl tracking-wider flex-1" style={{ color: '#fbbf24' }}>{umpireCode}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(umpireCode)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ background: 'transparent' }}
                    title="Copy umpire code"
                  >
                    <svg className="w-5 h-5" style={{ color: 'rgba(251,191,36,0.6)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {statCards.map((stat, index) => (
            <div key={index} onClick={stat.onClick}
              className={`rounded-2xl p-4 sm:p-6 border transition-all duration-300 ${stat.clickable ? 'cursor-pointer' : ''}`}
              style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: `0 0 30px ${stat.glow}` }}>
              <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl shadow-lg mb-3 sm:mb-4"
                style={{ background: stat.gradient }}>
                <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-xs sm:text-sm mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{stat.label}</p>
              {stat.clickable && <p className="text-xs mt-2" style={{ color: '#a855f7' }}>Click to view details</p>}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl p-6 mb-8 border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/tournaments/create"
              className="flex items-center gap-4 p-4 rounded-xl border transition-all group"
              style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: 'linear-gradient(135deg,#00bcd4,#00d4ff)' }}>
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Create Tournament</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Start a new tournament</p>
              </div>
              <ArrowRightIcon className="w-5 h-5 transition-all" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </Link>
            <Link to="/organizer/history"
              className="flex items-center gap-4 p-4 rounded-xl border transition-all group"
              style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: 'linear-gradient(135deg,#00c853,#00ff88)' }}>
                <ClipboardDocumentListIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">Manage Tournaments</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>View and edit your tournaments</p>
              </div>
              <ArrowRightIcon className="w-5 h-5 transition-all" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </Link>
            <div onClick={() => setShowParticipantsModal(true)}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all group cursor-pointer"
              style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}>
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">View Participants</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>See all registered players</p>
              </div>
              <ArrowRightIcon className="w-5 h-5 transition-all" style={{ color: 'rgba(255,255,255,0.3)' }} />
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
                <div key={draft.id} className="rounded-xl p-4 flex items-center justify-between border transition-all"
                  style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{draft.formData?.name || 'Untitled Tournament'}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      <span className="px-2 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.08)' }}>Step {draft.currentStep || 1} of 6</span>
                      <span>{draft.completedSteps?.length || 0} steps completed</span>
                      {draft.formData?.city && <span>📍 {draft.formData.city}</span>}
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Last edited: {new Date(draft.updatedAt).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleContinueDraft(draft.id)} className="flex items-center gap-2 px-4 py-2 rounded-xl hover:shadow-lg transition-all text-sm font-medium text-white"
                      style={{ background: 'linear-gradient(135deg,#00bcd4,#00d4ff)', color: '#003330' }}><Edit3 className="w-4 h-4" />Continue</button>
                    <button onClick={() => setDeleteDraftModal({ draftId: draft.id, draftName: draft.formData?.name || 'Untitled Tournament' })} className="p-2 rounded-xl transition-colors" style={{ color: '#f87171' }} title="Delete draft"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Tournaments */}
        <div className="rounded-2xl overflow-hidden border" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="p-6 border-b flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00bcd4,#00d4ff)' }}><CalendarIcon className="w-5 h-5 text-white" /></div>
              <h3 className="text-lg font-bold text-white">Recent Tournaments</h3>
            </div>
            <Link to="/organizer/history" className="text-sm font-medium flex items-center gap-1" style={{ color: '#fbbf24' }}>View All<ArrowRightIcon className="w-4 h-4" /></Link>
          </div>
          <div className="p-6">
            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}><span className="text-4xl">🏆</span></div>
                <h4 className="text-lg font-semibold text-white mb-2">No tournaments yet</h4>
                <p className="mb-6" style={{ color: 'rgba(255,255,255,0.5)' }}>Create your first tournament and start hosting!</p>
                <Link to="/tournaments/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all text-white"
                  style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><PlusIcon className="w-5 h-5" />Create Your First Tournament</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {tournaments.slice(0, 5).map((tournament) => (
                  <div key={tournament.id} className="flex items-center justify-between p-4 rounded-xl border transition-all"
                    style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}><span className="text-xl">🏆</span></div>
                      <div>
                        <p className="font-semibold text-white">{tournament.name}</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{tournament.city}, {tournament.state} • {formatDateIndian(tournament.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Link to={`/organizer/tournaments/${tournament.id}`} className="text-sm" style={{ color: '#a855f7' }}>{tournament._count?.registrations || 0} participants</Link>
                      <StatusBadge status={tournament.status} />
                      <div className="flex gap-2">
                        <Link to={`/tournaments/${tournament.id}`} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" style={{ color: '#00d4ff' }}>View</Link>
                        <Link to={`/organizer/tournaments/${tournament.id}`} className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors" style={{ color: '#00ff88' }}>Manage</Link>
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
          <div className="rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg,#f87171,#e11d48)', boxShadow: '0 8px 25px rgba(239,68,68,0.3)' }}><AlertTriangle className="w-8 h-8 text-white" /></div>
              <h3 className="text-xl font-bold text-white mb-2">Delete Draft?</h3>
              <p className="mb-4" style={{ color: 'rgba(255,255,255,0.55)' }}>Are you sure you want to delete "<span className="font-semibold" style={{ color: '#f87171' }}>{deleteDraftModal.draftName}</span>"?</p>
              <div className="rounded-xl p-4 text-left border" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)' }}>
                <p className="text-sm" style={{ color: '#f87171' }}><strong>⚠️ Warning:</strong></p>
                <ul className="text-sm mt-2 space-y-1" style={{ color: 'rgba(252,165,165,0.85)' }}><li>• This action cannot be undone</li><li>• All draft data will be permanently deleted</li></ul>
              </div>
            </div>
            <div className="flex gap-3 p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <button onClick={() => setDeleteDraftModal(null)} className="flex-1 py-3 px-4 rounded-xl transition-colors font-medium" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>Cancel</button>
              <button onClick={() => handleDeleteDraft(deleteDraftModal.draftId)} className="flex-1 py-3 px-4 rounded-xl transition-all font-semibold flex items-center justify-center gap-2 text-white" style={{ background: 'linear-gradient(135deg,#f87171,#e11d48)' }}><Trash2 className="w-5 h-5" />Delete</button>
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
      <div className="rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden border" style={{ background: '#0d1025', borderColor: 'rgba(255,255,255,0.1)' }}>
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><Users className="w-6 h-6 text-white" /></div>
            <div><h2 className="text-xl font-bold text-white">All Participants</h2><p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>{uniquePlayers.length} unique players • {participants.length} total registrations</p></div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl transition-colors" style={{ color: 'rgba(255,255,255,0.5)' }}><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {uniquePlayers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.06)' }}><Users className="w-10 h-10" style={{ color: 'rgba(255,255,255,0.3)' }} /></div>
              <p className="text-lg font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>No participants yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {uniquePlayers.map((player, index) => {
                const totalAmount = player.registrations.reduce((sum, r) => sum + (r.amount_paid || 0), 0);
                const allPaid = player.registrations.every(r => r.payment_status === 'completed');
                return (
                  <div key={player.player_email || index} className="rounded-xl p-4 border transition-all" style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0" style={{ background: 'linear-gradient(135deg,#a855f7,#ec4899)' }}>{player.player_name?.charAt(0)?.toUpperCase() || 'P'}</div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{player.player_name}</h3>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}><Mail className="w-4 h-4" />{player.player_email}</div>
                            {player.player_phone && <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}><Phone className="w-4 h-4" />{player.player_phone}</div>}
                            {(player.player_city || player.player_state) && <div className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}><MapPin className="w-4 h-4" />{[player.player_city, player.player_state].filter(Boolean).join(', ')}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${allPaid ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>{allPaid ? '✓ All Paid' : 'Pending'}</span>
                        <p className="text-xl font-bold mt-2" style={{ color: '#00ff88' }}>₹{totalAmount}</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{player.registrations.length} {player.registrations.length === 1 ? 'category' : 'categories'}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <div className="flex flex-wrap gap-2">
                        {player.registrations.map((reg, regIndex) => (
                          <div key={regIndex} className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ background: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)' }}>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff' }}><Trophy className="w-3 h-3" />{reg.tournament_name}</span>
                            <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>{reg.category_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${reg.payment_status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>{reg.payment_status === 'completed' ? '✓ Paid' : 'Pending'}</span>
                            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.8)' }}>₹{reg.amount_paid}</span>
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
        <div className="p-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(0,255,136,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>Total Revenue</span>
            <span className="text-3xl font-bold" style={{ color: '#00ff88' }}>₹{totalRevenue}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
