import React from 'react';
import { Calendar, MapPin, Users, Trophy } from 'lucide-react';

const MatchInfo = ({ match }) => {
  if (!match) return null;

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'bg-gray-100 text-gray-800',
      'READY': 'bg-yellow-100 text-yellow-800',
      'ONGOING': 'bg-blue-100 text-blue-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            Match #{match.matchNumber}
          </h2>
          <p className="text-gray-600">{getRoundName(match.round)}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusBadge(match.status)}`}>
          {match.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tournament Info */}
        {match.tournament && (
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Tournament</p>
              <p className="font-semibold text-gray-900">{match.tournament.name}</p>
            </div>
          </div>
        )}

        {/* Category Info */}
        {match.category && (
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="font-semibold text-gray-900">{match.category.name}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {match.tournament?.city && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-semibold text-gray-900">{match.tournament.city}</p>
            </div>
          </div>
        )}

        {/* Court */}
        {match.courtNumber && (
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <p className="text-sm text-gray-500">Court</p>
              <p className="font-semibold text-gray-900">Court {match.courtNumber}</p>
            </div>
          </div>
        )}
      </div>

      {/* Players */}
      <div className="mt-6 pt-6 border-t">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Player 1</p>
            <p className="font-bold text-lg text-gray-900">
              {match.player1Id ? `Player ${match.player1Id.substring(0, 8)}` : 'TBD'}
            </p>
            {match.player1Seed && (
              <span className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-full">
                Seed {match.player1Seed}
              </span>
            )}
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Player 2</p>
            <p className="font-bold text-lg text-gray-900">
              {match.player2Id ? `Player ${match.player2Id.substring(0, 8)}` : 'TBD'}
            </p>
            {match.player2Seed && (
              <span className="inline-block mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-full">
                Seed {match.player2Seed}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchInfo;
