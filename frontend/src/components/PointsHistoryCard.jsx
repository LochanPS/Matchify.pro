import React from 'react';
import { Trophy, Calendar, Award } from 'lucide-react';

const PointsHistoryCard = ({ log }) => {
  const getReasonStyle = (reason) => {
    const map = {
      'Winner':         { bg: 'rgba(245,158,11,0.15)', color: '#FCD34D', border: 'rgba(245,158,11,0.3)' },
      'Runner-up':      { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: 'rgba(255,255,255,0.15)' },
      'Semi-finalist':  { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
      'Quarter-finalist':{ bg: 'rgba(249,115,22,0.12)', color: '#fb923c', border: 'rgba(249,115,22,0.25)' },
      'Participation':  { bg: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', border: 'rgba(255,255,255,0.1)' },
    };
    return map[reason] || { bg: 'rgba(139,92,246,0.12)', color: '#C4B5FD', border: 'rgba(139,92,246,0.25)' };
  };

  const s = getReasonStyle(log.reason);

  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderLeft: '3px solid #F59E0B', borderRadius: 14, padding: '20px 18px', transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(245,158,11,0.1)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 4 }}>
            {log.tournament_name}
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{log.category_name}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar style={{ width: 13, height: 13, color: 'rgba(255,255,255,0.3)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{new Date(log.earned_at).toLocaleDateString('en-IN')}</span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 28, fontWeight: 900, color: '#F59E0B', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            +{log.points.toFixed(1)}
          </p>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Points</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
          {log.reason}
        </span>

        {log.multiplier > 1 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#C4B5FD' }}>
            {log.multiplier}x Multiplier
          </span>
        )}
      </div>

      {log.description && (
        <p style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>
          {log.description}
        </p>
      )}
    </div>
  );
};

export default PointsHistoryCard;
