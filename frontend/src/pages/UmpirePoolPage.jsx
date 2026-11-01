import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Gavel, Play, RefreshCw, Lock, CheckCircle, AlertTriangle, Swords, Search } from 'lucide-react';
import { tournamentAPI } from '../api/tournament';
import LoadingScreen from '../components/LoadingScreen';
import Spinner from '../components/Spinner';

const B = {
  bg: '#040810',
  card: 'rgba(12,18,32,0.95)',
  border: 'rgba(255,255,255,0.08)',
  gold: '#F59E0B',
  goldSoft: '#FCD34D',
  green: '#4ade80',
  red: '#F87171',
  blue: '#93c5fd',
};

const roundName = (r) => {
  if (!r) return '';
  if (r === 1) return 'Final';
  if (r === 2) return 'Semi Final';
  if (r === 3) return 'Quarter Final';
  return `Round ${r}`;
};

// Build the small header label for a match. Round-robin (group) matches are all
// stored as round 1, so they must NOT fall through to roundName — that would
// mislabel every group match as "Final". Group matches read "Group A" (or just
// "Group Stage" when no group letter is available); knockout matches keep their
// round name.
const matchLabel = (m) => {
  const num = m.matchNumber != null ? `Match #${m.matchNumber}` : '';
  if (m.stage === 'GROUP') {
    const letter = m.groupName || (m.groupIndex != null ? String.fromCharCode(65 + m.groupIndex) : '');
    return [letter ? `Group ${letter}` : 'Group Stage', num].filter(Boolean).join(' · ');
  }
  return [roundName(m.round), num].filter(Boolean).join(' · ') || 'Match';
};

// Keep each category's matches together under its own heading (name + level),
// so matches from different categories are never mixed into one flat list.
// First-seen order is preserved (matches arrive sorted by round then number).
const groupMatchesByCategory = (list) => {
  const byKey = new Map();
  for (const m of list) {
    const name = m.categoryName || 'Matches';
    const level = m.categoryLevel || '';
    const key = `${name} · ${level}`;
    if (!byKey.has(key)) byKey.set(key, { key, name, level, items: [] });
    byKey.get(key).items.push(m);
  }
  return [...byKey.values()];
};

// Stable DOM id for a category section, so the top quick-jump chips can scroll to it.
const sectionId = (key) => 'umpcat-' + key.replace(/[^a-zA-Z0-9]+/g, '-');

// Split "A & B" (doubles) into two lines for a compact card.
const NameBlock = ({ name, align }) => {
  const parts = (name || 'TBD').split(' & ');
  return (
    <div style={{ textAlign: align, minWidth: 0 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.3, overflowWrap: 'anywhere' }}>{parts[0]}</div>
      {parts[1] && (
        <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', lineHeight: 1.3, overflowWrap: 'anywhere' }}>
          &amp; {parts[1]}
        </div>
      )}
    </div>
  );
};

const UmpirePoolPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [query, setQuery] = useState('');
  const [viewerId, setViewerId] = useState(null);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const pollRef = useRef(null);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!tournamentId) return;
    try {
      if (silent) setRefreshing(true); else setLoading(true);
      const res = await tournamentAPI.getUmpirePostedMatches(tournamentId);
      setTournament(res.tournament || null);
      setMatches(Array.isArray(res.matches) ? res.matches : []);
      setViewerId(res.viewerId || null);
      setIsOrganizer(!!res.isOrganizer);
      setError(null);
    } catch (err) {
      // Only surface a hard error on the initial load; a failed silent poll
      // keeps the last good list on screen.
      if (!silent) {
        const status = err?.response?.status;
        if (status === 403) setError('You are not registered as an umpire for this tournament.');
        else if (status === 404) setError('Tournament not found.');
        else setError(err?.response?.data?.error || 'Failed to load matches.');
      }
    } finally {
      if (silent) setRefreshing(false); else setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { load(); }, [load]);

  // Poll so a match another umpire just took flips to "Taken" without a manual refresh.
  useEffect(() => {
    pollRef.current = setInterval(() => {
      if (!document.hidden) load({ silent: true });
    }, 8000);
    return () => clearInterval(pollRef.current);
  }, [load]);

  if (loading) return <LoadingScreen message="Loading umpire matches…" />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center max-w-sm">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: B.red }} />
          <p className="text-white font-bold mb-4">{error}</p>
          <button onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const openMatches = matches.filter(m => m.status !== 'COMPLETED');
  const completedCount = matches.length - openMatches.length;

  const renderAction = (m) => {
    const mine = m.umpireId && viewerId && m.umpireId === viewerId;
    const takenByOther = m.umpireId && !mine;

    if (m.status === 'COMPLETED') {
      return (
        <div style={pill('rgba(34,197,94,0.1)', 'rgba(34,197,94,0.25)', B.green)}>
          <CheckCircle style={{ width: 15, height: 15 }} /> Completed
        </div>
      );
    }
    if (m.status === 'IN_PROGRESS') {
      if (mine || isOrganizer) {
        return (
          <button onClick={() => navigate(`/match/${m.id}/score`)} style={btn('rgba(245,158,11,0.2)', 'rgba(245,158,11,0.45)', B.goldSoft)}>
            <Play style={{ width: 14, height: 14 }} /> Resume Scoring
          </button>
        );
      }
      return (
        <div style={pill('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.55)')}>
          <Lock style={{ width: 14, height: 14 }} /> In Progress{m.umpireName ? ` · ${m.umpireName}` : ''}
        </div>
      );
    }
    // PENDING / READY / SCHEDULED — takeable, unless already claimed by someone else
    if (takenByOther) {
      return (
        <div style={pill('rgba(255,255,255,0.05)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.55)')}>
          <Lock style={{ width: 14, height: 14 }} /> Taken{m.umpireName ? ` · ${m.umpireName}` : ''}
        </div>
      );
    }
    return (
      <button onClick={() => navigate(`/match/${m.id}/conduct`)} style={btn('linear-gradient(135deg,#D97706,#F59E0B)', 'transparent', '#050810', true)}>
        <Play style={{ width: 14, height: 14 }} /> {isOrganizer ? 'Conduct' : 'Take & Start'}
      </button>
    );
  };

  // Search filters across player names, category name and level, and the match label.
  const q = query.trim().toLowerCase();
  const filteredMatches = q
    ? matches.filter((m) =>
        [m.player1Name, m.player2Name, m.categoryName, m.categoryLevel, matchLabel(m)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q)))
    : matches;
  const categories = filteredMatches.length ? groupMatchesByCategory(filteredMatches) : [];
  const jumpToCategory = (key) => {
    const el = document.getElementById(sectionId(key));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: B.bg }}>
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1.5 mb-5 text-sm font-bold"
          style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3"
            style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.28),rgba(245,158,11,0.15))', border: '1px solid rgba(245,158,11,0.4)' }}>
            <Gavel className="w-6 h-6" style={{ color: B.gold }} />
          </div>
          <h1 className="text-2xl font-black text-white leading-tight">Umpire Matches</h1>
          {tournament?.name && (
            <p className="text-sm mt-1 font-semibold" style={{ color: B.goldSoft }}>{tournament.name}</p>
          )}
          <p className="text-xs mt-1.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Matches posted by the organizer. Take one to start scoring — once you start it, it locks to you.
          </p>
        </div>

        {/* Summary + refresh */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {openMatches.length} available{completedCount > 0 ? ` · ${completedCount} completed` : ''}
          </span>
          <button onClick={() => load({ silent: true })} disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
            {refreshing ? <Spinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </button>
        </div>

        {/* Search bar — filter by player or category */}
        {matches.length > 0 && (
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'rgba(255,255,255,0.35)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search player or category…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-semibold outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' }}
            />
          </div>
        )}

        {/* Quick jump — tap a category to scroll straight to it */}
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 mb-4 -mx-1 px-1"
            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => jumpToCategory(cat.key)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{ background: 'rgba(196,181,253,0.1)', border: '1px solid rgba(196,181,253,0.3)', color: '#c4b5fd' }}>
                {cat.name}{cat.level ? ` · ${cat.level}` : ''}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(196,181,253,0.18)' }}>
                  {cat.items.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {matches.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <Swords className="w-9 h-9 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm font-bold text-white mb-1">No matches posted yet</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              When the organizer posts matches for umpiring, they'll show up here.
            </p>
          </div>
        ) : categories.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <Search className="w-9 h-9 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.2)' }} />
            <p className="text-sm font-bold text-white mb-1">No matches found</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Nothing matches “{query.trim()}”. Try a different player or category.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.key} id={sectionId(cat.key)} className="space-y-3" style={{ scrollMarginTop: 12 }}>
                {/* Category section header — keeps each category's matches separate */}
                <div className="flex items-center gap-2 px-1">
                  <span className="text-sm font-black" style={{ color: '#c4b5fd' }}>
                    {cat.name}{cat.level ? ` · ${cat.level}` : ''}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(196,181,253,0.12)', border: '1px solid rgba(196,181,253,0.25)', color: 'rgba(196,181,253,0.9)' }}>
                    {cat.items.length}
                  </span>
                </div>

                {cat.items.map((m) => (
                  <div key={m.id} className="rounded-2xl overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-2.5"
                      style={{ borderBottom: `1px solid ${B.border}`, background: 'rgba(255,255,255,0.03)' }}>
                      <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {matchLabel(m)}
                      </span>
                    </div>

                    {/* Players */}
                    <div className="px-4 py-3">
                      <div className="grid items-center gap-2" style={{ gridTemplateColumns: '1fr 40px 1fr' }}>
                        <NameBlock name={m.player1Name} align="left" />
                        <div className="flex items-center justify-center">
                          <span className="text-xs font-black px-2 py-1 rounded"
                            style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: 'rgba(245,158,11,0.75)' }}>VS</span>
                        </div>
                        <NameBlock name={m.player2Name} align="right" />
                      </div>

                      {m.courtNumber != null && (
                        <p className="text-center text-xs mt-2 font-semibold" style={{ color: 'rgba(255,255,255,0.4)' }}>
                          Court {m.courtNumber}
                        </p>
                      )}

                      <div className="mt-3">{renderAction(m)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Shared inline style helpers
function btn(bg, borderColor, color, solid = false) {
  return {
    width: '100%', padding: '10px 0', borderRadius: 10,
    background: bg, border: `1.5px solid ${borderColor}`, color,
    fontSize: 13, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
    boxShadow: solid ? '0 4px 14px rgba(245,158,11,0.3)' : 'none',
  };
}
function pill(bg, borderColor, color) {
  return {
    width: '100%', padding: '10px 0', borderRadius: 10,
    background: bg, border: `1px solid ${borderColor}`, color,
    fontSize: 12.5, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  };
}

export default UmpirePoolPage;
