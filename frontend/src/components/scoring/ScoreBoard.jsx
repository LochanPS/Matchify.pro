import React from 'react';
import { Trophy, Circle } from 'lucide-react';

const ScoreBoard = ({ score, player1Name = 'Player 1', player2Name = 'Player 2' }) => {
  if (!score) return null;

  const { currentScore, currentServer, sets } = score;

  // Calculate sets won
  const player1Sets = sets.filter(s => s.winner === 'player1').length;
  const player2Sets = sets.filter(s => s.winner === 'player2').length;

  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-2xl p-8 text-white">
      {/* Sets Won */}
      <div className="flex justify-center gap-8 mb-6">
        <div className="text-center">
          <p className="text-sm opacity-80 mb-1">Sets Won</p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  i < player1Sets ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                {i < player1Sets && <Trophy className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-80 mb-1">Sets Won</p>
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  i < player2Sets ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                {i < player2Sets && <Trophy className="w-4 h-4" />}
              </div>
            ))}
          </div>
        </div>
      </div>

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
          <p className="text-7xl font-bold">{currentScore.player1}</p>
        </div>

        {/* Separator */}
        <div className="text-center">
          <p className="text-5xl font-light opacity-50">:</p>
        </div>

        {/* Player 2 */}
        <div className={`text-left ${currentServer === 'player2' ? 'opacity-100' : 'opacity-70'}`}>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-lg font-semibold truncate">{player2Name}</p>
            {currentServer === 'player2' && (
              <Circle className="w-3 h-3 fill-yellow-400 text-yellow-400 animate-pulse" />
            )}
          </div>
          <p className="text-7xl font-bold">{currentScore.player2}</p>
        </div>
      </div>

      {/* Set History */}
      {sets.length > 0 && (
        <div className="border-t border-white/20 pt-4">
          <p className="text-sm opacity-80 mb-2 text-center">Completed Sets</p>
          <div className="flex justify-center gap-4">
            {sets.map((set, index) => (
              <div key={index} className="bg-white/10 rounded-lg px-4 py-2">
                <p className="text-xs opacity-70 mb-1">Set {set.setNumber}</p>
                <p className="text-lg font-bold">
                  {set.score.player1} - {set.score.player2}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  {set.winner === 'player1' ? player1Name : player2Name} won
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Set Indicator */}
      <div className="text-center mt-4">
        <p className="text-sm opacity-80">
          Set {score.currentSet} • {currentServer === 'player1' ? player1Name : player2Name} serving
        </p>
      </div>
    </div>
  );
};

export default ScoreBoard;
