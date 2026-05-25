import React from 'react';
import { Plus, Undo2, Play, Trophy } from 'lucide-react';

const ScoringControls = ({
  onAddPoint,
  onUndo,
  onStart,
  matchStatus,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  disabled = false
}) => {
  const isPending = matchStatus === 'PENDING' || matchStatus === 'READY';
  const isOngoing = matchStatus === 'ONGOING' || matchStatus === 'IN_PROGRESS';
  const isCompleted = matchStatus === 'COMPLETED';

  if (isPending) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 16,
        padding: 32,
        textAlign: 'center'
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 24px rgba(16,185,129,0.15)'
        }}>
          <Play style={{ width: 32, height: 32, color: '#10B981' }} />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Ready to Start?</h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, marginBottom: 24 }}>
          Click below to begin the match
        </p>
        <button
          onClick={onStart}
          disabled={disabled}
          style={{
            background: disabled ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff',
            border: 'none',
            padding: '14px 40px',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            boxShadow: disabled ? 'none' : '0 4px 20px rgba(16,185,129,0.35)',
            transition: 'all 0.2s ease',
            letterSpacing: '0.02em'
          }}
          onMouseEnter={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
        >
          🏸 Start Match
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div style={{
        background: 'linear-gradient(145deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))',
        border: '1px solid rgba(245,158,11,0.25)',
        borderRadius: 16,
        padding: 32,
        textAlign: 'center'
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'rgba(245,158,11,0.12)',
          border: '1px solid rgba(245,158,11,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 0 24px rgba(245,158,11,0.15)'
        }}>
          <Trophy style={{ width: 32, height: 32, color: '#F59E0B' }} />
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, color: '#FCD34D', marginBottom: 8 }}>Match Completed!</h3>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14 }}>The match has ended</p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: 20
    }}>
      <p style={{
        fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase', letterSpacing: '0.1em',
        textAlign: 'center', marginBottom: 16
      }}>Award Point</p>

      {/* Point Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Player 1 Button */}
        <button
          onClick={() => onAddPoint('player1')}
          disabled={disabled}
          style={{
            background: disabled ? 'rgba(245,158,11,0.06)' : 'linear-gradient(145deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 14,
            padding: '20px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.15s ease',
            textAlign: 'center',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(245,158,11,0.28), rgba(217,119,6,0.2))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.25)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(245,158,11,0.18), rgba(217,119,6,0.12))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px'
          }}>
            <Plus style={{ width: 22, height: 22, color: '#FCD34D' }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#FCD34D', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player1Name}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(252,211,77,0.6)' }}>+1 Point</p>
        </button>

        {/* Player 2 Button */}
        <button
          onClick={() => onAddPoint('player2')}
          disabled={disabled}
          style={{
            background: disabled ? 'rgba(139,92,246,0.06)' : 'linear-gradient(145deg, rgba(139,92,246,0.18), rgba(124,58,237,0.12))',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 14,
            padding: '20px 12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.15s ease',
            textAlign: 'center',
            WebkitTapHighlightColor: 'transparent'
          }}
          onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(139,92,246,0.28), rgba(124,58,237,0.2))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.25)'; } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(145deg, rgba(139,92,246,0.18), rgba(124,58,237,0.12))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          onMouseDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
          onMouseUp={e => { if (!disabled) e.currentTarget.style.transform = 'translateY(-2px)'; }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(139,92,246,0.15)',
            border: '1px solid rgba(139,92,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 10px'
          }}>
            <Plus style={{ width: 22, height: 22, color: '#C4B5FD' }} />
          </div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#C4B5FD', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {player2Name}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(196,181,253,0.6)' }}>+1 Point</p>
        </button>
      </div>

      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={disabled}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '11px 16px',
          color: 'rgba(255,255,255,0.55)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontSize: 13, fontWeight: 600,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; } }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
      >
        <Undo2 style={{ width: 15, height: 15 }} />
        Undo Last Point
      </button>
    </div>
  );
};

export default ScoringControls;
