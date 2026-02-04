import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import {
  TrophyIcon,
  ChartBarIcon,
  CalendarIcon,
  MapPinIcon,
  PhoneIcon,
  UserIcon,
  ArrowRightIcon,
  SparklesIcon,
  FireIcon,
  BoltIcon,
  StarIcon,
  InformationCircleIcon,
  XMarkIcon,
  EnvelopeIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerCode, setPlayerCode] = useState(null);
  const [showLevelInfo, setShowLevelInfo] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    fetchPlayerData();
    fetchPlayerCode();
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/auth/me');
      setUserProfile(response.data.user);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchPlayerData = async () => {
    try {
      const regResponse = await api.get('/registrations/my');
      setRegistrations(regResponse.data.registrations || []);
    } catch (error) {
      console.error('Error fetching player data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerCode = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user?.playerCode) {
        setPlayerCode(response.data.user.playerCode);
      }
    } catch (error) {
      console.error('Error fetching player code:', error);
    }
  };

  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role];
  const winRate = (user?.matchesWon || 0) + (user?.matchesLost || 0) > 0
    ? Math.round((user?.matchesWon / ((user?.matchesWon || 0) + (user?.matchesLost || 0))) * 100)
    : 0;

  // Calculate experience level based on tournaments played
  const getExperienceLevel = (tournaments) => {
    if (tournaments === 0) return 'New Player';
    if (tournaments >= 1 && tournaments <= 3) return 'Beginner';
    if (tournaments >= 4 && tournaments <= 8) return 'Intermediate';
    if (tournaments >= 9 && tournaments <= 15) return 'Advanced';
    if (tournaments >= 16 && tournaments <= 25) return 'Expert';
    return 'Master';
  };

  const getStarCount = (tournaments) => {
    if (tournaments === 0) return 0;
    if (tournaments >= 1 && tournaments <= 3) return 1;
    if (tournaments >= 4 && tournaments <= 8) return 2;
    if (tournaments >= 9 && tournaments <= 15) return 3;
    if (tournaments >= 16 && tournaments <= 25) return 4;
    return 5;
  };

  const experienceLevel = getExperienceLevel(user?.tournamentsPlayed || 0);
  const starCount = getStarCount(user?.tournamentsPlayed || 0);

  // Calculate additional stats
  const memberSince = userProfile?.createdAt 
    ? new Date(userProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'N/A';

  const daysActive = userProfile?.createdAt
    ? Math.floor((new Date() - new Date(userProfile.createdAt)) / (1000 * 60 * 60 * 24))
    : 0;

  const averageTournamentsPerMonth = userProfile?.createdAt && (user?.tournamentsPlayed || 0) > 0
    ? Math.round(((user?.tournamentsPlayed || 0) / (daysActive / 30)) * 10) / 10
    : 0;

  const stats = [
    { 
      label: 'Total Points', 
      value: user?.totalPoints || 0, 
      icon: SparklesIcon,
      color: 'from-amber-500 to-orange-600'
    },
    { 
      label: 'Tournaments', 
      value: user?.tournamentsPlayed || 0, 
      icon: TrophyIcon,
      color: 'from-purple-500 to-violet-600'
    },
    { 
      label: 'Matches Won', 
      value: user?.matchesWon || 0, 
      icon: FireIcon,
      color: 'from-green-500 to-emerald-600'
    },
    { 
      label: 'Win Rate', 
      value: `${winRate}%`, 
      icon: BoltIcon,
      color: 'from-blue-500 to-cyan-600'
    },
  ];

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
            {/* Profile Info */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-emerald-500/30">
                  {user?.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    user?.name?.charAt(0)?.toUpperCase() || 'P'
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🏸</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-white">{user?.name}</h1>
                  <div className="flex gap-2">
                    {userRoles.map((role, index) => (
                      <span key={index} className="px-3 py-1 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-medium rounded-full border border-white/20">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-white/60">{user?.email}</p>
                <div className="flex items-center gap-4 mt-3 text-white/50 text-sm">
                  {user?.city && (
                    <span className="flex items-center gap-1">
                      <MapPinIcon className="w-4 h-4" />
                      {user.city}, {user.state}
                    </span>
                  )}
                  {user?.phone && (
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="w-4 h-4" />
                      +91 {user.phone}
                    </span>
                  )}
                </div>
                {/* Player Code - Show for all players */}
                {playerCode && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                    <span className="text-blue-400/80 text-sm">Player Code:</span>
                    <span className="text-blue-400 font-mono font-bold text-lg tracking-wider">{playerCode}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(playerCode)}
                      className="p-1.5 hover:bg-blue-500/20 rounded-lg transition-colors ml-1"
                      title="Copy code"
                    >
                      <svg className="w-4 h-4 text-amber-400/60 hover:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Edit Profile Button */}
            <Link
              to="/profile"
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <UserIcon className="w-5 h-5" />
              Edit Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className={`inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Player Profile Details - 3 Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Profile Information */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Profile Information</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">Full Name</p>
                <p className="text-white font-medium">{userProfile?.name || user?.name || 'N/A'}</p>
              </div>
              
              {(userProfile?.email || user?.email) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Email Address</p>
                  <p className="text-white font-medium text-sm break-all">{userProfile?.email || user?.email}</p>
                </div>
              )}
              
              {(userProfile?.phone || user?.phone) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Phone Number</p>
                  <p className="text-white font-medium">{userProfile?.phone || user?.phone}</p>
                </div>
              )}
              
              {((userProfile?.city || user?.city) || (userProfile?.state || user?.state)) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Location</p>
                  <p className="text-white font-medium">
                    {[userProfile?.city || user?.city, userProfile?.state || user?.state, userProfile?.country || user?.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
              
              {(userProfile?.gender || user?.gender) && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Gender</p>
                  <p className="text-white font-medium capitalize">{userProfile?.gender || user?.gender}</p>
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
                <ChartBarIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Performance Stats</h3>
            </div>
            
            <div className="space-y-6">
              {/* Win Rate */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-sm">Win Rate</p>
                  <p className="text-green-400 font-bold text-lg">{winRate}%</p>
                </div>
                <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500"
                    style={{ width: `${winRate}%` }}
                  ></div>
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {user?.matchesWon || 0} wins of {(user?.matchesWon || 0) + (user?.matchesLost || 0)} matches
                </p>
              </div>

              {/* Average Tournaments Per Month */}
              <div>
                <p className="text-gray-400 text-sm mb-2">Avg Tournaments/Month</p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-bold text-orange-400">{averageTournamentsPerMonth}</p>
                  <p className="text-gray-500 text-sm mb-1">tournaments</p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <FireIcon className="w-4 h-4 text-orange-400" />
                  <p className="text-gray-500 text-xs">
                    {averageTournamentsPerMonth > 2 ? 'Highly active' : 
                     averageTournamentsPerMonth > 1 ? 'Active' : 'Getting started'}
                  </p>
                </div>
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
                    <InformationCircleIcon className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
                <p className="text-2xl font-bold text-amber-400 mb-2">{experienceLevel}</p>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
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
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">Activity & Status</h3>
            </div>
            
            <div className="space-y-4">
              {/* Current Status */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-sm">Current Status</p>
                  <div className={`w-3 h-3 rounded-full ${
                    registrations.length > 0 ? 'bg-green-500 animate-pulse' : 
                    (user?.tournamentsPlayed || 0) > 0 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}></div>
                </div>
                <p className="text-white font-bold text-lg">
                  {registrations.length > 0 ? 'Active' : 
                   (user?.tournamentsPlayed || 0) > 0 ? 'Inactive' : 'New'}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {registrations.length > 0 ? `${registrations.length} active registrations` : 
                   (user?.tournamentsPlayed || 0) > 0 ? 'No active registrations' : 'Join your first tournament'}
                </p>
              </div>

              {/* Total Points */}
              <div className="bg-slate-700/50 rounded-xl p-4">
                <p className="text-gray-400 text-sm mb-2">Matchify Points</p>
                <p className="text-3xl font-bold text-amber-400">{user?.totalPoints || 0}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Rank #{user?.rank || '---'}
                </p>
              </div>

              {/* Achievements */}
              <div>
                <p className="text-gray-400 text-sm mb-3">Achievements</p>
                <div className="space-y-2">
                  {(user?.tournamentsPlayed || 0) >= 1 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🎯</span>
                      <span className="text-white">First Tournament</span>
                    </div>
                  )}
                  {(user?.tournamentsPlayed || 0) >= 3 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">⭐</span>
                      <span className="text-white">3 Tournaments</span>
                    </div>
                  )}
                  {(user?.tournamentsPlayed || 0) >= 10 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🏆</span>
                      <span className="text-white">10 Tournaments</span>
                    </div>
                  )}
                  {(user?.matchesWon || 0) >= 10 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">🔥</span>
                      <span className="text-white">10 Wins</span>
                    </div>
                  )}
                  {(user?.tournamentsPlayed || 0) >= 25 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">💎</span>
                      <span className="text-white">25 Tournaments</span>
                    </div>
                  )}
                  {(user?.tournamentsPlayed || 0) >= 50 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-lg">👑</span>
                      <span className="text-white">Master Player</span>
                    </div>
                  )}
                  {(user?.tournamentsPlayed || 0) === 0 && (
                    <p className="text-gray-500 text-xs">Play tournaments to earn achievements</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Match History */}
          <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white">Recent Activity</h3>
              </div>
              <Link
                to="/registrations"
                className="text-amber-400 hover:text-amber-300 text-sm font-medium flex items-center gap-1"
              >
                View All
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : registrations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">🏸</span>
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">No activity yet</h4>
                  <p className="text-gray-400 mb-6">Start your journey by joining a tournament!</p>
                  <Link
                    to="/tournaments"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-amber-500/25 transition-all"
                  >
                    <TrophyIcon className="w-5 h-5" />
                    Find Tournaments
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {registrations.slice(0, 5).map((reg, index) => (
                    <div
                      key={reg.id}
                      className="flex items-center justify-between p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Link 
                          to={`/tournaments/${reg.tournament?.id}`}
                          className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center hover:scale-110 transition-transform"
                        >
                          <span className="text-xl">🏆</span>
                        </Link>
                        <div>
                          <Link 
                            to={`/tournaments/${reg.tournament?.id}`}
                            className="font-semibold text-white hover:text-amber-400 transition-colors"
                          >
                            {reg.tournament?.name || 'Tournament'}
                          </Link>
                          <p className="text-sm text-gray-400">
                            {reg.category?.name || 'Category'} • {new Date(reg.createdAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <span className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                        reg.status === 'confirmed' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : reg.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : reg.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-600/50 text-gray-400'
                      }`}>
                        {reg.status?.charAt(0).toUpperCase() + reg.status?.slice(1)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Leaderboard Preview */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/tournaments"
                  className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-purple-500/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrophyIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Browse Tournaments</p>
                    <p className="text-sm text-gray-400">Find your next competition</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
                </Link>

                <Link
                  to="/leaderboard"
                  className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl border border-white/5 hover:border-amber-500/50 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ChartBarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-white">Leaderboard</p>
                    <p className="text-sm text-gray-400">Check your ranking</p>
                  </div>
                  <ArrowRightIcon className="w-5 h-5 text-gray-500 group-hover:translate-x-1 group-hover:text-amber-400 transition-all" />
                </Link>
              </div>
            </div>

            {/* Achievement Card */}
            <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
              
              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <StarIcon className="w-6 h-6 text-yellow-400" />
                  <span className="text-white/80 text-sm font-medium">Your Rank</span>
                </div>
                <p className="text-4xl font-bold mb-2">#{user?.rank || '---'}</p>
                <p className="text-white/60 text-sm">
                  {user?.totalPoints || 0} Matchify Points
                </p>
                <Link
                  to="/my-points"
                  className="inline-flex items-center gap-2 mt-4 text-sm text-white/80 hover:text-white transition-colors"
                >
                  View Points History
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Experience Level Info Modal */}
      {showLevelInfo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <StarIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Player Experience Levels</h3>
              </div>
              <button
                onClick={() => setShowLevelInfo(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-gray-300 mb-6">
                Your experience level is determined by the total number of tournaments you've played. 
                Each level comes with a star rating to showcase your journey.
              </p>

              {/* Level Cards */}
              <div className="space-y-3">
                {/* New Player */}
                <div className="bg-slate-700/50 border border-white/10 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-gray-300">New Player</h4>
                      <p className="text-sm text-gray-400">0 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Just getting started! Join your first tournament to earn your first star.
                  </p>
                </div>

                {/* Beginner */}
                <div className="bg-slate-700/50 border border-amber-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-amber-400">Beginner</h4>
                      <p className="text-sm text-gray-400">1-3 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(4)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Building foundational skills and learning competitive play.
                  </p>
                </div>

                {/* Intermediate */}
                <div className="bg-slate-700/50 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-blue-400">Intermediate</h4>
                      <p className="text-sm text-gray-400">4-8 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(3)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Gaining confidence and developing consistent performance.
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
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      {[...Array(2)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-gray-600" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Experienced player with solid tournament track record.
                  </p>
                </div>

                {/* Expert */}
                <div className="bg-slate-700/50 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-green-400">Expert</h4>
                      <p className="text-sm text-gray-400">16-25 tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-amber-400 fill-amber-400" />
                      <StarIcon className="w-5 h-5 text-gray-600" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Highly experienced player with competitive excellence.
                  </p>
                </div>

                {/* Master */}
                <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="text-lg font-bold text-yellow-400">Master</h4>
                      <p className="text-sm text-gray-400">26+ tournaments</p>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">
                    Elite player with extensive tournament experience and exceptional skills.
                  </p>
                </div>
              </div>

              {/* Current Progress */}
              {(user?.tournamentsPlayed || 0) > 0 && (
                <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrophyIcon className="w-5 h-5 text-blue-400" />
                    <h4 className="font-bold text-white">Your Progress</h4>
                  </div>
                  <p className="text-gray-300">
                    You've played <span className="font-bold text-blue-400">{user?.tournamentsPlayed || 0}</span> {(user?.tournamentsPlayed || 0) === 1 ? 'tournament' : 'tournaments'}.
                    {(user?.tournamentsPlayed || 0) < 4 && ` Play ${4 - (user?.tournamentsPlayed || 0)} more to reach Intermediate level!`}
                    {(user?.tournamentsPlayed || 0) >= 4 && (user?.tournamentsPlayed || 0) < 9 && ` Play ${9 - (user?.tournamentsPlayed || 0)} more to reach Advanced level!`}
                    {(user?.tournamentsPlayed || 0) >= 9 && (user?.tournamentsPlayed || 0) < 16 && ` Play ${16 - (user?.tournamentsPlayed || 0)} more to reach Expert level!`}
                    {(user?.tournamentsPlayed || 0) >= 16 && (user?.tournamentsPlayed || 0) < 26 && ` Play ${26 - (user?.tournamentsPlayed || 0)} more to reach Master level!`}
                    {(user?.tournamentsPlayed || 0) >= 26 && ' You are a Master Player! 🏆'}
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
};

export default PlayerDashboard;
