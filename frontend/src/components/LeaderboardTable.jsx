import React from 'react';
import { Trophy, Medal, Award, MapPin } from 'lucide-react';

const LeaderboardTable = ({ players, currentUserId }) => {
  const getRankDisplay = (rank) => {
    if (rank === 1) return { icon: <Trophy style={{ width: 18, height: 18, color: '#F59E0B' }} />, bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', color: '#FCD34D' };
    if (rank === 2) return { icon: <Medal style={{ width: 18, height: 18, color: '#9CA3AF' }} />, bg: 'rgba(156,163,175,0.1)', border: 'rgba(156,163,175,0.25)', color: '#D1D5DB' };
    if (rank === 3) return { icon: <Award style={{ width: 18, height: 18, color: '#F97316' }} />, bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.25)', color: '#FED7AA' };
    return { icon: null, bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' };
  };

  if (!players || players.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 16px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
        No players found in this region
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 560 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            {['Rank', 'Player', 'Points', 'Tournaments', 'Win Rate', 'Location'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Player' || h === 'Location' ? 'left' : 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((player, index) => {
            const rank = index + 1;
            const isCurrentUser = player.id === currentUserId;
            const rankDisplay = getRankDisplay(rank);

            return (
              <tr
                key={player.id}
                style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: isCurrentUser ? 'rgba(245,158,11,0.05)' : 'transparent',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => { if (!isCurrentUser) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = isCurrentUser ? 'rgba(245,158,11,0.05)' : 'transparent'; }}
              >
                {/* Rank */}
                <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {rankDisplay.icon}
                    <span style={{
                      padding: '3px 10px', borderRadius: 20,
                      background: rankDisplay.bg, border: `1px solid ${rankDisplay.border}`,
                      color: rankDisplay.color, fontSize: 12, fontWeight: 700
                    }}>
                      #{rank}
                    </span>
                  </div>
                </td>

                {/* Player */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={player.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=111827&color=F59E0B&bold=true`}
                      alt={player.name}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: isCurrentUser ? '2px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                    />
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {player.name}
                        {isCurrentUser && (
                          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: '1px solid rgba(245,158,11,0.3)', padding: '1px 7px', borderRadius: 8 }}>
                            You
                          </span>
                        )}
                      </p>
                      {player.email && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{player.email}</p>}
                    </div>
                  </div>
                </td>

                {/* Points */}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: rank === 1 ? '#FCD34D' : '#fff', fontVariantNumeric: 'tabular-nums' }}>
                    {typeof player.matchify_points === 'number' ? player.matchify_points.toFixed(1) : '–'}
                  </span>
                </td>

                {/* Tournaments */}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#67E8F9', fontVariantNumeric: 'tabular-nums' }}>
                    {player.tournaments_played ?? '–'}
                  </span>
                </td>

                {/* Win Rate */}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: player.win_rate ? '#6EE7B7' : 'rgba(255,255,255,0.3)' }}>
                    {player.win_rate ? `${player.win_rate}%` : 'N/A'}
                  </span>
                </td>

                {/* Location */}
                <td style={{ padding: '14px 16px' }}>
                  {(player.city || player.state) ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                      <MapPin style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)', marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontWeight: 500 }}>{player.city}</p>
                        {player.state && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{player.state}</p>}
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>–</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default LeaderboardTable;
