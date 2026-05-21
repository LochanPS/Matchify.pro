import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Radio, Trophy, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import { getTournamentLiveMatches, getTournamentCompletedMatches } from '../api/matches';
import { useWebSocket } from '../contexts/WebSocketContext';

/* ─── colour tokens ─────────────────────────────────────────── */
const C = {
  bg:       '#07071a',
  card:     'rgba(255,255,255,0.04)',
  border:   'rgba(255,255,255,0.08)',
  green:    '#00ff88',
  cyan:     '#00d4ff',
  red:      '#ff4466',
  gold:     '#ffd700',
  dim:      'rgba(255,255,255,0.45)',
  sub:      'rgba(255,255,255,0.65)',
  white:    '#ffffff',
};

/* ─── helpers ────────────────────────────────────────────────── */
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function getPlayerName(match, side) {
  if (side === 1) {
    if (match.player1?.name) return match.player1.name;
    if (match.team1Player1?.name) {
      const p2 = match.team1Player2?.name;
      return p2 ? `${match.team1Player1.name} / ${p2}` : match.team1Player1.name;
    }
    return 'TBD';
  }
  if (match.player2?.name) return match.player2.name;
  if (match.team2Player1?.name) {
    const p2 = match.team2Player2?.name;
    return p2 ? `${match.team2Player1.name} / ${p2}` : match.team2Player1.name;
  }
  return 'TBD';
}

