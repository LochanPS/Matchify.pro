import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Plus, MapPin, Phone, Building2,
  ChevronRight, X, SlidersHorizontal
} from 'lucide-react';
import api from '../utils/api';

const B = {
  bg: '#07071a',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#00ff88',
  cyan: '#00d4ff',
  purple: '#a855f7',
  amber: '#fbbf24',
};

const SPORT_EMOJIS = {
  Badminton: '🏸', Tennis: '🎾', 'Table Tennis': '🏓',
  Squash: '🎱', Basketball: '🏀', Volleyball: '🏐',
  Swimming: '🏊', Cricket: '🏏', Football: '⚽',
  Gym: '💪', Yoga: '🧘', Athletics: '🏃',
};

const SPORT_COLORS = {
  Badminton: B.green, Tennis: B.cyan, 'Table Tennis': B.purple,
  Squash: B.amber, Basketball: '#f97316', Volleyball: '#ec4899',
  Swimming: '#38bdf8', Cricket: '#a3e635', Football: '#34d399',
  Gym: '#fb7185', Yoga: '#c084fc', Athletics: '#fdba74',
};

const ALL_SPORTS = ['All', 'Badminton', 'Tennis', 'Table Tennis', 'Squash',
  'Basketball', 'Volleyball', 'Swimming', 'Cricket', 'Football', 'Gym', 'Yoga', 'Athletics'];

