import React from 'react';
import { Trophy, Zap } from 'lucide-react';

const ScoreBoard = ({ score, player1Name = 'Player 1', player2Name = 'Player 2', matchConfig }) => {
  if (!score) return null;

  const { currentServer, sets } = score;
  const config = matchConfig || score.matchConfig || { pointsPerSet: 21, setsToWin: 2, maxSets: 3 };
  const maxSets = config.maxSets || 3;
  const setsToWin = config.setsToWin || Math.ceil(maxSets / 2);

  // Derive current score from sets array — MatchScoringPage writes sets[currentSet].player1/player2
  // (no top-level currentScore field exists in the live score JSON)
  const currentSetIdx = score.currentSet || 0;
  const currentSetData = sets?.[currentSetIdx] || { player1: 0, player2: 0 };
  const currentScore = score.currentScore || currentSetData; // backward compat if ever added

  // Winners are stored as integers (1 or 2) by MatchScoringPage — handle both int and legacy string
  const isP1Winner = (s) => s.winner === 1 || s.winner === 'player1';
  const isP2Winner = (s) => s.winner === 2 || s.winner === 'player2';
  const player1Sets = sets?.filter(isP1Winner).length || 0;
  const player2Sets = sets?.filter(isP2Winner).length || 0;

  const p1Score = currentScore?.player1 ?? 0;
  const p2Score = currentScore?.player2 ?? 0;
  const p1Leading = p1Score > p2Score;
  const p2Leading = p2Score > p1Score;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0C1220 0%, #0A0F1A 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      {/* Sets Won Row */}
      {maxSets > 1 && (
        <div className="flex justify-between items-center mb-5 px-2">
          {/* P1 set dots */}
          <div className="flex gap-2">
            {Array.from({ length: setsToWin }).map((_, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < player1Sets ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.06)',
                border: i < player1Sets ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: i < player1Sets ? '0 0 8px rgba(245,158,11,0.35)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {i < player1Sets && <Trophy style={{ width: 12, height: 12, color: '#0C0900' }} />}
              </div>
            ))}
          </div>

          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>
            Sets
          </span>

          {/* P2 set dots */}
          <div className="flex gap-2">
            {Array.from({ length: setsToWin }).map((_, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: '50%',
                background: i < player2Sets ? 'linear-gradient(135deg, #8B5CF6, #7C3AED)' : 'rgba(255,255,255,0.06)',
                border: i < player2Sets ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: i < player2Sets ? '0 0 8px rgba(139,92,246,0.35)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {i < player2Sets && <Trophy style={{ width: 12, height: 12, color: '#f5f3ff' }} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Score Display */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        {/* Player 1 */}
        <div style={{
          textAlign: 'right',
          opacity: currentServer === 'player2' ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 4 }}>
            {currentServer === 'player1' && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#F59E0B',
                boxShadow: '0 0 8px rgba(245,158,11,0.8)',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{player1Name}</p>
          </div>
          <div style={{
            fontSize: 'clamp(56px, 12vw, 88px)',
            fontWeight: 900,
            lineHeight: 1,
            background: p1Leading
              ? 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)'
              : 'linear-gradient(135deg, rgba(252,211,77,0.5) 0%, rgba(245,158,11,0.5) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: p1Leading ? 'drop-shadow(0 0 12px rgba(245,158,11,0.4))' : 'none',
            transition: 'all 0.2s ease',
            fontVariantNumeric: 'tabular-nums'
          }}>{p1Score}</div>
        </div>

        {/* Separator */}
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 40, fontWeight: 300, color: 'rgba(255,255,255,0.15)', lineHeight: 1 }}>:</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
            Set {score.currentSet || 1}
          </p>
        </div>

        {/* Player 2 */}
        <div style={{
          textAlign: 'left',
          opacity: currentServer === 'player1' ? 0.6 : 1,
          transition: 'opacity 0.3s'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
              maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>{player2Name}</p>
            {currentServer === 'player2' && (
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: '#8B5CF6',
                boxShadow: '0 0 8px rgba(139,92,246,0.8)',
                animation: 'pulse 1.5s infinite'
              }} />
            )}
          </div>
          <div style={{
            fontSize: 'clamp(56px, 12vw, 88px)',
            fontWeight: 900,
            lineHeight: 1,
            background: p2Leading
              ? 'linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)'
              : 'linear-gradient(135deg, rgba(196,181,253,0.5) 0%, rgba(139,92,246,0.5) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: p2Leading ? 'drop-shadow(0 0 12px rgba(139,92,246,0.4))' : 'none',
            transition: 'all 0.2s ease',
            fontVariantNumeric: 'tabular-nums'
          }}>{p2Score}</div>
        </div>
      </div>

      {/* Server indicator text */}
      <div style={{ textAlign: 'center', marginBottom: sets && sets.length > 0 ? 16 : 0 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 20, padding: '4px 12px'
        }}>
          <Zap style={{ width: 12, height: 12, color: '#F59E0B' }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 500 }}>
            {currentServer === 'player1' ? player1Name : player2Name} serving
          </span>
        </div>
      </div>

      {/* Set History */}
      {sets && sets.length > 0 && (
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 16,
          marginTop: 4
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'center', marginBottom: 10 }}>
            Completed Sets
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
            {sets.map((set, index) => (
              <div key={index} style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '8px 14px',
                textAlign: 'center',
                minWidth: 80
              }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Set {set.setNumber}
                </p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                  <span style={{ color: isP1Winner(set) ? '#FCD34D' : 'rgba(255,255,255,0.5)' }}>{set.player1 ?? set.score?.player1 ?? 0}</span>
                  <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>–</span>
                  <span style={{ color: isP2Winner(set) ? '#C4B5FD' : 'rgba(255,255,255,0.5)' }}>{set.player2 ?? set.score?.player2 ?? 0}</span>
                </p>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 3 }}>
                  {isP1Winner(set) ? '🟡' : '🟣'} {isP1Winner(set) ? player1Name.split(' ')[0] : player2Name.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreBoard;
