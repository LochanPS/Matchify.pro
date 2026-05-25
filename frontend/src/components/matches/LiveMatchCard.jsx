import { useState, useEffect } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useNavigate } from 'react-router-dom';

const LiveMatchCard = ({ match }) => {
  const { socket } = useWebSocket();
  const navigate = useNavigate();
  const [currentScore, setCurrentScore] = useState(match.score || {});
  const [matchStatus, setMatchStatus] = useState(match.status);

  useEffect(() => {
    if (!socket) return;
    socket.emit('subscribe:match', match.id);
    socket.on(`match:scoreUpdate:${match.id}`, (updatedScore) => { setCurrentScore(updatedScore); });
    socket.on(`match:statusChange:${match.id}`, (data) => { setMatchStatus(data.status); });
    return () => {
      socket.emit('unsubscribe:match', match.id);
      socket.off(`match:scoreUpdate:${match.id}`);
      socket.off(`match:statusChange:${match.id}`);
    };
  }, [socket, match.id]);

  const getDisplayScore = () => {
    if (!currentScore?.sets || currentScore.sets.length === 0) return { player1: 0, player2: 0 };
    if (currentScore.currentScore) return { player1: currentScore.currentScore.player1 || 0, player2: currentScore.currentScore.player2 || 0 };
    const currentSet = currentScore.currentSet || currentScore.sets.length;
    const setIndex = currentSet - 1;
    if (currentScore.sets[setIndex]) return { player1: currentScore.sets[setIndex].score?.player1 || 0, player2: currentScore.sets[setIndex].score?.player2 || 0 };
    return { player1: 0, player2: 0 };
  };

  const displayScore = getDisplayScore();
  const isDoubles = match.category?.format === 'DOUBLES' || match.category?.format === 'MIXED_DOUBLES';
  const p1Leading = displayScore.player1 > displayScore.player2;
  const p2Leading = displayScore.player2 > displayScore.player1;

  return (
    <div
      onClick={() => navigate(`/matches/${match.id}/live`)}
      style={{
        background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderLeft: '3px solid #10B981',
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.35)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {match.tournament?.name || 'Unknown Tournament'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
            {match.category?.name || 'Unknown Category'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 10 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '3px 8px', fontSize: 11, fontWeight: 700, color: '#34D399' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981', animation: 'pulse 1.5s infinite', display: 'inline-block' }} />
            LIVE
          </span>
          {match.courtNumber && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              Court {match.courtNumber}
            </span>
          )}
        </div>
      </div>

      {/* Players + Scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Player 1 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#0C0900', flexShrink: 0 }}>
              P1
            </div>
            <p style={{ fontSize: 13, fontWeight: p1Leading ? 700 : 500, color: p1Leading ? '#fff' : 'rgba(255,255,255,0.65)' }}>
              {isDoubles ? 'Team 1' : (match.player1?.name || 'Player 1')}
            </p>
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: p1Leading ? '#FCD34D' : 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
            {displayScore.player1}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Player 2 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#f5f3ff', flexShrink: 0 }}>
              P2
            </div>
            <p style={{ fontSize: 13, fontWeight: p2Leading ? 700 : 500, color: p2Leading ? '#fff' : 'rgba(255,255,255,0.65)' }}>
              {isDoubles ? 'Team 2' : (match.player2?.name || 'Player 2')}
            </p>
          </div>
          <span style={{ fontSize: 24, fontWeight: 900, color: p2Leading ? '#C4B5FD' : 'rgba(255,255,255,0.5)', fontVariantNumeric: 'tabular-nums' }}>
            {displayScore.player2}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Set {currentScore.currentSet || 1} · Round {match.round}
        </span>
        <button
          onClick={e => { e.stopPropagation(); navigate(`/matches/${match.id}/live`); }}
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))',
            border: '1px solid rgba(16,185,129,0.25)',
            color: '#34D399',
            borderRadius: 8, padding: '5px 12px',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.08))'}
        >
          Watch Live →
        </button>
      </div>
    </div>
  );
};

export default LiveMatchCard;
