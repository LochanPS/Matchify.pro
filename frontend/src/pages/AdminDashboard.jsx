import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { superAdminAPI } from '../api/superAdmin';
import api from '../api/axios';
import {
  Shield, Users, Trophy, CreditCard, LogOut, Search,
  ChevronRight, Activity, TrendingUp, Calendar, AlertTriangle,
  Ban, CheckCircle, Eye, Trash2, RefreshCw, X, Zap, Crown, Bell, Building2,
  MapPin, Phone, Mail, Globe, Info, QrCode
} from 'lucide-react';
import NotificationBell from '../components/NotificationBell';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0, totalTournaments: 0, totalRegistrations: 0, totalMatches: 0,
    activeUsers: 0, blockedUsers: 0, pendingRegistrations: 0, completedTournaments: 0, totalRevenue: 0
  });
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [tournamentFilter, setTournamentFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [alertModal, setAlertModal] = useState(null);
  const [academies, setAcademies] = useState([]);
  const [academyFilter, setAcademyFilter] = useState('all');
  const [viewingScreenshot, setViewingScreenshot] = useState(null);
  const [showRejectAcademyModal, setShowRejectAcademyModal] = useState(false);
  const [academyToReject, setAcademyToReject] = useState(null);
  const [rejectAcademyReason, setRejectAcademyReason] = useState('');
  const [showDeleteAcademyModal, setShowDeleteAcademyModal] = useState(false);
  const [academyToDelete, setAcademyToDelete] = useState(null);
  const [deleteAcademyReason, setDeleteAcademyReason] = useState('');
  const [showBlockAcademyModal, setShowBlockAcademyModal] = useState(false);
  const [academyToBlock, setAcademyToBlock] = useState(null);
  const [blockAcademyReason, setBlockAcademyReason] = useState('');
  const [showLoginAsUserModal, setShowLoginAsUserModal] = useState(false);
  const [userToImpersonate, setUserToImpersonate] = useState(null);
  const [impersonationPassword, setImpersonationPassword] = useState('');
  const [expandedAcademy, setExpandedAcademy] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) { navigate('/login'); return; }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tournamentsRes, academiesRes] = await Promise.all([
        superAdminAPI.getStats().catch(() => ({ data: { stats: {} } })),
        superAdminAPI.getUsers({ limit: 100 }).catch(() => ({ data: { users: [] } })),
        superAdminAPI.getTournaments({ limit: 100 }).catch(() => ({ data: { tournaments: [] } })),
        api.get('/academies/admin/all').catch(() => ({ data: { data: { academies: [] } } }))
      ]);
      setStats(prev => ({ ...prev, ...statsRes.data.stats }));
      setUsers(usersRes.data.users || []);
      setTournaments(tournamentsRes.data.tournaments || []);
      setAcademies(academiesRes.data?.data?.academies || academiesRes.data?.academies || []);
    } catch (err) { setError('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    if (!blockReason.trim()) {
      setAlertModal({ type: 'error', message: 'Please provide a reason for blocking this user' });
      return;
    }
    setActionLoading(true);
    try {
      await superAdminAPI.blockUser(selectedUser.id, blockReason);
      // Update local state immediately
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isSuspended: true } : u));
      // Update stats
      setStats(prev => ({ ...prev, blockedUsers: prev.blockedUsers + 1, activeUsers: prev.activeUsers - 1 }));
      setAlertModal({ type: 'success', message: `${selectedUser.name} has been blocked. They will be notified with the reason.` });
      setShowBlockModal(false);
      setSelectedUser(null);
      setBlockReason('');
    } catch (err) {
      setAlertModal({ type: 'error', message: 'Failed to block user. Please try again.' });
    }
    setActionLoading(false);
  };

  const handleUnblockUser = async (userToUnblock) => {
    setActionLoading(true);
    try {
      await superAdminAPI.unblockUser(userToUnblock.id);
      // Update local state immediately
      setUsers(users.map(u => u.id === userToUnblock.id ? { ...u, isSuspended: false } : u));
      // Update stats
      setStats(prev => ({ ...prev, blockedUsers: Math.max(0, prev.blockedUsers - 1), activeUsers: prev.activeUsers + 1 }));
      setAlertModal({ type: 'success', message: `${userToUnblock.name} has been unblocked successfully` });
    } catch (err) {
      setAlertModal({ type: 'error', message: 'Failed to unblock user. Please try again.' });
    }
    setActionLoading(false);
  };

  const handleDeleteTournament = async () => {
    if (!tournamentToDelete) return;
    setActionLoading(true);
    try {
      await superAdminAPI.deleteTournament(tournamentToDelete.id);
      // Update local state
      setTournaments(tournaments.filter(t => t.id !== tournamentToDelete.id));
      setStats(prev => ({ ...prev, totalTournaments: prev.totalTournaments - 1 }));
      setAlertModal({ type: 'success', message: `Tournament "${tournamentToDelete.name}" has been deleted` });
      setShowDeleteModal(false);
      setTournamentToDelete(null);
    } catch (err) {
      setAlertModal({ type: 'error', message: 'Failed to delete tournament. Please try again.' });
    }
    setActionLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    if (userFilter === 'active') return matchesSearch && !u.isSuspended;
    if (userFilter === 'blocked') return matchesSearch && u.isSuspended;
    return matchesSearch;
  });

  const filteredTournaments = tournaments.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.city?.toLowerCase().includes(searchQuery.toLowerCase());
    if (tournamentFilter === 'all') return matchesSearch;
    return matchesSearch && t.status === tournamentFilter;
  });

  const StatCard = ({ icon: Icon, label, value, color, subValue }) => (
    <div className="relative group">
      {/* Halo effect */}
      <div className={`absolute -inset-1 bg-gradient-to-r ${color} rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity duration-300`}></div>
      <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl p-5 border border-white/10 hover:border-white/20 transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
            {subValue && <p className="text-xs text-gray-500">{subValue}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative flex items-center gap-3 bg-slate-800/80 px-6 py-4 rounded-xl border border-white/10">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-white font-medium">Loading Admin Dashboard...</span>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors group"
        >
          <ChevronRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1.5 rounded-xl border border-white/10 w-fit">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'tournaments', label: 'Tournaments', icon: Trophy },
            { id: 'academies', label: 'Academies', icon: Building2, badge: academies.filter(a => a.status === 'pending').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/25'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="from-blue-500 to-cyan-500" subValue={`${stats.activeUsers} active`} />
              <StatCard icon={Trophy} label="Tournaments" value={stats.totalTournaments} color="from-purple-500 to-pink-500" subValue={`${stats.completedTournaments} completed`} />
              <StatCard icon={CreditCard} label="Registrations" value={stats.totalRegistrations} color="from-emerald-500 to-teal-500" subValue={`${stats.pendingRegistrations} pending`} />
              <StatCard icon={Zap} label="Total Matches" value={stats.totalMatches} color="from-orange-500 to-amber-500" />
            </div>

            {/* Revenue & Blocked Users */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400">Total Revenue</p>
                      <p className="text-3xl font-bold text-white">₹{stats.totalRevenue?.toLocaleString() || 0}</p>
                      <p className="text-sm text-emerald-400">From verified payments</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
                      <Ban className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-gray-400">Blocked Users</p>
                      <p className="text-3xl font-bold text-white">{stats.blockedUsers}</p>
                      <p className="text-sm text-red-400">Currently blocked</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 via-indigo-500/30 to-emerald-500/30 rounded-2xl blur-lg opacity-40"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  Quick Actions
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button onClick={() => setActiveTab('users')} className="flex items-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all border border-blue-500/30">
                    <Users className="w-4 h-4" /> Manage Users
                  </button>
                  <button onClick={() => setActiveTab('tournaments')} className="flex items-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all border border-purple-500/30">
                    <Trophy className="w-4 h-4" /> View Tournaments
                  </button>
                  <button onClick={fetchData} className="flex items-center gap-2 px-4 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all border border-emerald-500/30">
                    <RefreshCw className="w-4 h-4" /> Refresh Data
                  </button>
                  <button onClick={() => { setActiveTab('users'); setUserFilter('blocked'); }} className="flex items-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all border border-red-500/30">
                    <AlertTriangle className="w-4 h-4" /> Blocked Users
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All Users</option>
                <option value="active">Active Only</option>
                <option value="blocked">Blocked Only</option>
              </select>
            </div>

            {/* Users List */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-900/50 border-b border-white/10">
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">Name</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">Email</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">Phone</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">Registered</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold hidden xl:table-cell">Stats</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-gray-300">No users found</td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, idx) => (
                          <tr key={u.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${idx % 2 === 0 ? 'bg-slate-800/30' : ''}`}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <div className={`absolute -inset-0.5 bg-gradient-to-r ${u.isSuspended ? 'from-red-500 to-rose-500' : 'from-purple-500 to-indigo-500'} rounded-full blur opacity-50`}></div>
                                  {u.profilePhoto ? (
                                    <img src={u.profilePhoto} alt={u.name} className="relative w-10 h-10 rounded-full object-cover border-2 border-white/20" />
                                  ) : (
                                    <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold border-2 border-white/20">
                                      {u.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <p className="text-white font-semibold">{u.name || 'Unknown'}</p>
                                  {u.city && <p className="text-xs text-gray-500">{u.city}</p>}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-white font-medium">{u.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-white">{u.phone || '-'}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-white text-sm">
                                {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                              </p>
                            </td>
                            <td className="px-4 py-3 hidden xl:table-cell">
                              <div className="flex gap-2 text-xs">
                                {/* Tournaments Badge with Halo */}
                                <div className="relative group">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <span className="relative px-3 py-1.5 bg-slate-800 border border-purple-500/30 text-purple-400 rounded-lg font-semibold flex items-center gap-1.5">
                                    🏆 {u.tournamentsPlayed || 0}
                                  </span>
                                </div>
                                
                                {/* Matches Won Badge with Halo */}
                                <div className="relative group">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <span className="relative px-3 py-1.5 bg-slate-800 border border-emerald-500/30 text-emerald-400 rounded-lg font-semibold flex items-center gap-1.5">
                                    ✓ {u.matchesWon || 0}
                                  </span>
                                </div>
                                
                                {/* Points Badge with Halo */}
                                <div className="relative group">
                                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
                                  <span className="relative px-3 py-1.5 bg-slate-800 border border-amber-500/30 text-amber-400 rounded-lg font-semibold flex items-center gap-1.5">
                                    ⭐ {u.totalPoints || 0}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {u.isSuspended ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                  <Ban className="w-3 h-3" /> Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                                  <CheckCircle className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setUserToImpersonate(u);
                                    setImpersonationPassword('');
                                    setShowLoginAsUserModal(true);
                                  }}
                                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all border border-blue-500/30"
                                  title="Login As User"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {u.isSuspended ? (
                                  <button
                                    onClick={() => handleUnblockUser(u)}
                                    disabled={actionLoading}
                                    className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-all border border-emerald-500/30 disabled:opacity-50"
                                    title="Unblock User"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { setSelectedUser(u); setShowBlockModal(true); }}
                                    disabled={actionLoading}
                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all border border-red-500/30 disabled:opacity-50"
                                    title="Block User"
                                  >
                                    <Ban className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 bg-slate-900/50 border-t border-white/10 text-sm text-gray-300">
                  Showing {filteredUsers.length} of {users.length} users
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tournaments by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
                />
              </div>
              <select
                value={tournamentFilter}
                onChange={(e) => setTournamentFilter(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Tournaments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTournaments.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">No tournaments found</div>
              ) : (
                filteredTournaments.map(t => (
                  <div key={t.id} className="relative group">
                    {/* Halo effect */}
                    <div className={`absolute -inset-1 bg-gradient-to-r ${
                      t.status === 'completed' ? 'from-emerald-500/30 to-teal-500/30' :
                      t.status === 'ongoing' ? 'from-blue-500/30 to-cyan-500/30' :
                      t.status === 'published' ? 'from-purple-500/30 to-indigo-500/30' :
                      t.status === 'cancelled' ? 'from-red-500/30 to-rose-500/30' :
                      'from-gray-500/30 to-slate-500/30'
                    } rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-opacity`}></div>
                    
                    <div className="relative bg-slate-800/80 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all">
                      {/* Tournament Header */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{t.name}</h3>
                            <p className="text-sm text-gray-400 flex items-center gap-1 mt-1">
                              <Calendar className="w-3 h-3" />
                              {t.startDate ? new Date(t.startDate).toLocaleDateString() : 'No date'}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            t.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                            t.status === 'ongoing' ? 'bg-blue-500/20 text-blue-400' :
                            t.status === 'published' ? 'bg-purple-500/20 text-purple-400' :
                            t.status === 'cancelled' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {t.status || 'draft'}
                          </span>
                        </div>
                      </div>

                      {/* Tournament Info */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-gray-500">📍</span>
                          <span>{t.city || 'Location TBD'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <span className="text-gray-500">👤</span>
                          <span>{t.organizer?.name || 'Unknown organizer'}</span>
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                            {t._count?.registrations || 0} registrations
                          </span>
                          <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 rounded">
                            {t._count?.categories || 0} categories
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="p-4 bg-slate-900/50 border-t border-white/10 flex gap-2">
                        <button
                          onClick={() => navigate(`/tournaments/${t.id}`)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-all border border-purple-500/30 text-sm"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => { setTournamentToDelete(t); setShowDeleteModal(true); }}
                          className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all border border-red-500/30 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="text-sm text-gray-400 text-center">
              Showing {filteredTournaments.length} of {tournaments.length} tournaments
            </div>
          </div>
        )}

        {/* Academies Tab */}
        {activeTab === 'academies' && (
          <div className="space-y-4">
            {/* Filter and Refresh */}
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {['all', 'pending', 'approved', 'rejected', 'blocked', 'deleted'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => { setAcademyFilter(filter); setExpandedAcademy(null); }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                      academyFilter === filter
                        ? filter === 'all' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : filter === 'pending' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : filter === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : filter === 'blocked' ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : filter === 'deleted' ? 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-slate-800/50 text-gray-400 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
              <button
                onClick={async () => {
                  try {
                    const academiesRes = await api.get('/academies/admin/all');
                    setAcademies(academiesRes.data?.data?.academies || academiesRes.data?.academies || []);
                    setAlertModal({ type: 'success', message: 'Academy list refreshed!' });
                  } catch (e) {
                    setAlertModal({ type: 'error', message: 'Failed to refresh academy list' });
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all border border-blue-500/30"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            {/* Academies List - Minimalist Compact Cards */}
            {academies.filter(a => {
              if (academyFilter === 'all') return !a.isDeleted;
              if (academyFilter === 'deleted') return a.isDeleted;
              if (academyFilter === 'blocked') return a.isBlocked && !a.isDeleted;
              return a.status === academyFilter && !a.isBlocked && !a.isDeleted;
            }).length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-xl border border-white/10">
                <Building2 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No {academyFilter} academies</p>
              </div>
            ) : (
              <div className="space-y-3">
                {academies.filter(a => {
                  if (academyFilter === 'all') return !a.isDeleted;
                  if (academyFilter === 'deleted') return a.isDeleted;
                  if (academyFilter === 'blocked') return a.isBlocked && !a.isDeleted;
                  return a.status === academyFilter && !a.isBlocked && !a.isDeleted;
                }).map(academy => (
                  <div key={academy.id} className="bg-slate-800/80 rounded-xl border border-white/10 overflow-hidden">
                    {/* Compact Header - Click to Expand */}
                    <div 
                      onClick={() => setExpandedAcademy(expandedAcademy === academy.id ? null : academy.id)}
                      className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${
                            academy.isDeleted ? 'bg-slate-500/20' :
                            academy.isBlocked ? 'bg-gray-500/20' :
                            academy.status === 'pending' ? 'bg-amber-500/20' :
                            academy.status === 'approved' ? 'bg-emerald-500/20' :
                            'bg-red-500/20'
                          }`}>
                            🏫
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-semibold truncate">{academy.name}</h3>
                            <p className="text-sm text-gray-400 truncate">{academy.city}, {academy.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            academy.isDeleted ? 'bg-slate-500/20 text-slate-400' :
                            academy.isBlocked ? 'bg-gray-500/20 text-gray-400' :
                            academy.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                            academy.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {academy.isDeleted ? 'Deleted' : academy.isBlocked ? 'Blocked' : academy.status === 'pending' ? 'Pending' : academy.status === 'approved' ? 'Live' : 'Rejected'}
                          </span>
                          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedAcademy === academy.id ? 'rotate-90' : ''}`} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {expandedAcademy === academy.id && (
                      <div className="border-t border-white/10">
                        {/* Contact & Address */}
                        <div className="p-4 grid md:grid-cols-2 gap-3 bg-slate-900/30">
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">Contact</p>
                            <p className="text-white text-sm flex items-center gap-2"><Phone className="w-3 h-3" />{academy.phone}</p>
                            <p className="text-white text-sm flex items-center gap-2 truncate"><Mail className="w-3 h-3" />{academy.email || academy.submittedByEmail}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500">Address</p>
                            <p className="text-white text-sm">{academy.address}, {academy.city}, {academy.state} - {academy.pincode}</p>
                          </div>
                        </div>

                        {/* Sports & Details */}
                        <div className="p-4 border-t border-white/10">
                          <p className="text-xs text-gray-500 mb-2">Sports</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {academy.sports?.map(sport => (
                              <span key={sport} className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs">{sport}</span>
                            ))}
                          </div>
                          {academy.sportDetails && Object.keys(academy.sportDetails).length > 0 && (
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              {Object.entries(academy.sportDetails).slice(0, 4).map(([key, value]) => (
                                <div key={key} className="text-xs">
                                  <span className="text-gray-500">{key.replace(/_/g, ' ')}: </span>
                                  <span className="text-white font-medium">{value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Payment & Photos */}
                        <div className="p-4 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-400 font-bold">₹200</span>
                            {academy.paymentScreenshot && (
                              <button 
                                onClick={() => setViewingScreenshot(academy.paymentScreenshot)}
                                className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                              >
                                View Payment
                              </button>
                            )}
                          </div>
                          {academy.photos && academy.photos.length > 0 && (
                            <button 
                              onClick={() => setViewingScreenshot(academy.photos[0])}
                              className="text-xs px-3 py-1 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition-colors"
                            >
                              {academy.photos.length} Photo{academy.photos.length > 1 ? 's' : ''}
                            </button>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="p-4 bg-slate-900/50 border-t border-white/10 flex gap-2">
                          {academy.status === 'pending' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post(`/academies/admin/${academy.id}/approve`);
                                    setAcademies(prev => prev.map(a => a.id === academy.id ? { ...a, status: 'approved' } : a));
                                    setAlertModal({ type: 'success', message: `"${academy.name}" approved!` });
                                    setExpandedAcademy(null);
                                  } catch (e) {
                                    setAlertModal({ type: 'error', message: 'Failed to approve academy' });
                                  }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
                              >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                              </button>
                              <button
                                onClick={() => {
                                  setAcademyToReject(academy);
                                  setRejectAcademyReason('');
                                  setShowRejectAcademyModal(true);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                              >
                                <X className="w-4 h-4" />
                                Reject
                              </button>
                            </>
                          )}
                          
                          {/* Block/Unblock Button for Approved Academies */}
                          {academy.status === 'approved' && !academy.isBlocked && (
                            <button
                              onClick={() => {
                                setAcademyToBlock(academy);
                                setBlockAcademyReason('');
                                setShowBlockAcademyModal(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <Ban className="w-4 h-4" />
                              Block
                            </button>
                          )}
                          
                          {/* Unblock Button for Blocked Academies */}
                          {academy.isBlocked && (
                            <button
                              onClick={async () => {
                                try {
                                  await api.post(`/academies/admin/${academy.id}/unblock`);
                                  setAcademies(prev => prev.map(a => a.id === academy.id ? { ...a, isBlocked: false } : a));
                                  setAlertModal({ type: 'success', message: `"${academy.name}" has been unblocked` });
                                  setExpandedAcademy(null);
                                } catch (e) {
                                  setAlertModal({ type: 'error', message: 'Failed to unblock academy' });
                                }
                              }}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm font-medium"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Unblock
                            </button>
                          )}
                          
                          {/* Delete Button - Always Available */}
                          <button
                            onClick={() => {
                              setAcademyToDelete(academy);
                              setDeleteAcademyReason('');
                              setShowDeleteAcademyModal(true);
                            }}
                            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm font-medium border border-red-500/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Academy Modal */}
      {showRejectAcademyModal && academyToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <X className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Reject Academy</h3>
                  </div>
                  <button 
                    onClick={() => { setShowRejectAcademyModal(false); setAcademyToReject(null); setRejectAcademyReason(''); }} 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-gray-400">Academy to reject:</p>
                  <p className="text-white font-semibold mt-1">{academyToReject.name}</p>
                  <p className="text-sm text-gray-500">{academyToReject.city}, {academyToReject.state}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Reason for rejection <span className="text-red-400">*</span></label>
                  <textarea
                    value={rejectAcademyReason}
                    onChange={(e) => setRejectAcademyReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => { setShowRejectAcademyModal(false); setAcademyToReject(null); setRejectAcademyReason(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!rejectAcademyReason.trim()) {
                      setAlertModal({ type: 'error', message: 'Please provide a reason for rejection' });
                      return;
                    }
                    try {
                      await api.post(`/academies/admin/${academyToReject.id}/reject`, { reason: rejectAcademyReason });
                      setAcademies(prev => prev.map(a => a.id === academyToReject.id ? { ...a, status: 'rejected' } : a));
                      setAlertModal({ type: 'success', message: `"${academyToReject.name}" has been rejected. The academy owner has been notified with the reason for rejection.` });
                      setShowRejectAcademyModal(false);
                      setAcademyToReject(null);
                      setRejectAcademyReason('');
                    } catch (e) {
                      setAlertModal({ type: 'error', message: 'Failed to reject academy' });
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject Academy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Academy Modal */}
      {showDeleteAcademyModal && academyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Delete Academy</h3>
                  </div>
                  <button 
                    onClick={() => { setShowDeleteAcademyModal(false); setAcademyToDelete(null); setDeleteAcademyReason(''); }} 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">⚠️ Permanent Action</p>
                      <p className="text-sm text-gray-300">This will permanently delete the academy from Matchify.pro. This action cannot be undone.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-gray-400">Academy to delete:</p>
                  <p className="text-white font-semibold mt-1">{academyToDelete.name}</p>
                  <p className="text-sm text-gray-500">{academyToDelete.city}, {academyToDelete.state}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Reason for deletion <span className="text-red-400">*</span></label>
                  <textarea
                    value={deleteAcademyReason}
                    onChange={(e) => setDeleteAcademyReason(e.target.value)}
                    placeholder="Enter reason for deletion (will be sent to academy owner)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => { setShowDeleteAcademyModal(false); setAcademyToDelete(null); setDeleteAcademyReason(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!deleteAcademyReason.trim()) {
                      setAlertModal({ type: 'error', message: 'Please provide a reason for deletion' });
                      return;
                    }
                    try {
                      const response = await api.delete(`/academies/admin/${academyToDelete.id}`, { 
                        data: { reason: deleteAcademyReason } 
                      });
                      
                      if (response.data.success) {
                        // Refresh the entire academy list from server to get accurate data
                        try {
                          const academiesRes = await api.get('/academies/admin/all');
                          setAcademies(academiesRes.data?.data?.academies || academiesRes.data?.academies || []);
                        } catch (refreshError) {
                          console.error('Failed to refresh academies:', refreshError);
                          // Fallback: update local state
                          setAcademies(prev => prev.map(a => 
                            a.id === academyToDelete.id 
                              ? { ...a, isDeleted: true, deletedAt: new Date(), deletionReason: deleteAcademyReason, status: 'deleted' } 
                              : a
                          ));
                        }
                        setAlertModal({ type: 'success', message: `"${academyToDelete.name}" has been moved to deleted academies. The academy owner has been notified.` });
                        setShowDeleteAcademyModal(false);
                        setAcademyToDelete(null);
                        setDeleteAcademyReason('');
                        setExpandedAcademy(null);
                      }
                    } catch (e) {
                      console.error('Delete error:', e);
                      const errorMsg = e.response?.data?.error || e.message || 'Failed to delete academy';
                      if (e.response?.status === 404) {
                        setAlertModal({ type: 'error', message: 'This academy no longer exists in the database. Refreshing the list...' });
                        // Refresh the academy list
                        try {
                          const academiesRes = await api.get('/academies/admin/all');
                          setAcademies(academiesRes.data?.data?.academies || academiesRes.data?.academies || []);
                        } catch (refreshError) {
                          console.error('Failed to refresh:', refreshError);
                        }
                      } else {
                        setAlertModal({ type: 'error', message: `Failed to delete academy: ${errorMsg}` });
                      }
                      setShowDeleteAcademyModal(false);
                      setAcademyToDelete(null);
                      setDeleteAcademyReason('');
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block Academy Modal */}
      {showBlockAcademyModal && academyToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-gray-500 via-gray-600 to-gray-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-500/20 rounded-lg">
                      <Ban className="w-5 h-5 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Block Academy</h3>
                  </div>
                  <button 
                    onClick={() => { setShowBlockAcademyModal(false); setAcademyToBlock(null); setBlockAcademyReason(''); }} 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-gray-500/10 border border-gray-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-gray-300 font-semibold mb-1">⚠️ Block Academy</p>
                      <p className="text-sm text-gray-400">This will hide the academy from public view on Matchify.pro. You can unblock it later.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-gray-400">Academy to block:</p>
                  <p className="text-white font-semibold mt-1">{academyToBlock.name}</p>
                  <p className="text-sm text-gray-500">{academyToBlock.city}, {academyToBlock.state}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Reason for blocking <span className="text-gray-400">*</span></label>
                  <textarea
                    value={blockAcademyReason}
                    onChange={(e) => setBlockAcademyReason(e.target.value)}
                    placeholder="Enter reason for blocking (will be sent to academy owner)..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500/50 resize-none"
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => { setShowBlockAcademyModal(false); setAcademyToBlock(null); setBlockAcademyReason(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!blockAcademyReason.trim()) {
                      setAlertModal({ type: 'error', message: 'Please provide a reason for blocking' });
                      return;
                    }
                    try {
                      await api.post(`/academies/admin/${academyToBlock.id}/block`, { reason: blockAcademyReason });
                      setAcademies(prev => prev.map(a => a.id === academyToBlock.id ? { ...a, isBlocked: true, blockReason: blockAcademyReason } : a));
                      setAlertModal({ type: 'success', message: `"${academyToBlock.name}" has been blocked. The academy owner has been notified.` });
                      setShowBlockAcademyModal(false);
                      setAcademyToBlock(null);
                      setBlockAcademyReason('');
                      setExpandedAcademy(null);
                    } catch (e) {
                      setAlertModal({ type: 'error', message: 'Failed to block academy. Please try again.' });
                    }
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Block Academy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login As User Password Modal */}
      {showLoginAsUserModal && userToImpersonate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Admin Verification Required</h3>
                  </div>
                  <button 
                    onClick={() => { setShowLoginAsUserModal(false); setUserToImpersonate(null); setImpersonationPassword(''); }} 
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Eye className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-blue-400 font-semibold mb-1">🔐 Login As User</p>
                      <p className="text-sm text-gray-300">You are about to view this user's account. Enter admin password to continue.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-gray-400">User to impersonate:</p>
                  <p className="text-white font-semibold mt-1">{userToImpersonate.name}</p>
                  <p className="text-sm text-gray-500">{userToImpersonate.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Admin Password <span className="text-red-400">*</span></label>
                  <input
                    type="password"
                    value={impersonationPassword}
                    onChange={(e) => setImpersonationPassword(e.target.value)}
                    placeholder="Enter admin password..."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && impersonationPassword.trim()) {
                        document.getElementById('loginAsUserBtn').click();
                      }
                    }}
                  />
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => { setShowLoginAsUserModal(false); setUserToImpersonate(null); setImpersonationPassword(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="loginAsUserBtn"
                  onClick={async () => {
                    if (!impersonationPassword.trim()) {
                      setAlertModal({ type: 'error', message: 'Please enter admin password' });
                      return;
                    }
                    
                    // Verify password
                    if (impersonationPassword !== 'Pradyu@123(123)') {
                      setAlertModal({ type: 'error', message: 'Incorrect admin password' });
                      setImpersonationPassword('');
                      return;
                    }
                    
                    try {
                      const response = await api.post(`/admin/users/${userToImpersonate.id}/login-as`);
                      if (response.data.success) {
                        // Store the new token and user data
                        localStorage.setItem('token', response.data.token);
                        localStorage.setItem('user', JSON.stringify(response.data.user));
                        // Redirect to home page as the user
                        window.location.href = '/';
                      }
                    } catch (error) {
                      setAlertModal({ type: 'error', message: 'Failed to login as user. Please try again.' });
                    }
                    
                    setShowLoginAsUserModal(false);
                    setUserToImpersonate(null);
                    setImpersonationPassword('');
                  }}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Login As User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Screenshot Modal */}
      {viewingScreenshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Payment Screenshot</h3>
                </div>
                <button 
                  onClick={() => setViewingScreenshot(null)} 
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <div className="p-4">
                <img 
                  src={viewingScreenshot} 
                  alt="Payment Screenshot" 
                  className="w-full max-h-[70vh] object-contain rounded-lg"
                />
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setViewingScreenshot(null)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {showBlockModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Ban className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Block User</h3>
                  </div>
                  <button onClick={() => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-xl">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full blur opacity-50"></div>
                    {selectedUser.profilePhoto ? (
                      <img src={selectedUser.profilePhoto} alt={selectedUser.name} className="relative w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        {selectedUser.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedUser.name}</p>
                    <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Reason for blocking <span className="text-red-400">*</span></label>
                  <textarea
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Enter reason..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                  />
                </div>
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    You can unblock this user anytime from the Users tab.
                  </p>
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => { setShowBlockModal(false); setSelectedUser(null); setBlockReason(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBlockUser}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                  Block User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tournament Modal */}
      {showDeleteModal && tournamentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md">
            {/* Halo effect */}
            <div className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-3xl blur-xl opacity-50"></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Delete Tournament</h3>
                  </div>
                  <button onClick={() => { setShowDeleteModal(false); setTournamentToDelete(null); }} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">Warning: This action cannot be undone</p>
                      <p className="text-sm text-gray-400 mt-1">All registrations, matches, and categories associated with this tournament will be permanently deleted.</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-700/50 rounded-xl">
                  <p className="text-sm text-gray-400">Tournament to delete:</p>
                  <p className="text-white font-semibold mt-1">{tournamentToDelete.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{tournamentToDelete._count?.registrations || 0} registrations will be deleted</p>
                </div>
              </div>
              <div className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
                <button
                  onClick={() => { setShowDeleteModal(false); setTournamentToDelete(null); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTournament}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white rounded-xl transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Tournament
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm">
            {/* Halo effect */}
            <div className={`absolute -inset-2 bg-gradient-to-r ${alertModal.type === 'success' ? 'from-emerald-500 to-teal-500' : 'from-red-500 to-rose-500'} rounded-3xl blur-xl opacity-50`}></div>
            <div className="relative bg-slate-800 rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${alertModal.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {alertModal.type === 'success' ? (
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <h3 className={`text-lg font-semibold ${alertModal.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {alertModal.type === 'success' ? 'Success!' : 'Error'}
                </h3>
                <p className="text-gray-300 mt-2">{alertModal.message}</p>
              </div>
              <div className="p-4 bg-slate-900/50 border-t border-white/10">
                <button
                  onClick={() => setAlertModal(null)}
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-colors ${
                    alertModal.type === 'success'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white'
                      : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white'
                  }`}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
