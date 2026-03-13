import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  BarChart3,
  Plus,
  Star,
  Info,
  X,
  Trophy,
  Award,
  Mail,
  Phone,
  MapPin,
  Cake,
  Shield,
  Target,
  Zap
} from 'lucide-react';

export default function OrganizerDashboardPage() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchDashboard();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setUserProfile(response.data.user);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/organizer/dashboard`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setDashboardData(response.data.data);
      setError('');
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-lg mb-4">{error || 'Failed to load dashboard'}</p>
          <p className="text-gray-400 mb-6">
            There was an error loading your dashboard. Please check your connection and try again.
          </p>
          <button
            onClick={fetchDashboard}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const stats = {
    totalTournaments: dashboardData.total_tournaments,
    totalRegistrations: dashboardData.total_registrations,
    totalRevenue: dashboardData.revenue.total,
    activeTournaments: dashboardData.tournaments_by_status?.ongoing || 0,
  };

  // Calculate experience level based on total tournaments
  const getExperienceLevel = (tournaments) => {
    if (tournaments === 0) return 'New Organizer';
    if (tournaments >= 1 && tournaments <= 5) return 'Beginner';
    if (tournaments >= 6 && tournaments <= 8) return 'Intermediate';
    if (tournaments >= 9 && tournaments <= 15) return 'Advanced';
    if (tournaments >= 16 && tournaments <= 20) return 'Expert';
    return 'Master';
  };

  const getStarCount = (tournaments) => {
    if (tournaments === 0) return 0;
    if (tournaments >= 1 && tournaments <= 5) return 1;
    if (tournaments >= 6 && tournaments <= 8) return 2;
    if (tournaments >= 9 && tournaments <= 15) return 3;
    if (tournaments >= 16 && tournaments <= 20) return 4;
    return 5;
  };

  const experienceLevel = getExperienceLevel(stats.totalTournaments);
  const starCount = getStarCount(stats.totalTournaments);

  // Calculate additional stats
  const memberSince = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const daysActive = userProfile?.createdAt
    ? Math.floor((new Date() - new Date(userProfile.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  const averageTournamentsPerMonth = userProfile?.createdAt && stats.totalTournaments > 0
    ? Math.round((stats.totalTournaments / (daysActive / 30)) * 10) / 10
    : 0;

  const averageParticipantsPerTournament = stats.totalTournaments > 0
    ? Math.round(stats.totalRegistrations / stats.totalTournaments)
    : 0;

  // Check if organizer has no tournaments
  const hasNoTournaments = stats.totalTournaments === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header with Profile */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
            {/* Left: Profile Info */}
            <div className="flex items-start gap-6 flex-1">
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-5xl font-bold text-white shadow-2xl shadow-purple-500/30 ring-4 ring-white/10">
                  {userProfile?.profilePhoto ? (
                    <img src={userProfile.profilePhoto} alt={userProfile.name} className="w-full h-full object-cover rounded-3xl" />
                  ) : (
                    userProfile?.name?.charAt(0)?.toUpperCase() || 'O'
                  )}
                </div>
                <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h1 className="text-4xl font-bold text-white">Organizer Dashboard</h1>
                </div>
                <p className="text-xl text-purple-300 font-medium mb-4">Welcome back, {userProfile?.name || 'Organizer'}!</p>
                
                {/* Contact Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {userProfile?.email && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Mail className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">{userProfile.email}</span>
                    </div>
                  )}
                  {userProfile?.phone && (
                    <div className="flex items-center gap-2 text-white/70">
                      <Phone className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">{userProfile.phone}</span>
                    </div>
                  )}
                  {(userProfile?.city || userProfile?.state) && (
                    <div className="flex items-center gap-2 text-white/70">
                      <MapPin className="w-4 h-4 text-purple-400" />
                      <span className="text-sm">
                        {[userProfile.city, userProfile.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar className="w-4 h-4 text-purple-400" />
                    <span className="text-sm">Member since {memberSince}</span>
                  </div>
                </div>
                
                {/* Create Tournament Button */}
                <button
                  onClick={() => navigate('/tournaments/create')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-green-500/25 hover:scale-105 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Tournament
                </button>
              </div>
            </div>

            {/* Right: Quick Stats */}
            <div className="grid grid-cols-2 gap-4 lg:w-80">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-yellow-400" />
                  <span className="text-white/60 text-xs">Career Tournaments</span>
                </div>
                <p className="text-3xl font-bold text-yellow-400">{stats.totalTournaments}</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <span className="text-white/60 text-xs">Avg/Month</span>
                </div>
                <p className="text-3xl font-bold text-orange-400">{averageTournamentsPerMonth}</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-5 h-5 text-purple-400" />
                  <span className="text-white/60 text-xs">Member Since</span>
                </div>
                <p className="text-sm font-bold text-purple-400">{memberSince}</p>
              </div>
              
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-green-400" />
                  <span className="text-white/60 text-xs">Active Days</span>
                </div>
                <p className="text-3xl font-bold text-green-400">{daysActive}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">

        {/* Empty State - First Tournament */}
        {hasNoTournaments ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-12 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-6xl mb-6">🎾</div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to Matchify.pro!
              </h2>
              <p className="text-lg text-gray-300 mb-6">
                You haven't created any tournaments yet. Get started by creating your first tournament!
              </p>
              <button
                onClick={() => navigate('/tournaments/create')}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg rounded-xl hover:shadow-lg hover:scale-105 transition-all"
              >
                <Plus className="h-6 w-6" />
                Create Your First Tournament
              </button>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="bg-slate-700/50 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl mb-2">📝</div>
                  <h4 className="font-semibold text-white mb-1">Easy Setup</h4>
                  <p className="text-sm text-gray-400">Create tournaments in minutes with our simple form</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl mb-2">👥</div>
                  <h4 className="font-semibold text-white mb-1">Manage Registrations</h4>
                  <p className="text-sm text-gray-400">Track participants and payments easily</p>
                </div>
                <div className="bg-slate-700/50 p-4 rounded-xl border border-white/10">
                  <div className="text-2xl mb-2">📊</div>
                  <h4 className="font-semibold text-white mb-1">Live Scoring</h4>
                  <p className="text-sm text-gray-400">Real-time match scoring and updates</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Tournaments</p>
                <p className="text-3xl font-bold text-blue-400 mt-1">{stats.totalTournaments}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Tournaments</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{stats.activeTournaments}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Participants</p>
                <p className="text-3xl font-bold text-purple-400 mt-1">{stats.totalRegistrations}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] hover:scale-105 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Revenue</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">
                  ₹{stats.totalRevenue.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Comprehensive Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Profile Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Full Name</p>
                <p className="text-white font-medium">{userProfile?.name || 'N/A'}</p>
              </div>
              
              {userProfile?.email && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email Address</p>
                  <p className="text-white font-medium text-sm break-all">{userProfile.email}</p>
                </div>
              )}
              
              {userProfile?.phone && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                  <p className="text-white font-medium">{userProfile.phone}</p>
                </div>
              )}
              
              {(userProfile?.city || userProfile?.state || userProfile?.country) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Location</p>
                  <p className="text-white font-medium">
                    {[userProfile.city, userProfile.state, userProfile.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-gray-400 text-xs mb-1">Member Since</p>
                <p className="text-white font-medium">{memberSince}</p>
              </div>
              
              <div>
                <p className="text-gray-400 text-xs mb-1">Days Active</p>
                <p className="text-white font-medium">{daysActive} days</p>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Performance Stats</h3>
            </div>
            
            <div className="space-y-6">
              {/* Average Tournaments Per Month */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Avg Tournaments/Month</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold text-orange-400">{averageTournamentsPerMonth}</p>
                  <p className="text-gray-500 text-sm mb-1">tournaments</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <p className="text-gray-500 text-xs">
                    {averageTournamentsPerMonth > 2 ? 'Highly active' : 
                     averageTournamentsPerMonth > 1 ? 'Active' : 'Getting started'}
                  </p>
                </div>
              </div>

              {/* Average Participants */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Avg Participants</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold text-purple-400">{averageParticipantsPerTournament}</p>
                  <p className="text-gray-500 text-sm mb-1">players</p>
                </div>
                <p className="text-gray-500 text-xs mt-2">
                  Per tournament average
                </p>
              </div>

              {/* Experience Level */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-gray-400 text-sm">Experience Level</p>
                  <button
                    onClick={() => setShowLevelInfo(true)}
                    className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
                    title="View level details"
                  >
                    <Info className="h-4 w-4 text-blue-400" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-amber-400 mb-2">{experienceLevel}</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < starCount ? 'text-amber-400 fill-amber-400' : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Activity & Achievements */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Activity & Status</h3>
            </div>
            
            <div className="space-y-4">
              {/* Current Status */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Current Status</p>
                  <div className={`w-3 h-3 rounded-full ${
                    stats.activeTournaments > 0 ? 'bg-green-500 animate-pulse' : 
                    stats.totalTournaments > 0 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <p className="text-white font-bold text-lg">
                  {stats.activeTournaments > 0 ? 'Active' : 
                   stats.totalTournaments > 0 ? 'Inactive' : 'New'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {stats.activeTournaments > 0 ? `${stats.activeTournaments} active tournaments` : 
                   stats.totalTournaments > 0 ? 'No active tournaments' : 'Create your first tournament'}
                </p>
              </div>

              {/* Total Revenue */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
                <p className="text-3xl font-bold text-green-400">₹{stats.totalRevenue.toLocaleString()}</p>
                <p className="text-gray-500 text-xs mt-1">
                  From {stats.totalRegistrations} registrations
                </p>
              </div>

              {/* Achievements */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Achievements</p>
                <div className="space-y-2">
                  {stats.totalTournaments >= 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🎯</span>
                      <span className="text-white">First Tournament</span>
                    </div>
                  )}
                  {stats.totalTournaments >= 3 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">⭐</span>
                      <span className="text-white">3 Tournaments</span>
                    </div>
                  )}
                  {stats.totalTournaments >= 10 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🏆</span>
                      <span className="text-white">10 Tournaments</span>
                    </div>
                  )}
                  {stats.totalTournaments >= 25 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">💎</span>
                      <span className="text-white">25 Tournaments</span>
                    </div>
                  )}
                  {stats.totalTournaments >= 50 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">👑</span>
                      <span className="text-white">Master Organizer</span>
                    </div>
                  )}
                  {stats.totalTournaments === 0 && (
                    <p className="text-gray-500 text-xs">Create tournaments to earn achievements</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Upcoming Tournaments */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Upcoming Tournaments</h2>
            </div>
            <div className="p-6">
              {dashboardData.upcoming_tournaments.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No upcoming tournaments</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.upcoming_tournaments.map((tournament) => (
                    <div
                      key={tournament.id}
                      className="border border-white/10 rounded-xl p-4 hover:border-purple-500/50 cursor-pointer transition bg-slate-700/30"
                      onClick={() => navigate(`/organizer/tournaments/${tournament.id}`)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-white">{tournament.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          tournament.status === 'ongoing'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : tournament.status === 'published'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        }`}>
                          {tournament.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {tournament.city}, {tournament.state}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">
                          {new Date(tournament.start_date).toLocaleDateString()}
                        </span>
                        <span className="text-blue-400 font-medium">
                          {tournament.registration_count} registrations
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Recent Registrations</h2>
            </div>
            <div className="p-6">
              {dashboardData.recent_registrations.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No registrations yet</p>
              ) : (
                <div className="space-y-4">
                  {dashboardData.recent_registrations.map((reg) => (
                    <div key={reg.id} className="border-b border-white/10 pb-4 last:border-0">
                      <div className="flex justify-between items-start mb-1">
                        <div>
                          <p className="font-medium text-white">{reg.player_name}</p>
                          <p className="text-sm text-gray-400">{reg.tournament_name}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          reg.payment_status === 'completed'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : reg.payment_status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {reg.payment_status}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">{reg.category_name}</span>
                        <span className="font-medium text-white">₹{reg.amount_paid}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(reg.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tournament Status Breakdown */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Tournament Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboardData.tournaments_by_status || {}).map(([status, count]) => (
              <div key={status} className="text-center p-4 bg-slate-700/50 rounded-xl border border-white/10">
                <p className="text-2xl font-bold text-white">{count}</p>
                <p className="text-sm text-gray-400 capitalize">{status.replace('_', ' ')}</p>
              </div>
            ))}
            {Object.keys(dashboardData.tournaments_by_status || {}).length === 0 && (
              <div className="col-span-4 text-center text-gray-400 py-4">
                No tournaments yet
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Experience Level Info Modal */}
      {showLevelInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Organizer Experience Levels</h3>
              </div>
              <button
                onClick={() => setShowLevelInfo(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 mb-6">
                Your experience level is determined by the total number of tournaments you've organized. 
                Each level comes with a star rating to showcase your expertise.
              </p>

              {/* Level Cards */}
              <div className="space-y-3">
                {/* New Organizer */}
                <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-300">New Organizer</h4>
                      <p className="text-sm text-gray-400">0 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Just getting started! Create your first tournament to earn your first star.
                  </p>
                </div>

                {/* Beginner */}
                <div className="bg-slate-700/50 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-amber-400">Beginner</h4>
                      <p className="text-sm text-gray-400">1-5 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Building foundational organizing skills and learning tournament management.
                  </p>
                </div>

                {/* Intermediate */}
                <div className="bg-slate-700/50 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-blue-400">Intermediate</h4>
                      <p className="text-sm text-gray-400">6-8 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(3)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Gaining confidence and developing consistent tournament standards.
                  </p>
                </div>

                {/* Advanced */}
                <div className="bg-slate-700/50 border border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-purple-400">Advanced</h4>
                      <p className="text-sm text-gray-400">9-15 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(2)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Experienced organizer with solid track record and reliable event management.
                  </p>
                </div>

                {/* Expert */}
                <div className="bg-slate-700/50 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-green-400">Expert</h4>
                      <p className="text-sm text-gray-400">16-20 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <Star className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Highly experienced organizer trusted for large-scale tournaments.
                  </p>
                </div>

                {/* Master */}
                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-yellow-400">Master</h4>
                      <p className="text-sm text-gray-400">21+ tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Elite organizer with extensive experience and exceptional event management skills.
                  </p>
                </div>
              </div>

              {/* Current Progress */}
              {stats.totalTournaments > 0 && (
                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-blue-400" />
                    <h4 className="font-bold text-white">Your Progress</h4>
                  </div>
                  <p className="text-gray-300">
                    You've organized <span className="font-bold text-blue-400">{stats.totalTournaments}</span> {stats.totalTournaments === 1 ? 'tournament' : 'tournaments'}.
                    {stats.totalTournaments < 1 && ' Organize your first tournament to become a Beginner!'}
                    {stats.totalTournaments >= 1 && stats.totalTournaments <= 5 && ` Organize ${6 - stats.totalTournaments} more to reach Intermediate level!`}
                    {stats.totalTournaments >= 6 && stats.totalTournaments <= 8 && ` Organize ${9 - stats.totalTournaments} more to reach Advanced level!`}
                    {stats.totalTournaments >= 9 && stats.totalTournaments <= 15 && ` Organize ${16 - stats.totalTournaments} more to reach Expert level!`}
                    {stats.totalTournaments >= 16 && stats.totalTournaments <= 20 && ` Organize ${21 - stats.totalTournaments} more to reach Master level!`}
                    {stats.totalTournaments >= 21 && ' You are a Master Organizer! 🏆'}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-white/10 p-4">
              <button
                onClick={() => setShowLevelInfo(false)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
