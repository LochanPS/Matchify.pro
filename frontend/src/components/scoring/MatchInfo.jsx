import React from 'react';
import { Calendar, MapPin, Users, Trophy, Gavel } from 'lucide-react';

const MatchInfo = ({ match }) => {
  if (!match) return null;

  const player1 = match.player1;
  const player2 = match.player2;
  const umpire = match.umpire;

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': 'bg-gray-500/20 border-gray-500/30 text-gray-400',
      'READY': 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      'ONGOING': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      'IN_PROGRESS': 'bg-blue-500/20 border-blue-500/30 text-blue-400',
      'COMPLETED': 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      'CANCELLED': 'bg-red-500/20 border-red-500/30 text-red-400',
    };
    return badges[status] || 'bg-gray-500/20 border-gray-500/30 text-gray-400';
  };

  const getRoundName = (round) => {
    if (round === 1) return 'Final';
    if (round === 2) return 'Semi-Final';
    if (round === 3) return 'Quarter-Final';
    if (round === 4) return 'Round of 16';
    if (round === 5) return 'Round of 32';
    return `Round ${round}`;
  };

  return (
    <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">
            Match #{match.matchNumber}
          </h2>
          <p className="text-gray-400">{getRoundName(match.round)}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusBadge(match.status)}`}>
          {match.status}
        </span>
      </div>

      {/* Players */}
      <div className="grid grid-cols-3 gap-4 items-center mb-6">
        {/* Player 1 */}
        <div className="text-center p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          {player1?.profilePhoto ? (
            <img src={player1.profilePhoto} alt={player1.name} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-blue-500/30" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{player1?.name?.charAt(0) || 'P1'}</span>
            </div>
          )}
          <p className="font-bold text-white truncate">{player1?.name || 'TBD'}</p>
          {match.player1Seed && (
            <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
              Seed {match.player1Seed}
            </span>
          )}
        </div>

        {/* VS */}
        <div className="text-center">
          <span className="text-2xl font-bold text-gray-500">VS</span>
        </div>

        {/* Player 2 */}
        <div className="text-center p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
          {player2?.profilePhoto ? (
            <img src={player2.profilePhoto} alt={player2.name} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover border-2 border-purple-500/30" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{player2?.name?.charAt(0) || 'P2'}</span>
            </div>
          )}
          <p className="font-bold text-white truncate">{player2?.name || 'TBD'}</p>
          {match.player2Seed && (
            <span className="inline-block mt-2 px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
              Seed {match.player2Seed}
            </span>
          )}
        </div>
      </div>

      {/* Umpire Info */}
      {umpire && (
        <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mb-4">
          <Gavel className="w-5 h-5 text-emerald-400" />
          <div>
            <p className="text-xs text-emerald-400">Match Official</p>
            <p className="font-semibold text-white">{umpire.name}</p>
          </div>
        </div>
      )}

      {/* Court Info */}
      {match.courtNumber && (
        <div className="flex items-center gap-3 p-3 bg-slate-700/30 border border-white/5 rounded-xl">
          <MapPin className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Court</p>
            <p className="font-semibold text-white">{match.courtNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchInfo;
