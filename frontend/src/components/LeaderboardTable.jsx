import React from 'react';
import { Trophy, Medal, Award } from 'lucide-react';

const LeaderboardTable = ({ players, currentUserId }) => {
  const getRankIcon = (rank) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-orange-600" />;
    return null;
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return 'bg-yellow-100 text-yellow-800';
    if (rank === 2) return 'bg-gray-100 text-gray-800';
    if (rank === 3) return 'bg-orange-100 text-orange-800';
    return 'bg-blue-50 text-blue-700';
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Player</th>
            <th className="px-6 py-3 text-center text-sm font-semibold">Points</th>
            <th className="px-6 py-3 text-center text-sm font-semibold">Tournaments</th>
            <th className="px-6 py-3 text-center text-sm font-semibold">Win Rate</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Location</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {players.map((player, index) => {
            const rank = index + 1;
            const isCurrentUser = player.id === currentUserId;
            
            return (
              <tr 
                key={player.id}
                className={`hover:bg-gray-50 transition ${isCurrentUser ? 'bg-blue-50' : ''}`}
              >
                {/* Rank */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(rank)}
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getRankBadge(rank)}`}>
                      #{rank}
                    </span>
                  </div>
                </td>

                {/* Player Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={player.photo || `https://ui-avatars.com/api/?name=${player.name}`}
                      alt={player.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {player.name}
                        {isCurrentUser && (
                          <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                            You
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">{player.email}</p>
                    </div>
                  </div>
                </td>

                {/* Points */}
                <td className="px-6 py-4 text-center">
                  <span className="text-2xl font-bold text-blue-600">
                    {player.matchify_points.toFixed(1)}
                  </span>
                </td>

                {/* Tournaments */}
                <td className="px-6 py-4 text-center">
                  <span className="text-lg font-semibold text-gray-700">
                    {player.tournaments_played}
                  </span>
                </td>

                {/* Win Rate */}
                <td className="px-6 py-4 text-center">
                  <span className="text-lg font-semibold text-green-600">
                    {player.win_rate ? `${player.win_rate}%` : 'N/A'}
                  </span>
                </td>

                {/* Location */}
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-700">{player.city}</p>
                  <p className="text-xs text-gray-500">{player.state}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {players.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No players found in this region
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
