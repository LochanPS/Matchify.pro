import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { superAdminAPI } from '../api/superAdmin';
import {
  Shield, Users, Trophy, CreditCard, LogOut, Search,
  ChevronRight, Activity, TrendingUp, Calendar, AlertTriangle,
  Ban, CheckCircle, Eye, Trash2, RefreshCw, X, Zap, Crown
} from 'lucide-react';

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

  useEffect(() => {
    if (!user?.isAdmin) { navigate('/login'); return; }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, tournamentsRes] = await Promise.all([
        superAdminAPI.getStats().catch(() => ({ data: { stats: {} } })),
        superAdminAPI.getUsers({ limit: 100 }).catch(() => ({ data: { users: [] } })),
        superAdminAPI.getTournaments({ limit: 100 }).catch(() => ({ data: { tournaments: [] } }))
      ]);
      setStats(prev => ({ ...prev, ...statsRes.data.stats }));
      setUsers(usersRes.data.users || []);
      setTournaments(tournamentsRes.data.tournaments || []);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/10 to-slate-900">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-900/50 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl blur opacity-60"></div>
              <div className="relative bg-gradient-to-br from-purple-500 to-indigo-600 p-2.5 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                Admin Control Center
              </h1>
              <p className="text-xs text-gray-400">Manage users, tournaments & more</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1.5 rounded-xl border border-white/10 w-fit">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'tournaments', label: 'Tournaments', icon: Trophy }
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
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">User</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold hidden md:table-cell">Email</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold hidden lg:table-cell">Stats</th>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 text-gray-300 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-4 py-8 text-center text-gray-300">No users found</td>
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
                                  <p className="text-sm text-gray-300 md:hidden">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-gray-200 hidden md:table-cell">{u.email}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <div className="flex gap-3 text-xs">
                                <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">🏆 {u.tournamentsPlayed || 0}</span>
                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">✓ {u.matchesWon || 0}</span>
                                <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded">⭐ {u.totalPoints || 0}</span>
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
      </div>

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
