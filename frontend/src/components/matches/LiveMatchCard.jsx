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
    if (currentScore.currentScore) return {
      player1: currentScore.currentScore.player1 || 0,
      player2: currentScore.currentScore.player2 || 0,
    };
    const currentSet = currentScore.currentSet || currentScore.sets.length;
    const setIndex = currentSet - 1;
    if (currentScore.sets[setIndex]) return {
      player1: currentScore.sets[setIndex].score?.player1 || 0,
      player2: currentScore.sets[setIndex].score?.player2 || 0,
    };
    return { player1: 0, player2: 0 };
  };

  const displayScore = getDisplayScore();

  const fmt = match.category?.format?.toLowerCase() || '';
  const isDoubles = fmt === 'doubles' || fmt === 'mixed_doubles';

  const p1Name    = match.player1?.name        || 'Player 1';
  const p1Partner = match.player1?.partnerName  || null;
  const p2Name    = match.player2?.name        || 'Player 2';
  const p2Partner = match.player2?.partnerName  || null;

  return (
    <div
      onClick={() => navigate(`/matches/${match.id}/live`)}
      style={{
        background: '#07121e',
        border: '1.5px solid rgba(245,158,11,0.22)',
        borderLeft: '3px solid #F59E0B',
        borderRadius: 14,
        padding: 16,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.5)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.45), 0 0 16px rgba(245,158,11,0.07)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(245,158,11,0.22)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.35)';
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, color: '#ffffff',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {match.tournament?.name || 'Unknown Tournament'}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            {match.category?.name || 'Unknown Category'}
            {isDoubles && (
              <span style={{ marginLeft: 5, color: 'rgba(245,158,11,0.65)', fontWeight: 600 }}>
                · Doubles
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 10 }}>
          {/* LIVE badge */}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: '3px 8px',
            fontSize: 11, fontWeight: 700, color: '#FCD34D',
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#F59E0B', display: 'inline-block',
              animation: 'pulse 1.5s infinite',
            }} />
            LIVE
          </span>
          {match.courtNumber && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              Court {match.courtNumber}
            </span>
          )}
        </div>
      </div>

      {/* Players + Scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Player 1 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#0C0900',
            }}>
              P1
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: '#ffffff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: '1.3', margin: 0,
              }}>
                {p1Name}
              </p>
              {isDoubles && p1Partner && (
                <p style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: '1.3', margin: '2px 0 0',
                }}>
                  &amp; {p1Partner}
                </p>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 24, fontWeight: 900, color: '#FCD34D',
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            {displayScore.player1}
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

        {/* Player 2 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, color: '#f5f3ff',
            }}>
              P2
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 13, fontWeight: 600, color: '#ffffff',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                lineHeight: '1.3', margin: 0,
              }}>
                {p2Name}
              </p>
              {isDoubles && p2Partner && (
                <p style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 400,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  lineHeight: '1.3', margin: '2px 0 0',
                }}>
                  &amp; {p2Partner}
                </p>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 24, fontWeight: 900, color: '#FCD34D',
            fontVariantNumeric: 'tabular-nums', flexShrink: 0,
          }}>
            {displayScore.player2}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 12, paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
          Set {currentScore.currentSet || 1} · Round {match.round}
        </span>
        <button
          onClick={e => { e.stopPropagation(); navigate(`/matches/${match.id}/live`); }}
          style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.28)',
            color: '#FCD34D',
            borderRadius: 8, padding: '5px 12px',
            fontSize: 11, fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.1)'}
        >
          Watch Live →
        </button>
      </div>
    </div>
  );
};

export default LiveMatchCard;
