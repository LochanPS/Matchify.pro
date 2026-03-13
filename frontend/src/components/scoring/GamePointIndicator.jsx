import React from 'react';
import { AlertTriangle, Trophy } from 'lucide-react';

const GamePointIndicator = ({ score, matchConfig, player1Name = 'Player 1', player2Name = 'Player 2' }) => {
  if (!score || !score.currentScore) {
    return null;
  }

  const { player1, player2 } = score.currentScore;
  const currentSet = score.currentSet || 1;
  const sets = score.sets || [];
  const config = matchConfig || score.matchConfig || { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true };
  const pointsToWin = config.pointsPerSet || 21;
  const setsToWin = config.setsToWin || 2;
  const extension = config.extension !== false;
  
  // Calculate sets won
  const player1SetsWon = sets.filter(set => set.winner === 'player1').length;
  const player2SetsWon = sets.filter(set => set.winner === 'player2').length;

  // Game point logic based on config
  const isGamePoint = (p1Score, p2Score) => {
    if (!extension) {
      // No extension: game point at pointsToWin - 1
      if (p1Score === pointsToWin - 1 && p1Score >= p2Score) return 'player1';
      if (p2Score === pointsToWin - 1 && p2Score >= p1Score) return 'player2';
    } else {
      // With extension: game point at pointsToWin - 1 or higher with lead
      if (p1Score >= pointsToWin - 1 && p1Score > p2Score) return 'player1';
      if (p2Score >= pointsToWin - 1 && p2Score > p1Score) return 'player2';
    }
    return null;
  };

  // Match point: game point + already won enough sets
  const isMatchPoint = (player) => {
    if (player === 'player1' && player1SetsWon === setsToWin - 1) return true;
    if (player === 'player2' && player2SetsWon === setsToWin - 1) return true;
    // For single set matches
    if (config.maxSets === 1) return true;
    return false;
  };

  const gamePointPlayer = isGamePoint(player1, player2);
  const matchPoint = gamePointPlayer && isMatchPoint(gamePointPlayer);

  if (!gamePointPlayer) {
    return null;
  }

  const playerName = gamePointPlayer === 'player1' ? player1Name : player2Name;

  return (
    <div className={`rounded-xl p-4 mb-6 ${
      matchPoint 
        ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 animate-pulse' 
        : 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30'
    }`}>
      <div className="flex items-center justify-center gap-3">
        {matchPoint ? (
          <>
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
            <p className="text-xl font-bold text-white">
              🏆 MATCH POINT - {playerName}! 🏆
            </p>
            <Trophy className="w-6 h-6 text-amber-400 animate-bounce" />
          </>
        ) : (
          <>
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <p className="text-xl font-bold text-amber-300">
              ⚠️ GAME POINT - {playerName}!
            </p>
            <AlertTriangle className="w-6 h-6 text-amber-400" />
          </>
        )}
      </div>
    </div>
  );
};

export default GamePointIndicator;