/* ─── single match card ──────────────────────────────────────── */
function MatchCard({ match, isCompleted }) {
  const p1Name = getPlayerName(match, 1);
  const p2Name = getPlayerName(match, 2);
  const score  = match.scoreData || match.score;
  const sets   = score?.sets || [];
  const currentIdx = isCompleted
    ? sets.length - 1
    : (score?.currentSet ?? sets.length - 1);
  const setsToWin = score?.matchConfig?.setsToWin || 2;

  // Compute how many sets each player has won
  let p1SetWins = 0, p2SetWins = 0;
  sets.forEach((s, i) => {
    if (isCompleted || i < currentIdx) {
      const sp1 = s.player1 ?? s.p1 ?? 0;
      const sp2 = s.player2 ?? s.p2 ?? 0;
      if (sp1 > sp2) p1SetWins++;
      else if (sp2 > sp1) p2SetWins++;
    }
  });

  // Current set lead
  const curSet = sets[currentIdx] || null;
  const curP1  = curSet?.player1 ?? curSet?.p1 ?? 0;
  const curP2  = curSet?.player2 ?? curSet?.p2 ?? 0;
  const lead   = curP1 - curP2;

  const isP1Winner = isCompleted && match.winnerId &&
    match.winnerId === (match.player1Id || match.team1Player1Id);
  const isP2Winner = isCompleted && match.winnerId && !isP1Winner;

  const p1Short = p1Name.split(' ')[0];
  const p2Short = p2Name.split(' ')[0];

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${isCompleted ? 'rgba(255,215,0,0.12)' : 'rgba(0,255,136,0.18)'}`,
      borderRadius: 20,
      overflow: 'hidden',
    }}>
      {/* live gradient stripe */}
      {!isCompleted && (
        <div style={{ height: 3, background: 'linear-gradient(90deg, #00ff88, #00d4ff)' }} />
      )}

      <div style={{ padding: '14px 16px' }}>

        {/* ── header: status • category • court • # ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!isCompleted ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,68,102,0.15)', padding: '3px 9px',
                borderRadius: 20, border: '1px solid rgba(255,68,102,0.3)',
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: C.red, boxShadow: `0 0 6px ${C.red}`,
                  animation: 'livePulse 1.4s ease-in-out infinite',
                  display: 'inline-block',
                }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: C.red, letterSpacing: 1 }}>LIVE</span>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(255,215,0,0.1)', padding: '3px 9px',
                borderRadius: 20, border: '1px solid rgba(255,215,0,0.25)',
              }}>
                <Trophy size={10} color={C.gold} />
                <span style={{ fontSize: 10, fontWeight: 700, color: C.gold }}>FINAL</span>
              </div>
            )}
            {match.category?.name && (
              <span style={{
                fontSize: 10, color: C.cyan, fontWeight: 600,
                background: 'rgba(0,212,255,0.08)', padding: '2px 8px',
                borderRadius: 10, border: '1px solid rgba(0,212,255,0.15)',
              }}>{match.category.name}</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {match.courtNumber && (
              <span style={{
                fontSize: 10, color: C.sub,
                background: 'rgba(255,255,255,0.05)', padding: '2px 8px',
                borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
              }}>Court {match.courtNumber}</span>
            )}
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>#{match.matchNumber}</span>
          </div>
        </div>

        {/* ── players + set-win dots ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 14 }}>
          {/* P1 */}
          <div style={{ flex: 1, textAlign: 'right' }}>
            <p style={{
              fontSize: 15, fontWeight: 800,
              color: isP1Winner ? C.green : C.white,
              margin: '0 0 6px', lineHeight: 1.2,
            }}>
              {p1Name}{isP1Winner ? ' 🏆' : ''}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
              {Array.from({ length: setsToWin }).map((_, i) => (
                <div key={i} style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: i < p1SetWins ? C.green : 'rgba(255,255,255,0.1)',
                  border: `1.5px solid ${i < p1SetWins ? C.green : 'rgba(255,255,255,0.18)'}`,
                  boxShadow: i < p1SetWins ? `0 0 5px ${C.green}70` : 'none',
                }} />
              ))}
            </div>
          </div>

          {/* VS divider */}
          <div style={{
            flexShrink: 0, paddingTop: 2,
            fontSize: 11, fontWeight: 700,
            color: 'rgba(255,255,255,0.18)',
          }}>VS</div>

          {/* P2 */}
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{
              fontSize: 15, fontWeight: 800,
              color: isP2Winner ? C.green : C.white,
              margin: '0 0 6px', lineHeight: 1.2,
            }}>
              {isP2Winner ? '🏆 ' : ''}{p2Name}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: 4 }}>
              {Array.from({ length: setsToWin }).map((_, i) => (
                <div key={i} style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: i < p2SetWins ? C.cyan : 'rgba(255,255,255,0.1)',
                  border: `1.5px solid ${i < p2SetWins ? C.cyan : 'rgba(255,255,255,0.18)'}`,
                  boxShadow: i < p2SetWins ? `0 0 5px ${C.cyan}70` : 'none',
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* ── score table ── */}
        {sets.length > 0 ? (
          <div style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, overflow: 'hidden', marginBottom: 10,
          }}>
            {/* column headers */}
            <div style={{
              display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '5px 12px',
            }}>
              <div style={{ flex: 1 }} />
              {sets.map((_, i) => {
                const isCur = i === currentIdx && !isCompleted;
                return (
                  <div key={i} style={{
                    width: isCur ? 72 : 44,
                    textAlign: 'center', fontSize: 9, fontWeight: 700,
                    color: isCur ? C.green : C.dim,
                    letterSpacing: 0.5, textTransform: 'uppercase',
                  }}>
                    {isCur ? `▶ S${i + 1}` : `S${i + 1}`}
                  </div>
                );
              })}
              <div style={{ flex: 1 }} />
            </div>

            {/* P1 row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px 4px' }}>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>{p1Short}</span>
              </div>
              {sets.map((s, i) => {
                const sp1 = s.player1 ?? s.p1 ?? 0;
                const sp2 = s.player2 ?? s.p2 ?? 0;
                const isCur = i === currentIdx && !isCompleted;
                const winning = sp1 > sp2;
                return (
                  <div key={i} style={{
                    width: isCur ? 72 : 44,
                    textAlign: 'center',
                    fontSize: isCur ? 28 : 16,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: winning
                      ? (isCur ? C.green : 'rgba(0,255,136,0.75)')
                      : (isCur ? C.white : C.sub),
                  }}>{sp1}</div>
                );
              })}
              <div style={{ flex: 1 }} />
            </div>

            {/* separator */}
            <div style={{ display: 'flex', padding: '2px 12px' }}>
              <div style={{ flex: 1 }} />
              {sets.map((_, i) => {
                const isCur = i === currentIdx && !isCompleted;
                return (
                  <div key={i} style={{
                    width: isCur ? 72 : 44, textAlign: 'center',
                    color: 'rgba(255,255,255,0.12)',
                    fontSize: isCur ? 13 : 9,
                  }}>—</div>
                );
              })}
              <div style={{ flex: 1 }} />
            </div>

            {/* P2 row */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '4px 12px 8px' }}>
              <div style={{ flex: 1, textAlign: 'right', paddingRight: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: C.sub }}>{p2Short}</span>
              </div>
              {sets.map((s, i) => {
                const sp1 = s.player1 ?? s.p1 ?? 0;
                const sp2 = s.player2 ?? s.p2 ?? 0;
                const isCur = i === currentIdx && !isCompleted;
                const winning = sp2 > sp1;
                return (
                  <div key={i} style={{
                    width: isCur ? 72 : 44,
                    textAlign: 'center',
                    fontSize: isCur ? 28 : 16,
                    fontWeight: 900,
                    lineHeight: 1,
                    color: winning
                      ? (isCur ? C.cyan : 'rgba(0,212,255,0.75)')
                      : (isCur ? C.white : C.sub),
                  }}>{sp2}</div>
                );
              })}
              <div style={{ flex: 1 }} />
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 14, padding: '14px', marginBottom: 10, textAlign: 'center',
          }}>
            <span style={{ fontSize: 12, color: C.dim }}>Waiting to start…</span>
          </div>
        )}

        {/* ── lead indicator ── */}
        {!isCompleted && curSet && lead !== 0 && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700,
              color: lead > 0 ? C.green : C.cyan,
              background: lead > 0 ? 'rgba(0,255,136,0.08)' : 'rgba(0,212,255,0.08)',
              padding: '3px 14px', borderRadius: 20,
              border: `1px solid ${lead > 0 ? 'rgba(0,255,136,0.2)' : 'rgba(0,212,255,0.2)'}`,
            }}>
              {lead > 0 ? p1Short : p2Short} leads +{Math.abs(lead)}
            </span>
          </div>
        )}
        {!isCompleted && curSet && lead === 0 && (curP1 > 0 || curP2 > 0) && (
          <div style={{ textAlign: 'center', marginBottom: 10 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.gold,
              background: 'rgba(255,215,0,0.08)', padding: '3px 14px',
              borderRadius: 20, border: '1px solid rgba(255,215,0,0.2)',
            }}>Tied {curP1}–{curP2}</span>
          </div>
        )}

        {/* ── footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 8, paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Clock size={10} color={C.dim} />
          <span style={{ fontSize: 10, color: C.dim }}>
            {isCompleted
              ? `Ended ${timeAgo(match.completedAt)}`
              : `Started ${timeAgo(match.startedAt)}`}
          </span>
          {sets.length > 0 && (
            <>
              <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 10 }}>•</span>
              <span style={{ fontSize: 10, color: C.dim }}>
                {isCompleted
                  ? `${sets.length} set${sets.length > 1 ? 's' : ''} played`
                  : `Set ${currentIdx + 1}${sets.length > 1 ? ` of ${sets.length}` : ''}`}
              </span>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── smart diff: only update state if data actually changed ─── */
function diffAndUpdate(setter, newItems) {
  setter(prev => {
    if (prev.length !== newItems.length) return newItems;
    const changed = newItems.some((m, i) => {
      const p = prev[i];
      if (!p || p.id !== m.id) return true;
      // Compare score + status only — these are the things that change
      return p.status !== m.status ||
        JSON.stringify(p.scoreData) !== JSON.stringify(m.scoreData);
    });
    return changed ? newItems : prev; // return prev = no re-render
  });
}

/* ─── main page ──────────────────────────────────────────────── */
export default function TournamentLiveMatchesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useWebSocket();

  const [tab, setTab]                   = useState('live');
  const [liveMatches, setLiveMatches]   = useState([]);
  const [doneMatches, setDoneMatches]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [lastRefresh, setLastRefresh]   = useState(null);

  // Ref so socket effects don't need liveMatches as dependency
  const liveMatchesRef = useRef([]);
  useEffect(() => { liveMatchesRef.current = liveMatches; }, [liveMatches]);
  // Stable ref for fetchAll so interval never restarts
  const fetchAllRef = useRef(null);
  // Track whether initial load succeeded — suppress error banner on background poll failures
  const hasDataRef = useRef(false);

  const fetchAll = useCallback(async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const [liveRes, doneRes] = await Promise.all([
        getTournamentLiveMatches(id),
        getTournamentCompletedMatches(id),
      ]);
      diffAndUpdate(setLiveMatches, liveRes.matches || []);
      diffAndUpdate(setDoneMatches, doneRes.matches || []);
      setLastRefresh(new Date());
      hasDataRef.current = true;
      // Only clear error if one existed — avoids pointless re-render
      setError(prev => prev ? '' : prev);
    } catch {
      // Only show error banner on initial load — suppress background poll failures when data is already showing
      if (!hasDataRef.current) setError('Failed to load matches. Pull down to retry.');
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [id]);

  // Keep ref in sync with latest fetchAll
  useEffect(() => { fetchAllRef.current = fetchAll; }, [fetchAll]);

  /* initial fetch — show spinner only on first load */
  useEffect(() => { fetchAll(true); }, [fetchAll]);

  /* socket: join tournament room + listen for events */
  useEffect(() => {
    if (!socket) return;
    socket.emit('join-tournament', id);

    const onMatchStarted = () => fetchAllRef.current?.(false);
    const onMatchEnded   = () => fetchAllRef.current?.(false);

    socket.on('match-started', onMatchStarted);
    socket.on('match-ended',   onMatchEnded);

    return () => {
      socket.emit('leave-tournament', id);
      socket.off('match-started', onMatchStarted);
      socket.off('match-ended',   onMatchEnded);
    };
  }, [socket, id]); // no fetchAll dep — uses ref

  /* socket: score updates — stable, never re-registers on poll */
  useEffect(() => {
    if (!socket) return;

    const onScoreUpdate = ({ matchId, score }) => {
      setLiveMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, scoreData: score } : m
      ));
    };
    socket.on('score-update', onScoreUpdate);
    return () => socket.off('score-update', onScoreUpdate);
  }, [socket]); // stable — no liveMatches dep

  /* join/leave match rooms only when set of IDs actually changes */
  const joinedMatchIds = useRef(new Set());
  useEffect(() => {
    if (!socket) return;
    const newIds = new Set(liveMatches.map(m => m.id));
    // Join new matches
    newIds.forEach(mid => {
      if (!joinedMatchIds.current.has(mid)) {
        socket.emit('join-match', mid);
        joinedMatchIds.current.add(mid);
      }
    });
    // Leave removed matches
    joinedMatchIds.current.forEach(mid => {
      if (!newIds.has(mid)) {
        socket.emit('leave-match', mid);
        joinedMatchIds.current.delete(mid);
      }
    });
  }, [socket, liveMatches]);

  /* poll every 4s — uses ref so interval never restarts */
  useEffect(() => {
    const t = setInterval(() => fetchAllRef.current?.(false), 4000);
    return () => clearInterval(t);
  }, []); // empty deps — starts once, never restarts

  const activeList = tab === 'live' ? liveMatches : doneMatches;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, paddingBottom: 40 }}>
      {/* pulse keyframe */}
      <style>{`
        @keyframes livePulse {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>

      {/* header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(7,7,26,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
          >
            <ArrowLeftIcon style={{ width: 22, height: 22, color: C.white }} />
          </button>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={16} color={C.red} />
              <h1 style={{ fontSize: 18, fontWeight: 900, color: C.white, margin: 0 }}>
                Live Matches
              </h1>
            </div>
          </div>

          {/* connection indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {isConnected
              ? <Wifi size={14} color={C.green} />
              : <WifiOff size={14} color={C.dim} />}
          </div>
        </div>

        {/* tabs */}
        <div style={{
          display: 'flex',
          marginTop: 14,
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 12,
          padding: 3,
          gap: 3,
        }}>
          {[
            { key: 'live',      label: 'Live',      count: liveMatches.length },
            { key: 'completed', label: 'Completed',  count: doneMatches.length },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                fontSize: 14,
                transition: 'all 0.2s',
                background: tab === key
                  ? (key === 'live' ? 'rgba(255,68,102,0.2)' : 'rgba(255,215,0,0.15)')
                  : 'transparent',
                color: tab === key
                  ? (key === 'live' ? C.red : C.gold)
                  : C.dim,
                borderBottom: tab === key
                  ? `2px solid ${key === 'live' ? C.red : C.gold}`
                  : '2px solid transparent',
              }}
            >
              {label}
              {count > 0 && (
                <span style={{
                  marginLeft: 6,
                  fontSize: 11,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: tab === key
                    ? (key === 'live' ? 'rgba(255,68,102,0.3)' : 'rgba(255,215,0,0.25)')
                    : 'rgba(255,255,255,0.08)',
                  color: tab === key
                    ? (key === 'live' ? C.red : C.gold)
                    : C.dim,
                }}>{count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      <div style={{ padding: '16px 16px 0' }}>

        {/* error banner */}
        {error && (
          <div style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(255,68,102,0.12)',
            border: '1px solid rgba(255,68,102,0.3)',
            color: '#ff8899',
            fontSize: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{error}</span>
            <button
              onClick={fetchAll}
              style={{ background: 'none', border: 'none', color: '#ff8899', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}
            >Retry</button>
          </div>
        )}

        {/* loading */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 140,
                borderRadius: 16,
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${C.border}`,
                animation: 'pulse 1.5s ease-in-out infinite',
              }} />
            ))}
            <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
          </div>
        ) : activeList.length === 0 ? (
          /* empty state */
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '60px 20px', textAlign: 'center',
          }}>
            {tab === 'live' ? (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(255,68,102,0.1)',
                  border: '1px solid rgba(255,68,102,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Radio size={28} color={C.red} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.white, margin: '0 0 6px' }}>No live matches</p>
                <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>Matches will appear here when an umpire starts them</p>
              </>
            ) : (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(255,215,0,0.1)',
                  border: '1px solid rgba(255,215,0,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                }}>
                  <Trophy size={28} color={C.gold} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, color: C.white, margin: '0 0 6px' }}>No completed matches yet</p>
                <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>Completed matches will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeList.map(match => (
              <MatchCard
                key={match.id}
                match={match}
                isCompleted={tab === 'completed'}
              />
            ))}
          </div>
        )}

        {/* last refresh */}
        {lastRefresh && !loading && (
          <p style={{ textAlign: 'center', fontSize: 11, color: C.dim, marginTop: 20 }}>
            Updated {timeAgo(lastRefresh.toISOString())}
          </p>
        )}
      </div>
    </div>
  );
}
