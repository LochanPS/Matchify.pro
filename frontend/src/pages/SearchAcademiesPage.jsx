import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, MapPin, Phone, Building2, X, BadgeCheck, ChevronRight } from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#050810',
  card: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.09)',
  green: '#06b6d4',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
};

const SPORT_META = {
  Badminton:      { emoji: '🏸', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',    border: 'rgba(6,182,212,0.25)' },
  Tennis:         { emoji: '🎾', color: '#00d4ff', bg: 'rgba(0,212,255,0.12)',    border: 'rgba(0,212,255,0.25)' },
  'Table Tennis': { emoji: '🏓', color: '#a855f7', bg: 'rgba(168,85,247,0.12)',   border: 'rgba(168,85,247,0.25)' },
  Squash:         { emoji: '🎱', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',   border: 'rgba(251,191,36,0.25)' },
  Basketball:     { emoji: '🏀', color: '#f97316', bg: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.25)' },
  Volleyball:     { emoji: '🏐', color: '#ec4899', bg: 'rgba(236,72,153,0.12)',   border: 'rgba(236,72,153,0.25)' },
  Swimming:       { emoji: '🏊', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',   border: 'rgba(56,189,248,0.25)' },
  Cricket:        { emoji: '🏏', color: '#a3e635', bg: 'rgba(163,230,53,0.12)',   border: 'rgba(163,230,53,0.25)' },
  Football:       { emoji: '⚽', color: '#22d3ee', bg: 'rgba(52,211,153,0.12)',   border: 'rgba(52,211,153,0.25)' },
  Gym:            { emoji: '💪', color: '#fb7185', bg: 'rgba(251,113,133,0.12)',  border: 'rgba(251,113,133,0.25)' },
  Yoga:           { emoji: '🧘', color: '#c084fc', bg: 'rgba(192,132,252,0.12)',  border: 'rgba(192,132,252,0.25)' },
  Athletics:      { emoji: '🏃', color: '#fdba74', bg: 'rgba(253,186,116,0.12)', border: 'rgba(253,186,116,0.25)' },
};

const ALL_SPORTS = ['All', ...Object.keys(SPORT_META)];

// ── No-photo gradient map by sport ──────────────────────────────────────────
const SPORT_GRADIENT = {
  Badminton:      'linear-gradient(135deg,rgba(6,182,212,0.18),rgba(0,212,255,0.1))',
  Tennis:         'linear-gradient(135deg,rgba(0,212,255,0.18),rgba(168,85,247,0.1))',
  'Table Tennis': 'linear-gradient(135deg,rgba(168,85,247,0.18),rgba(0,212,255,0.1))',
  Squash:         'linear-gradient(135deg,rgba(251,191,36,0.18),rgba(249,115,22,0.1))',
  Basketball:     'linear-gradient(135deg,rgba(249,115,22,0.18),rgba(251,191,36,0.1))',
  Volleyball:     'linear-gradient(135deg,rgba(236,72,153,0.18),rgba(168,85,247,0.1))',
  Swimming:       'linear-gradient(135deg,rgba(56,189,248,0.18),rgba(0,212,255,0.1))',
  Cricket:        'linear-gradient(135deg,rgba(163,230,53,0.18),rgba(52,211,153,0.1))',
  Football:       'linear-gradient(135deg,rgba(52,211,153,0.18),rgba(163,230,53,0.1))',
  Gym:            'linear-gradient(135deg,rgba(251,113,133,0.18),rgba(168,85,247,0.1))',
  Yoga:           'linear-gradient(135deg,rgba(192,132,252,0.18),rgba(56,189,248,0.1))',
  Athletics:      'linear-gradient(135deg,rgba(253,186,116,0.18),rgba(251,113,133,0.1))',
  default:        'linear-gradient(135deg,rgba(0,212,255,0.12),rgba(168,85,247,0.08))',
};

// ── Academy Card ─────────────────────────────────────────────────────────────
function AcademyCard({ academy, onClick }) {
  const sports = Array.isArray(academy.sports) ? academy.sports : [];
  const photos = Array.isArray(academy.photos) ? academy.photos : [];
  const sportDetails = academy.sportDetails || {};
  const primarySport = sports[0];
  const meta = SPORT_META[primarySport] || {};
  const gradient = SPORT_GRADIENT[primarySport] || SPORT_GRADIENT.default;
  const coverPhoto = photos[0] || null;

  // Build facility summary: "6 Courts · Badminton"
  const facilityText = primarySport && sportDetails[primarySport]
    ? `${sportDetails[primarySport]} ${primarySport === 'Swimming' ? '' : primarySport === 'Gym' ? '' : 'courts'} · ${primarySport}`.trim()
    : primarySport || null;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer transition-all active:scale-[0.985]"
      style={{
        background: B.card,
        border: `1px solid ${B.border}`,
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}
    >
      {/* Photo / placeholder banner */}
      <div className="relative w-full overflow-hidden" style={{ height: 168 }}>
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={academy.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ background: gradient }}>
            <span style={{ fontSize: 52, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
              {meta.emoji || '🏢'}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(4px)' }}>
              No photos yet
            </span>
          </div>
        )}

        {/* Dark gradient at bottom of photo for text legibility */}
        <div className="absolute bottom-0 left-0 right-0 h-12"
          style={{ background: 'linear-gradient(to top, rgba(7,7,26,0.85), transparent)' }} />

        {/* Verified badge */}
        {academy.isVerified && (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(6,182,212,0.92)', backdropFilter: 'blur(6px)' }}>
            <BadgeCheck className="w-3 h-3" style={{ color: '#050810' }} />
            <span className="text-xs font-black" style={{ color: '#050810' }}>Verified</span>
          </div>
        )}

        {/* Type badge */}
        {academy.type && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}>
            <span className="text-xs font-bold text-white">{academy.type}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Name + arrow */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-base font-black text-white leading-tight flex-1">
            {academy.name}
          </h3>
          <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" style={{ color: B.cyan }} />
          <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {[academy.city, academy.state].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Sport tags */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {sports.slice(0, 4).map(s => {
            const m = SPORT_META[s] || {};
            return (
              <span key={s}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black"
                style={{ background: m.bg || 'rgba(255,255,255,0.06)', color: m.color || '#fff', border: `1px solid ${m.border || B.border}` }}>
                {m.emoji} {s}
              </span>
            );
          })}
          {sports.length > 4 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-black"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: `1px solid ${B.border}` }}>
              +{sports.length - 4} more
            </span>
          )}
        </div>

        {/* Footer: facility info + call button */}
        <div className="flex items-center justify-between pt-3"
          style={{ borderTop: `1px solid ${B.border}` }}>
          <div>
            {facilityText && (
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {facilityText}
              </p>
            )}
            {academy.openingHours && (
              <p className="text-xs font-semibold mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                🕐 {academy.openingHours}
              </p>
            )}
          </div>

          {academy.phone && (
            <a
              href={`tel:${academy.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95"
              style={{
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(6,182,212,0.3)',
                color: B.green,
              }}
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
      <div className="animate-pulse" style={{ height: 168, background: 'rgba(255,255,255,0.05)' }} />
      <div className="p-4 space-y-3">
        <div className="h-5 w-2/3 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.07)' }} />
        <div className="h-4 w-2/5 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          <div className="h-6 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-6 w-14 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        </div>
        <div className="flex justify-between items-center pt-1">
          <div className="h-4 w-24 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="h-8 w-16 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SearchAcademiesPage() {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeSport, setActiveSport] = useState('All');
  const sportScrollRef = useRef(null);

  const fetchAcademies = async (q = search, sport = activeSport) => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (q.trim()) params.set('search', q.trim());
      if (sport !== 'All') params.set('sport', sport);
      const res = await api.get(`/academies?${params}`);
      setAcademies(res.data?.data?.academies || []);
    } catch {
      setError('Could not load academies. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAcademies('', 'All'); }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchAcademies(search, activeSport), 350);
    return () => clearTimeout(t);
  }, [search]);

  const handleSportChange = (sport) => {
    setActiveSport(sport);
    fetchAcademies(search, sport);
  };

  return (
    <div className="min-h-screen relative" style={{
      background: '#050810',
      backgroundImage: 'url(/bg-galaxy.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center top',
      backgroundRepeat: 'no-repeat',
      backgroundAttachment: 'fixed',
    }}>
      {/* Dark overlay */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: 'rgba(5,8,16,0.75)', zIndex: 0 }} />

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 px-4 pt-5 pb-4"
        style={{ background: 'rgba(5,8,16,0.88)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: `1px solid ${B.border}` }}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 group">
            <ArrowLeft className="w-5 h-5 transition-transform group-active:-translate-x-0.5"
              style={{ color: B.green }} />
            <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Back</span>
          </button>

          <h1 className="text-lg font-black text-white tracking-tight">Academies</h1>

          <button
            onClick={() => navigate('/academies/add')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-black transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#050810' }}
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'rgba(255,255,255,0.3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search academy or city..."
            className="w-full pl-10 pr-10 py-3 rounded-2xl text-sm font-semibold text-white focus:outline-none transition-all"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: `1px solid ${B.border}`,
              caretColor: B.green,
            }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full"
              style={{ background: 'rgba(255,255,255,0.12)' }}>
              <X className="w-3 h-3 text-white" />
            </button>
          )}
        </div>

        {/* Sport filter chips */}
        <div
          ref={sportScrollRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {ALL_SPORTS.map(sport => {
            const active = activeSport === sport;
            const m = SPORT_META[sport] || {};
            const activeColor = m.color || B.cyan;
            return (
              <button
                key={sport}
                onClick={() => handleSportChange(sport)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all"
                style={{
                  background: active
                    ? (sport === 'All' ? B.cyan : m.color || B.cyan)
                    : 'rgba(255,255,255,0.06)',
                  color: active ? '#050810' : 'rgba(255,255,255,0.5)',
                  border: active ? 'none' : `1px solid rgba(255,255,255,0.09)`,
                  boxShadow: active ? `0 2px 12px ${activeColor}40` : 'none',
                }}
              >
                {sport !== 'All' && m.emoji} {sport}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 px-4 pt-4 pb-32">

        {/* Results count */}
        {!loading && !error && (
          <p className="text-xs font-bold mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {academies.length === 0
              ? 'No results'
              : `${academies.length} ${academies.length === 1 ? 'academy' : 'academies'} found`}
          </p>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span style={{ fontSize: 52 }}>😕</span>
            <p className="text-base font-black text-white mt-4 mb-2">Failed to load</p>
            <p className="text-sm font-semibold mb-6 px-6 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
            <button
              onClick={() => fetchAcademies()}
              className="px-5 py-2.5 rounded-xl text-sm font-black"
              style={{ background: 'rgba(6,182,212,0.12)', color: B.green, border: '1px solid rgba(6,182,212,0.25)' }}>
              Try Again
            </button>
          </div>
        ) : academies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)' }}>
              <Building2 className="w-9 h-9" style={{ color: 'rgba(0,212,255,0.5)' }} />
            </div>
            <p className="text-lg font-black text-white mb-2">
              {search || activeSport !== 'All' ? 'No results found' : 'No academies yet'}
            </p>
            <p className="text-sm font-semibold mb-8 px-6 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              {search || activeSport !== 'All'
                ? 'Try a different search term or sport filter'
                : 'Be the first academy listed in your city!'}
            </p>
            <button
              onClick={() => navigate('/academies/add')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-black transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg,#06b6d4,#00d4ff)', color: '#050810' }}>
              <Plus className="w-4 h-4" />
              List Your Academy
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {academies.map(academy => (
              <AcademyCard
                key={academy.id}
                academy={academy}
                onClick={() => navigate(`/academies/${academy.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky bottom CTA ── */}
      {!loading && academies.length > 0 && (
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-6 pt-4 z-20"
          style={{ background: 'linear-gradient(to top, rgba(5,8,16,0.97) 65%, transparent)' }}
        >
          <button
            onClick={() => navigate('/academies/add')}
            className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(6,182,212,0.2)',
              color: B.green,
            }}
          >
            <Building2 className="w-4 h-4" />
            Own an academy? List it for ₹300
          </button>
        </div>
      )}
    </div>
  );
}
