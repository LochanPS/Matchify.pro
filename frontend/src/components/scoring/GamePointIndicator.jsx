import React from 'react';
import { AlertTriangle, Trophy } from 'lucide-react';

const GamePointIndicator = ({ score, matchConfig, player1Name = 'Player 1', player2Name = 'Player 2' }) => {
  if (!score || !score.currentScore) return null;

  const { player1, player2 } = score.currentScore;
  const currentSet = score.currentSet || 1;
  const sets = score.sets || [];
  const config = matchConfig || score.matchConfig || { pointsPerSet: 21, setsToWin: 2, maxSets: 3, extension: true };
  const pointsToWin = config.pointsPerSet || 21;
  const setsToWin = config.setsToWin || 2;
  const extension = config.extension !== false;

  const player1SetsWon = sets.filter(set => set.winner === 'player1').length;
  const player2SetsWon = sets.filter(set => set.winner === 'player2').length;

  const isGamePoint = (p1Score, p2Score) => {
    if (!extension) {
      if (p1Score === pointsToWin - 1 && p1Score >= p2Score) return 'player1';
      if (p2Score === pointsToWin - 1 && p2Score >= p1Score) return 'player2';
    } else {
      if (p1Score >= pointsToWin - 1 && p1Score > p2Score) return 'player1';
      if (p2Score >= pointsToWin - 1 && p2Score > p1Score) return 'player2';
    }
    return null;
  };

  const isMatchPoint = (player) => {
    if (player === 'player1' && player1SetsWon === setsToWin - 1) return true;
    if (player === 'player2' && player2SetsWon === setsToWin - 1) return true;
    if (config.maxSets === 1) return true;
    return false;
  };

  const gamePointPlayer = isGamePoint(player1, player2);
  const matchPoint = gamePointPlayer && isMatchPoint(gamePointPlayer);

  if (!gamePointPlayer) return null;

  const playerName = gamePointPlayer === 'player1' ? player1Name : player2Name;

  if (matchPoint) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.08))',
        border: '1px solid rgba(245,158,11,0.4)',
        borderRadius: 14,
        padding: '14px 20px',
        marginBottom: 16,
        textAlign: 'center',
        boxShadow: '0 0 24px rgba(245,158,11,0.12)',
        animation: 'pulse 1.5s infinite'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Trophy style={{ width: 22, height: 22, color: '#F59E0B' }} />
          <p style={{ fontSize: 18, fontWeight: 900, color: '#FCD34D', margin: 0, letterSpacing: '0.02em' }}>
            🏆 MATCH POINT — {playerName}!
          </p>
          <Trophy style={{ width: 22, height: 22, color: '#F59E0B' }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'rgba(245,158,11,0.08)',
      border: '1px solid rgba(245,158,11,0.25)',
      borderRadius: 14,
      padding: '12px 20px',
      marginBottom: 16,
      textAlign: 'center'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <AlertTriangle style={{ width: 18, height: 18, color: '#F59E0B' }} />
        <p style={{ fontSize: 16, fontWeight: 800, color: '#FCD34D', margin: 0 }}>
          GAME POINT — {playerName}
        </p>
        <AlertTriangle style={{ width: 18, height: 18, color: '#F59E0B' }} />
      </div>
    </div>
  );
};

export default GamePointIndicator;