// ── Academy card ────────────────────────────────────────────────────────────
function AcademyCard({ academy, onClick }) {
  const sports = Array.isArray(academy.sports) ? academy.sports : [];
  const photos = Array.isArray(academy.photos) ? academy.photos : [];
  const sportDetails = academy.sportDetails || {};
  const coverPhoto = photos[0] || null;

  // Primary sport facility count
  const primarySport = sports[0];
  const primaryDetail = primarySport ? sportDetails[primarySport] : null;

  return (
    <div
      onClick={onClick}
      className="rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
      style={{ background: B.card, border: `1px solid ${B.border}` }}
    >
      {/* Photo / placeholder */}
      <div className="relative w-full h-36 overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.03)' }}>
        {coverPhoto ? (
          <img src={coverPhoto} alt={academy.name}
            className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span style={{ fontSize: 40 }}>{SPORT_EMOJIS[primarySport] || '🏢'}</span>
            <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No photo
            </span>
          </div>
        )}

        {/* Verified badge */}
        {academy.isVerified && (
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black"
            style={{ background: 'rgba(0,255,136,0.9)', color: '#07071a' }}>
            ✓ Verified
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-black text-white leading-tight line-clamp-2 flex-1">
            {academy.name}
          </h3>
          <ChevronRight className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: B.cyan }} />
          <span className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {academy.city}{academy.state ? `, ${academy.state}` : ''}
          </span>
        </div>

        {/* Sport tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          {sports.slice(0, 3).map(s => (
            <span key={s} className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{
                background: `${SPORT_COLORS[s] || B.green}18`,
                color: SPORT_COLORS[s] || B.green,
                border: `1px solid ${SPORT_COLORS[s] || B.green}33`,
              }}>
              {SPORT_EMOJIS[s]} {s}
            </span>
          ))}
          {sports.length > 3 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
              +{sports.length - 3}
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          {primaryDetail && (
            <span className="text-xs font-semibold"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              {primaryDetail} {primarySport === 'Swimming' || primarySport === 'Cricket' ||
                primarySport === 'Football' || primarySport === 'Gym' ||
                primarySport === 'Yoga' || primarySport === 'Athletics' ? '' : 'courts'}
            </span>
          )}

          {academy.phone && (
            <a
              href={`tel:${academy.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
              style={{
                background: 'rgba(0,255,136,0.12)',
                border: '1px solid rgba(0,255,136,0.25)',
                color: B.green,
              }}
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
      <div className="w-full h-36 animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="p-3 space-y-2">
        <div className="h-4 w-3/4 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 w-1/2 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="flex gap-1">
          <div className="h-5 w-16 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-5 w-14 rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SearchAcademiesPage() {
  const navigate = useNavigate();
  const [academies, setAcademies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeSport, setActiveSport] = useState('All');
  const sportScrollRef = useRef(null);

  const fetchAcademies = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (activeSport !== 'All') params.set('sport', activeSport);
      const res = await api.get(`/academies?${params}`);
      setAcademies(res.data?.data?.academies || []);
    } catch (err) {
      setError('Failed to load academies');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount + when sport changes
  useEffect(() => { fetchAcademies(); }, [activeSport]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchAcademies(), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filtered = academies; // server already filters

  return (
    <div className="min-h-screen pb-32" style={{ background: B.bg }}>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3"
        style={{ background: B.bg, borderBottom: `1px solid ${B.border}` }}>

        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" style={{ color: B.green }} />
            <span className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.7)' }}>Back</span>
          </button>

          <h1 className="text-base font-black text-white">Academies</h1>

          <button
            onClick={() => navigate('/academies/add')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg,#00ff88,#00d4ff)',
              color: '#07071a',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: 'rgba(255,255,255,0.35)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search academy or city..."
            className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm text-white placeholder-white/30 focus:outline-none"
            style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${B.border}` }}
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Sport filter chips */}
      <div ref={sportScrollRef}
        className="flex gap-2 px-4 py-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}>
        {ALL_SPORTS.map(sport => {
          const active = activeSport === sport;
          const color = sport === 'All' ? B.cyan : (SPORT_COLORS[sport] || B.green);
          return (
            <button
              key={sport}
              onClick={() => setActiveSport(sport)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: active ? color : 'rgba(255,255,255,0.05)',
                color: active ? '#07071a' : 'rgba(255,255,255,0.55)',
                border: active ? `1px solid ${color}` : `1px solid rgba(255,255,255,0.08)`,
              }}
            >
              {sport !== 'All' && SPORT_EMOJIS[sport]} {sport}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <div className="px-4 pb-2">
          <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {filtered.length} {filtered.length === 1 ? 'academy' : 'academies'} found
          </span>
        </div>
      )}

      {/* Content */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span style={{ fontSize: 48 }}>😕</span>
            <p className="text-sm font-bold text-white mt-3 mb-1">Couldn't load academies</p>
            <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{error}</p>
            <button onClick={fetchAcademies}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'rgba(0,255,136,0.12)', color: B.green, border: `1px solid rgba(0,255,136,0.25)` }}>
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span style={{ fontSize: 56 }}>🏢</span>
            <p className="text-base font-black text-white mt-4 mb-2">
              {search || activeSport !== 'All'
                ? 'No academies match your search'
                : 'No academies listed yet'}
            </p>
            <p className="text-sm mb-6 px-4" style={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
              {search || activeSport !== 'All'
                ? 'Try a different search or sport filter'
                : 'Be the first academy in your city!'}
            </p>
            <button
              onClick={() => navigate('/academies/add')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black"
              style={{ background: 'linear-gradient(135deg,#00ff88,#00d4ff)', color: '#07071a' }}
            >
              <Plus className="w-4 h-4" />
              List Your Academy
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(academy => (
              <AcademyCard
                key={academy.id}
                academy={academy}
                onClick={() => navigate(`/academies/${academy.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky bottom CTA */}
      {!loading && filtered.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 pb-5 pt-3 z-20"
          style={{ background: `linear-gradient(to top, ${B.bg} 60%, transparent)` }}>
          <button
            onClick={() => navigate('/academies/add')}
            className="w-full py-3.5 rounded-2xl text-sm font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid rgba(0,255,136,0.25)`,
              color: B.green,
            }}
          >
            <Building2 className="w-4 h-4" />
            Own an academy? List it for ₹200
          </button>
        </div>
      )}
    </div>
  );
}
