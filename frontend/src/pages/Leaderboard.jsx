import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../api/points';
import LeaderboardTable from '../components/LeaderboardTable';
import { Globe, MapPin, Map, TrendingUp } from 'lucide-react';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('global'); // global, state, city
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Matchify Leaderboard</h1>
          </div>
          <p className="text-gray-600">Top badminton players ranked by Matchify Points</p>
        </div>

        {/* Scope Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Leaderboard Scope
          </label>
          <div className="flex space-x-4">
            {scopeButtons.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setScope(value)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition ${
                  scope === value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* City/State Filters (shown when scope is not global) */}
          {scope !== 'global' && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              {scope === 'city' && (
                <input
                  type="text"
                  placeholder="Enter city (e.g., Mumbai)"
                  value={filters.city}
                  onChange={(e) => setFilters({ ...filters, city: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
              {(scope === 'state' || scope === 'city') && (
                <input
                  type="text"
                  placeholder="Enter state (e.g., Maharashtra)"
                  value={filters.state}
                  onChange={(e) => setFilters({ ...filters, state: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-6 text-white">
            <p className="text-sm font-semibold opacity-90">Top Player</p>
            <p className="text-2xl font-bold mt-2">
              {players[0]?.name || 'N/A'}
            </p>
            <p className="text-3xl font-bold mt-1">
              {players[0]?.matchify_points.toFixed(1) || '0.0'} pts
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-6 text-white">
            <p className="text-sm font-semibold opacity-90">Total Players</p>
            <p className="text-4xl font-bold mt-4">{players.length}</p>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-6 text-white">
            <p className="text-sm font-semibold opacity-90">Your Rank</p>
            <p className="text-4xl font-bold mt-4">
              {players.findIndex(p => p.id === currentUserId) + 1 || '-'}
            </p>
          </div>
        </div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <LeaderboardTable players={players} currentUserId={currentUserId} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
