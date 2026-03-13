import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getTournamentMatches } from '../api/matches';
import { joinTournament, leaveTournament } from '../services/socketService';
import { Play, CheckCircle, Clock, Users, MapPin, Trophy } from 'lucide-react';

const LiveTournamentDashboard = () => {
  const { tournamentId } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, ongoing, completed, pending
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    fetchMatches();

    // Setup WebSocket for live updates
    const cleanup = joinTournament(
      tournamentId,
      (data) => {
        console.log('Tournament match update:', data);
        fetchMatches(); // Refresh match list
        setIsLiveConnected(true);
      }
    );

    return () => {
      cleanup();
      leaveTournament(tournamentId);
    };
  }, [tournamentId]);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const data = await getTournamentMatches(tournamentId);
      setMatches(data.matches || []);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': { bg: 'bg-gray-100', text: 'text-gray-800', icon: Clock },
      'READY': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      'ONGOING': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Play },
      'IN_PROGRESS': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Play },
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
    };
    return badges[status] || badges['PENDING'];
  };

  const getRoundName = (round) => {
    const rounds = {
      1: 'Round of 32',
      2: 'Round of 16',
      3: 'Quarter-Final',
      4: 'Semi-Final',
      5: 'Final',
    };
    return rounds[round] || `Round ${round}`;
  };

  const filteredMatches = matches.filter(match => {
    if (filter === 'all') return true;
    if (filter === 'ongoing') return match.status === 'ONGOING' || match.status === 'IN_PROGRESS';
    if (filter === 'completed') return match.status === 'COMPLETED';
    if (filter === 'pending') return match.status === 'PENDING' || match.status === 'READY';
    return true;
  });

  const stats = {
    total: matches.length,
    ongoing: matches.filter(m => m.status === 'ONGOING' || m.status === 'IN_PROGRESS').length,
    completed: matches.filter(m => m.status === 'COMPLETED').length,
    pending: matches.filter(m => m.status === 'PENDING' || m.status === 'READY').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Live Tournament Dashboard</h1>
            <p className="text-gray-600">Real-time match updates and status</p>
          </div>
          {isLiveConnected && (
            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-full">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
              <span className="text-sm font-semibold">LIVE</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Matches</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Trophy className="w-12 h-12 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Ongoing</p>
                <p className="text-3xl font-bold text-blue-600">{stats.ongoing}</p>
              </div>
              <Play className="w-12 h-12 text-blue-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-600">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('ongoing')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'ongoing'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ongoing ({stats.ongoing})
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'completed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Completed ({stats.completed})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
          </div>
        </div>

        {/* Matches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match) => {
            const statusInfo = getStatusBadge(match.status);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={match.id}
                className="bg-white rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => window.location.href = `/watch/${match.id}`}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Match #{match.matchNumber}</p>
                      <p className="font-semibold text-gray-900">{getRoundName(match.round)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${statusInfo.bg} ${statusInfo.text}`}>
                      <StatusIcon className="w-3 h-3" />
                      {match.status}
                    </span>
                  </div>

                  {/* Category */}
                  {match.category && (
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-sm text-gray-600">{match.category.name}</p>
                    </div>
                  )}

                  {/* Court */}
                  {match.courtNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span>Court {match.courtNumber}</span>
                    </div>
                  )}

                  {/* Score */}
                  {match.scoreJson && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Current Score</span>
                        <span className="text-lg font-bold text-blue-600">
                          {match.scoreJson.currentScore?.player1 || 0} - {match.scoreJson.currentScore?.player2 || 0}
                        </span>
                      </div>
                      {match.scoreJson.currentSet && (
                        <p className="text-xs text-gray-600 mt-1">Set {match.scoreJson.currentSet}</p>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      window.location.href = `/watch/${match.id}`;
                    }}
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    {match.status === 'ONGOING' || match.status === 'IN_PROGRESS' ? 'Watch Live' : 'View Match'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMatches.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No matches found</p>
            <p className="text-gray-500 text-sm mt-2">
              {filter !== 'all' && 'Try changing the filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTournamentDashboard;
