import React from 'react';
import { AlertTriangle, Trophy } from 'lucide-react';

const GamePointIndicator = ({ score }) => {
  if (!score || !score.currentScore) {
    return null;
  }

  const { player1, player2 } = score.currentScore;
  const currentSet = score.currentSet || 1;
  const sets = score.sets || [];
  
  // Calculate sets won
  const player1SetsWon = sets.filter(set => set.winner === 'player1').length;
  const player2SetsWon = sets.filter(set => set.winner === 'player2').length;

  // Game point: 20+ points and leading by 1, or at 29
  const isGamePoint = (p1Score, p2Score) => {
    if (p1Score >= 20 && p1Score > p2Score) return 'player1';
    if (p2Score >= 20 && p2Score > p1Score) return 'player2';
    return null;
  };

  // Match point: game point + already won 1 set
  const isMatchPoint = (player) => {
    if (player === 'player1' && player1SetsWon === 1) return true;
    if (player === 'player2' && player2SetsWon === 1) return true;
    return false;
  };

  const gamePointPlayer = isGamePoint(player1, player2);
  const matchPoint = gamePointPlayer && isMatchPoint(gamePointPlayer);

  if (!gamePointPlayer) {
    return null;
  }

  return (
    <div className={`rounded-lg p-4 mb-6 ${
      matchPoint 
        ? 'bg-gradient-to-r from-red-500 to-orange-500 animate-pulse' 
        : 'bg-gradient-to-r from-yellow-400 to-orange-400'
    }`}>
      <div className="flex items-center justify-center gap-3 text-white">
        {matchPoint ? (
          <>
            <Trophy className="w-6 h-6 animate-bounce" />
            <p className="text-xl font-bold">
              🏆 MATCH POINT - {gamePointPlayer === 'player1' ? 'Player 1' : 'Player 2'}! 🏆
            </p>
            <Trophy className="w-6 h-6 animate-bounce" />
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6" />
            <p className="text-xl font-bold">
              ⚠️ GAME POINT - {gamePointPlayer === 'player1' ? 'Player 1' : 'Player 2'}!
            </p>
            <AlertTriangle className="w-6 h-6" />
          </>
        )}
      </div>
    </div>
  );
};

export default GamePointIndicator;
