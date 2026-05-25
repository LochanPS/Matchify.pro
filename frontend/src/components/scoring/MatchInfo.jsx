import React from 'react';
import { MapPin, Gavel, Hash } from 'lucide-react';

const MatchInfo = ({ match }) => {
  if (!match) return null;

  const player1 = match.player1;
  const player2 = match.player2;
  const umpire = match.umpire;

  const getStatusStyle = (status) => {
    const map = {
      'PENDING':     { bg: 'rgba(107,114,128,0.15)', border: 'rgba(107,114,128,0.3)', color: '#9CA3AF', label: 'Pending' },
      'READY':       { bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  color: '#FCD34D', label: 'Ready' },
      'ONGOING':     { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)', color: '#34D399', label: '● Live' },
      'IN_PROGRESS': { bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.35)', color: '#34D399', label: '● Live' },
      'COMPLETED':   { bg: 'rgba(6,182,212,0.1)',    border: 'rgba(6,182,212,0.25)',  color: '#67E8F9', label: 'Completed' },
      'CANCELLED':   { bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)',   color: '#F87171', label: 'Cancelled' },
    };
    return map[status] || map['PENDING'];
  };

  const getRoundName = (round) => {
    if (round === 1) return 'Final';
    if (round === 2) return 'Semi-Final';
    if (round === 3) return 'Quarter-Final';
    if (round === 4) return 'Round of 16';
    if (round === 5) return 'Round of 32';
    return `Round ${round}`;
  };

  const statusStyle = getStatusStyle(match.status);

  const PlayerCard = ({ player, side, seed }) => {
    const isP1 = side === 'p1';
    const accentColor = isP1 ? '#F59E0B' : '#8B5CF6';
    const accentBg = isP1 ? 'rgba(245,158,11,0.08)' : 'rgba(139,92,246,0.08)';
    const accentBorder = isP1 ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.2)';
    const avatarGrad = isP1 ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'linear-gradient(135deg, #8B5CF6, #7C3AED)';
    const seedBg = isP1 ? 'rgba(245,158,11,0.12)' : 'rgba(139,92,246,0.12)';
    const seedColor = isP1 ? '#FCD34D' : '#C4B5FD';

    return (
      <div style={{
        background: accentBg,
        border: `1px solid ${accentBorder}`,
        borderRadius: 14,
        padding: '16px 12px',
        textAlign: 'center',
        flex: 1
      }}>
        {player?.profilePhoto ? (
          <img
            src={player.profilePhoto}
            alt={player.name}
            style={{
              width: 60, height: 60, borderRadius: '50%',
              margin: '0 auto 10px', objectFit: 'cover',
              border: `2px solid ${accentBorder}`
            }}
          />
        ) : (
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: avatarGrad,
            margin: '0 auto 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: isP1 ? '#0C0900' : '#f5f3ff'
          }}>
            {player?.name?.charAt(0) || (isP1 ? 'P1' : 'P2')}
          </div>
        )}
        <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {player?.name || 'TBD'}
        </p>
        {seed && (
          <span style={{
            display: 'inline-block',
            background: seedBg,
            color: seedColor,
            fontSize: 11, fontWeight: 600,
            padding: '2px 10px', borderRadius: 20,
            border: `1px solid ${accentBorder}`
          }}>
            Seed {seed}
          </span>
        )}
      </div>
    );
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '20px',
      marginBottom: 20
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Hash style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)' }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
              Match {match.matchNumber}
            </h2>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
            {getRoundName(match.round)}
          </p>
        </div>
        <span style={{
          background: statusStyle.bg,
          border: `1px solid ${statusStyle.border}`,
          color: statusStyle.color,
          fontSize: 12, fontWeight: 700,
          padding: '5px 14px', borderRadius: 20
        }}>
          {statusStyle.label}
        </span>
      </div>

      {/* Players */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <PlayerCard player={player1} side="p1" seed={match.player1Seed} />
        <div style={{ textAlign: 'center', padding: '0 4px' }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>VS</span>
        </div>
        <PlayerCard player={player2} side="p2" seed={match.player2Seed} />
      </div>

      {/* Umpire */}
      {umpire && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(16,185,129,0.08)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 10, padding: '10px 14px',
          marginBottom: match.courtNumber ? 10 : 0
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Gavel style={{ width: 15, height: 15, color: '#34D399' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: '#34D399', fontWeight: 600, letterSpacing: '0.04em' }}>Match Official</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{umpire.name}</p>
          </div>
        </div>
      )}

      {/* Court */}
      {match.courtNumber && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 10, padding: '10px 14px'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <MapPin style={{ width: 15, height: 15, color: 'rgba(255,255,255,0.45)' }} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.04em' }}>Court</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{match.courtNumber}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchInfo;
