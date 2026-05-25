import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import api from '../../utils/api';

const LiveMatchFilters = ({ filters, onFilterChange }) => {
  const [tournaments, setTournaments] = useState([]);
  const [courts] = useState(Array.from({ length: 20 }, (_, i) => i + 1));

  useEffect(() => {
    api.get('/tournaments', { params: { status: 'ongoing' } })
      .then(r => setTournaments(r.data.tournaments || []))
      .catch(() => {});
  }, []);

  const hasFilters = filters.tournamentId || filters.court || filters.format;

  const selectStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: 13,
    padding: '9px 12px', outline: 'none', cursor: 'pointer',
    appearance: 'none'
  };

  const labelStyle = {
    display: 'block', fontSize: 11, fontWeight: 700,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 7
  };

  return (
    <div style={{
      background: 'linear-gradient(145deg, #0C1220, #0A0F1A)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 14, padding: '16px 14px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter style={{ width: 14, height: 14, color: '#FCD34D' }} />
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#fff', margin: 0 }}>Filters</h3>
        </div>
        {hasFilters && (
          <button
            onClick={() => onFilterChange({})}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: '#F87171', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '4px 9px', cursor: 'pointer' }}
          >
            <X style={{ width: 11, height: 11 }} /> Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Tournament */}
        <div>
          <label style={labelStyle}>Tournament</label>
          <select
            value={filters.tournamentId || ''}
            onChange={e => onFilterChange({ ...filters, tournamentId: e.target.value })}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <option value="" style={{ background: '#0C1220' }}>All Tournaments</option>
            {tournaments.map(t => (
              <option key={t.id} value={t.id} style={{ background: '#0C1220' }}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Court */}
        <div>
          <label style={labelStyle}>Court</label>
          <select
            value={filters.court || ''}
            onChange={e => onFilterChange({ ...filters, court: e.target.value })}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <option value="" style={{ background: '#0C1220' }}>All Courts</option>
            {courts.map(c => (
              <option key={c} value={c} style={{ background: '#0C1220' }}>Court {c}</option>
            ))}
          </select>
        </div>

        {/* Format */}
        <div>
          <label style={labelStyle}>Format</label>
          <select
            value={filters.format || ''}
            onChange={e => onFilterChange({ ...filters, format: e.target.value })}
            style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'rgba(245,158,11,0.4)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <option value="" style={{ background: '#0C1220' }}>All Formats</option>
            <option value="SINGLES" style={{ background: '#0C1220' }}>Singles</option>
            <option value="DOUBLES" style={{ background: '#0C1220' }}>Doubles</option>
            <option value="MIXED_DOUBLES" style={{ background: '#0C1220' }}>Mixed Doubles</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default LiveMatchFilters;
