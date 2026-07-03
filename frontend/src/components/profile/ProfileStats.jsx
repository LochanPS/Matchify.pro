import { Trophy, Calendar, Target, TrendingUp, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const RupeeIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3c3.5 0 6-2.5 6-5H6" />
  </svg>
);

export default function ProfileStats({ stats, user }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const totalMatches = (user?.matchesWon || 0) + (user?.matchesLost || 0);
  const winRate = totalMatches > 0 ? Math.round((user?.matchesWon / totalMatches) * 100) : 0;

  const tiles = [
    {
      icon: Trophy,
      label: 'Tournaments',
      value: user?.tournamentsPlayed ?? 0,
      color: '#FCD34D',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)'
    },
    {
      icon: Target,
      label: 'Matches Won',
      value: user?.matchesWon ?? 0,
      color: '#6EE7B7',
      bg: 'rgba(16,185,129,0.1)',
      border: 'rgba(16,185,129,0.2)'
    },
    {
      icon: Award,
      label: 'Matches Lost',
      value: user?.matchesLost ?? 0,
      color: '#F87171',
      bg: 'rgba(239,68,68,0.1)',
      border: 'rgba(239,68,68,0.2)'
    },
    {
      icon: TrendingUp,
      label: 'Total Points',
      value: user?.totalPoints ?? 0,
      color: '#67E8F9',
      bg: 'rgba(245,158,11,0.1)',
      border: 'rgba(245,158,11,0.2)'
    },
    {
      icon: Calendar,
      label: 'Member Since',
      value: formatDate(user?.createdAt),
      color: '#C4B5FD',
      bg: 'rgba(139,92,246,0.1)',
      border: 'rgba(139,92,246,0.2)'
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Win Rate highlight */}
      {totalMatches > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18) 0%, rgba(124,58,237,0.12) 100%)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 16,
          padding: '20px 24px',
          textAlign: 'center',
          boxShadow: '0 0 32px rgba(139,92,246,0.12)'
        }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'rgba(196,181,253,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Win Rate</p>
          <p style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg, #fff 0%, #C4B5FD 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {winRate}%
          </p>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>
            Based on {totalMatches} match{totalMatches !== 1 ? 'es' : ''} played
          </p>
        </div>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {tiles.map((tile, idx) => (
          <div
            key={idx}
            style={{
              background: tile.bg,
              border: `1px solid ${tile.border}`,
              borderRadius: 14,
              padding: '16px 14px',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 20px ${tile.bg}`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: tile.bg, border: `1px solid ${tile.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              <tile.icon style={{ width: 18, height: 18, color: tile.color }} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>
              {tile.value}
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>{tile.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {totalMatches === 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: 'linear-gradient(135deg, #F59E0B, #D97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trophy style={{ width: 28, height: 28, color: '#0C0900' }} />
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>Ready to Start Playing?</h3>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 20 }}>
            Join your first tournament to build your sports profile and earn points!
          </p>
          <Link
            to="/tournaments"
            style={{ display: 'inline-block', padding: '10px 24px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#0C0900', borderRadius: 12, fontWeight: 700, fontSize: 13, textDecoration: 'none', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}
          >
            Browse Tournaments →
          </Link>
        </div>
      )}
    </div>
  );
}

