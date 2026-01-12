import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../api/points';
import LeaderboardTable from '../components/LeaderboardTable';
import { Globe, MapPin, Map } from 'lucide-react';
import {
  TrophyIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('global');
  const [filters, setFilters] = useState({
    city: '',
    state: '',
    limit: 50
  });

  const currentUserId = JSON.parse(localStorage.getItem('user'))?.id;

  useEffect(() => {
    fetchLeaderboard();
  }, [scope, filters]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard({ scope, ...filters });
      setPlayers(data.players || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const scopeButtons = [
    { value: 'global', label: 'Global', icon: Globe },
    { value: 'state', label: 'State', icon: Map },
    { value: 'city', label: 'City', icon: MapPin }
  ];

  const userRank = players.findIndex(p => p.id === currentUserId) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors group"
          >
            <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 rounded-3xl shadow-2xl shadow-amber-500/30 mb-6">
              <TrophyIcon className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Matchify Leaderboard
            </h1>
            <p className="text-xl text-white/60 max-w-2xl mx-auto">
              Top badminton players ranked by Matchify Points
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-amber-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
              <p className="text-sm font-semibold text-white/80">Top Player</p>
            </div>
            <p className="text-2xl font-bold">{players[0]?.name || 'N/A'}</p>
            <p className="text-3xl font-black mt-1">
              {players[0]?.matchify_points?.toFixed(1) || '0.0'} pts
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white/80">Total Players</p>
            </div>
            <p className="text-4xl font-black mt-2">{players.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-xl shadow-green-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-white/80">Your Rank</p>
            </div>
            <p className="text-4xl font-black mt-2">#{userRank || '-'}</p>
          </div>
        </div>

        {/* Scope Filter */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-6 mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Leaderboard Scope
          </label>
          <div className="flex flex-wrap gap-3">
            {scopeButtons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                  scope === value
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* City/State Filters */}
          {scope !== 'global' && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {scope === 'city' && (
                <input
                  type="text"
                  placeholder="Enter city (e.g., Mumbai)"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              )}
              {(scope === 'state' || scope === 'city') && (
                <input
                  type="text"
                  placeholder="Enter state (e.g., Maharashtra)"
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
              )}
            </div>
          )}
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-16 text-center">
            <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-6 font-medium">Loading leaderboard...</p>
          </div>
        ) : players.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 p-16 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <TrophyIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No players found</h3>
            <p className="text-gray-500">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl shadow-gray-200/50 border border-white/10 overflow-hidden">
            <LeaderboardTable players={players} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
