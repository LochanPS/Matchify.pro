import React from 'react';
import { Trophy, Circle } from 'lucide-react';

const ScoreBoard = ({ score, player1Name = 'Player 1', player2Name = 'Player 2', matchConfig }) => {
  if (!score) return null;

  const { currentScore, currentServer, sets } = score;
  const config = matchConfig || score.matchConfig || { pointsPerSet: 21, setsToWin: 2, maxSets: 3 };
  const maxSets = config.maxSets || 3;
  const setsToWin = config.setsToWin || Math.ceil(maxSets / 2);

  // Calculate sets won
  const player1Sets = sets?.filter(s => s.winner === 'player1').length || 0;
  const player2Sets = sets?.filter(s => s.winner === 'player2').length || 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-xl shadow-2xl p-8 text-white">
      {/* Sets Won - only show if more than 1 set */}
      {maxSets > 1 && (
        <div className="flex justify-center gap-8 mb-6">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Sets Won</p>
            <div className="flex gap-2">
              {Array.from({ length: setsToWin }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < player1Sets ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  {i < player1Sets && <Trophy className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">Sets Won</p>
            <div className="flex gap-2">
              {Array.from({ length: setsToWin }).map((_, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    i < player2Sets ? 'bg-emerald-500' : 'bg-white/10'
                  }`}
                >
                  {i < player2Sets && <Trophy className="w-4 h-4" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Score */}
      <div className="grid grid-cols-3 gap-4 items-center mb-6">
        {/* Player 1 */}
        <div className={`text-right ${currentServer === 'player1' ? 'opacity-100' : 'opacity-70'}`}>
          <div className="flex items-center justify-end gap-2 mb-2">
            {currentServer === 'player1' && (
              <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400 animate-pulse" />
            )}
            <p className="text-lg font-semibold truncate">{player1Name}</p>
          </div>
          <p className="text-7xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{currentScore?.player1 || 0}</p>
        </div>

        {/* Separator */}
        <div className="text-center">
          <p className="text-5xl font-light text-gray-500">:</p>
        </div>

        {/* Player 2 */}
        <div className={`text-left ${currentServer === 'player2' ? 'opacity-100' : 'opacity-70'}`}>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-lg font-semibold truncate">{player2Name}</p>
            {currentServer === 'player2' && (
              <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400 animate-pulse" />
            )}
          </div>
          <p className="text-7xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">{currentScore?.player2 || 0}</p>
        </div>
      </div>

      {/* Set History */}
      {sets && sets.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <p className="text-sm text-gray-400 mb-2 text-center">Completed Sets</p>
          <div className="flex justify-center gap-4">
            {sets.map((set, index) => (
              <div key={index} className="bg-white/5 border border-white/10 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-500 mb-1">Set {set.setNumber}</p>
                <p className="text-lg font-bold text-white">
                  {set.score.player1} - {set.score.player2}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {set.winner === 'player1' ? player1Name : player2Name} won
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Set Indicator */}
      <div className="text-center mt-4">
        <p className="text-sm text-gray-400">
          {maxSets === 1 ? 'Single Set' : `Set ${score.currentSet || 1}`} • {currentServer === 'player1' ? player1Name : player2Name} serving
        </p>
      </div>
    </div>
  );
};

export default ScoreBoard;
