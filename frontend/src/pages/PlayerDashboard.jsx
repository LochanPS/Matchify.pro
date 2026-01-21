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
  BoltIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';

const PlayerDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [umpireCode, setUmpireCode] = useState(null);

  useEffect(() => {
    fetchPlayerData();
    fetchUmpireCode();
  }, []);

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

  const fetchUmpireCode = async () => {
    try {
      const response = await api.get('/auth/me');
      if (response.data.user?.umpireCode) {
        setUmpireCode(response.data.user.umpireCode);
      }
    } catch (error) {
      console.error('Error fetching umpire code:', error);
    }
  };

  const userRoles = Array.isArray(user?.roles) ? user.roles : [user?.role];
  const winRate = (user?.matchesWon || 0) + (user?.matchesLost || 0) > 0
    ? Math.round((user?.matchesWon / ((user?.matchesWon || 0) + (user?.matchesLost || 0))) * 100)
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
                {/* Umpire Code - Show if user is an umpire */}
                {umpireCode && (
                  <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                    <span className="text-amber-400/80 text-sm">Umpire Code:</span>
                    <span className="text-amber-400 font-mono font-bold text-lg tracking-wider">{umpireCode}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(umpireCode)}
                      className="p-1.5 hover:bg-amber-500/20 rounded-lg transition-colors ml-1"
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
    </div>
  );
};

export default PlayerDashboard;
