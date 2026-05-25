import React from 'react';

const MatchCard = ({ match, onClick }) => {
  const { player1, player2, winner, matchNumber, status, score } = match;

  const isPlayer1Winner = winner?.id === player1?.id;
  const isPlayer2Winner = winner?.id === player2?.id;
  const isCompleted = status === 'COMPLETED';
  const isLive      = status === 'IN_PROGRESS';
  const isReady     = status === 'READY' && player1?.name !== 'TBD' && player2?.name !== 'TBD';

  const isTbd1 = !player1 || player1.name === 'TBD' || player1.name === 'BYE';
  const isTbd2 = !player2 || player2.name === 'TBD' || player2.name === 'BYE';

  const cardBorder = isLive
    ? '1.5px solid rgba(245,158,11,0.6)'
    : isCompleted
    ? '1.5px solid rgba(245,158,11,0.22)'
    : '1.5px solid rgba(255,255,255,0.1)';

  return (
    <div
      onClick={() => onClick?.(match)}
      style={{
        width: '224px',
        background: '#07121e',
        border: cardBorder,
        borderRadius: '13px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: isLive
          ? '0 0 20px rgba(245,158,11,0.15), 0 4px 12px rgba(0,0,0,0.45)'
          : '0 2px 10px rgba(0,0,0,0.35)',
      }}
    >
      {/* Card Header — match number + status badge */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 12px 6px',
        background: 'rgba(0,0,0,0.18)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em' }}>
          M{matchNumber}
        </span>
        {isLive && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '2px 8px', borderRadius: '20px',
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.35)',
            fontSize: '9px', fontWeight: 700, color: '#FCD34D',
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#FCD34D' }} />
            LIVE
          </span>
        )}
        {isCompleted && !isLive && (
          <span style={{
            padding: '2px 7px', borderRadius: '20px',
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)',
            fontSize: '9px', fontWeight: 700, color: '#4ade80',
          }}>
            ✓ Done
          </span>
        )}
        {isReady && (
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#FCD34D', letterSpacing: '0.04em' }}>
            READY
          </span>
        )}
      </div>

      {/* Player Rows */}
      <div style={{ padding: '8px 0 6px' }}>

        {/* Player 1 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '9px 12px 9px 11px',
          background: isPlayer1Winner ? 'rgba(245,158,11,0.1)' : 'transparent',
          borderLeft: isPlayer1Winner ? '3px solid #FCD34D' : '3px solid transparent',
        }}>
          {player1?.seed && (
            <span style={{
              flexShrink: 0, marginRight: '6px',
              width: '18px', height: '18px', borderRadius: '5px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.5)',
            }}>
              {player1.seed}
            </span>
          )}
          <span style={{
            flex: 1, minWidth: 0,
            fontSize: '13px', fontWeight: isPlayer1Winner ? 700 : 500,
            color: isTbd1 ? 'rgba(255,255,255,0.28)' : '#ffffff',
            fontStyle: isTbd1 ? 'italic' : 'normal',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player1?.name || 'TBD'}
          </span>
          {isPlayer1Winner && (
            <span style={{
              flexShrink: 0, marginLeft: '8px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'rgba(245,158,11,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 800, color: '#050810',
            }}>W</span>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

        {/* Player 2 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '9px 12px 9px 11px',
          background: isPlayer2Winner ? 'rgba(245,158,11,0.1)' : 'transparent',
          borderLeft: isPlayer2Winner ? '3px solid #FCD34D' : '3px solid transparent',
        }}>
          {player2?.seed && (
            <span style={{
              flexShrink: 0, marginRight: '6px',
              width: '18px', height: '18px', borderRadius: '5px',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '9px', fontWeight: 800, color: 'rgba(255,255,255,0.5)',
            }}>
              {player2.seed}
            </span>
          )}
          <span style={{
            flex: 1, minWidth: 0,
            fontSize: '13px', fontWeight: isPlayer2Winner ? 700 : 500,
            color: isTbd2 ? 'rgba(255,255,255,0.28)' : '#ffffff',
            fontStyle: isTbd2 ? 'italic' : 'normal',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {player2?.name || 'TBD'}
          </span>
          {isPlayer2Winner && (
            <span style={{
              flexShrink: 0, marginLeft: '8px',
              width: '18px', height: '18px', borderRadius: '50%',
              background: 'rgba(245,158,11,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', fontWeight: 800, color: '#050810',
            }}>W</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchCard;
