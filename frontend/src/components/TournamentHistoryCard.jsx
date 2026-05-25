import { Link } from 'react-router-dom';
import { formatDateIndian } from '../utils/dateFormat';
import { MapPin, Calendar } from 'lucide-react';

const statusMap = {
  completed: { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)', color: '#34D399', label: 'Completed' },
  cancelled:  { bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',  color: '#F87171', label: 'Cancelled' },
  ongoing:    { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', color: '#FCD34D', label: '● Live' },
  published:  { bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)', color: '#C4B5FD', label: 'Published' },
};

export default function TournamentHistoryCard({ tournament }) {
  const status = statusMap[tournament.status] || { bg: 'rgba(107,114,128,0.1)', border: 'rgba(107,114,128,0.2)', color: '#9CA3AF', label: tournament.status };

  const stat = (label, value, color = '#fff') => (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px' }}>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{value}</p>
    </div>
  );

  return (
    <div
      style={{
        background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 18,
        padding: '20px 20px',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,92,246,0.3)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, color: '#fff', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tournament.name}
          </h3>
          {tournament.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
              <MapPin style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>{tournament.location}</p>
            </div>
          )}
          {(tournament.startDate || tournament.endDate) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Calendar style={{ width: 12, height: 12, color: 'rgba(255,255,255,0.3)' }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
                {formatDateIndian(tournament.startDate)} — {formatDateIndian(tournament.endDate)}
              </p>
            </div>
          )}
        </div>
        <span style={{ background: status.bg, border: `1px solid ${status.border}`, color: status.color, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 }}>
          {status.label}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
        {stat('Categories', tournament.categoriesCount)}
        {stat('Players', tournament.totalParticipants)}
        {stat('Matches', tournament.totalMatches)}
        {stat('Revenue', `₹${(tournament.totalRevenue || 0).toLocaleString()}`, '#6EE7B7')}
      </div>

      {/* Category chips */}
      {tournament.categories?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Categories</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tournament.categories.map(cat => (
              <Link
                key={cat.id}
                to={`/organizer/categories/${cat.id}`}
                style={{ fontSize: 12, fontWeight: 600, color: '#67E8F9', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '3px 10px', textDecoration: 'none', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.15)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
              >
                {cat.name} ({cat.participantCount})
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          to={`/organizer/tournaments/${tournament.id}`}
          style={{ fontSize: 13, fontWeight: 700, color: '#C4B5FD', textDecoration: 'none' }}
        >
          View Details →
        </Link>
        {['completed', 'ongoing', 'published'].includes(tournament.status) && (
          <Link
            to={`/tournaments/${tournament.id}/draws`}
            style={{ fontSize: 13, fontWeight: 700, color: '#6EE7B7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
            View Draws →
          </Link>
        )}
      </div>
    </div>
  );
}

