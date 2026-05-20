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

/* Render score sets: completed sets small badge, current set large */
function ScoreDisplay({ scoreData, isCompleted, winnerId, player1Id, player2Id }) {
  if (!scoreData?.sets?.length) {
    return <span style={{ color: C.dim, fontSize: 12 }}>No score yet</span>;
  }

  const sets = scoreData.sets;
  const currentIdx = isCompleted ? sets.length - 1 : (scoreData.currentSet ?? sets.length - 1);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {sets.map((s, i) => {
        const p1 = s.player1 ?? s.p1 ?? 0;
        const p2 = s.player2 ?? s.p2 ?? 0;
        const isCurrent = i === currentIdx && !isCompleted;
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: isCurrent ? '4px 10px' : '2px 8px',
              borderRadius: 8,
              background: isCurrent ? 'rgba(0,255,136,0.1)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${isCurrent ? 'rgba(0,255,136,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            <span style={{
              fontSize: isCurrent ? 18 : 13,
              fontWeight: 900,
              color: p1 > p2 ? C.green : C.white,
              minWidth: isCurrent ? 22 : 16,
              textAlign: 'center',
            }}>{p1}</span>
            <span style={{ color: C.dim, fontSize: isCurrent ? 14 : 11 }}>–</span>
            <span style={{
              fontSize: isCurrent ? 18 : 13,
              fontWeight: 900,
              color: p2 > p1 ? C.green : C.white,
              minWidth: isCurrent ? 22 : 16,
              textAlign: 'center',
            }}>{p2}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── single match card ──────────────────────────────────────── */
function MatchCard({ match, isCompleted }) {
  const p1Name = getPlayerName(match, 1);
  const p2Name = getPlayerName(match, 2);
  const score  = match.scoreData || match.score;
  const isP1Winner = isCompleted && match.winnerId && match.winnerId === (match.player1Id || match.team1Player1Id);
  const isP2Winner = isCompleted && match.winnerId && match.winnerId !== (match.player1Id || match.team1Player1Id) && match.winnerId;

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${isCompleted ? 'rgba(255,255,255,0.08)' : 'rgba(0,255,136,0.2)'}`,
        borderRadius: 16,
        padding: '16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* top stripe for live */}
      {!isCompleted && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #00ff88, #00d4ff)',
        }} />
      )}

      {/* header row: status + category + court */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isCompleted ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: C.red,
                boxShadow: `0 0 6px ${C.red}`,
                animation: 'livePulse 1.4s ease-in-out infinite',
                display: 'inline-block',
              }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: C.red, letterSpacing: 1 }}>LIVE</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Trophy size={12} color={C.gold} />
              <span style={{ fontSize: 11, fontWeight: 700, color: C.gold }}>COMPLETED</span>
            </div>
          )}
          {match.category?.name && (
            <span style={{
              fontSize: 11, color: C.cyan, fontWeight: 600,
              background: 'rgba(0,212,255,0.1)', padding: '2px 7px', borderRadius: 6,
            }}>{match.category.name}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {match.courtNumber && (
            <span style={{ fontSize: 11, color: C.dim }}>Court {match.courtNumber}</span>
          )}
          <span style={{ fontSize: 11, color: C.dim }}>
            #{match.matchNumber}
          </span>
        </div>
      </div>

      {/* players VS row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {/* player 1 */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <p style={{
            fontSize: 15, fontWeight: 800,
            color: isP1Winner ? C.green : C.white,
            margin: 0, lineHeight: 1.2,
          }}>{p1Name}</p>
          {isP1Winner && (
            <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>Winner ✓</span>
          )}
        </div>

        {/* VS badge */}
        <div style={{
          flexShrink: 0,
          width: 34, height: 34,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: C.dim,
        }}>VS</div>

        {/* player 2 */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{
            fontSize: 15, fontWeight: 800,
            color: isP2Winner ? C.green : C.white,
            margin: 0, lineHeight: 1.2,
          }}>{p2Name}</p>
          {isP2Winner && (
            <span style={{ fontSize: 10, color: C.green, fontWeight: 700 }}>Winner ✓</span>
          )}
        </div>
      </div>

      {/* score */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <ScoreDisplay
          scoreData={score}
          isCompleted={isCompleted}
          winnerId={match.winnerId}
          player1Id={match.player1Id}
          player2Id={match.player2Id}
        />
      </div>

      {/* footer: time */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4 }}>
        <Clock size={11} color={C.dim} />
        <span style={{ fontSize: 11, color: C.dim }}>
          {isCompleted
            ? `Ended ${timeAgo(match.completedAt)}`
            : `Started ${timeAgo(match.startedAt)}`}
        </span>
      </div>
    </div>
  );
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

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [liveRes, doneRes] = await Promise.all([
        getTournamentLiveMatches(id),
        getTournamentCompletedMatches(id),
      ]);
      setLiveMatches(liveRes.matches || []);
      setDoneMatches(doneRes.matches || []);
      setLastRefresh(new Date());
    } catch {
      setError('Failed to load matches. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  /* initial fetch */
  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* socket: join tournament room + listen for events */
  useEffect(() => {
    if (!socket) return;
    socket.emit('join-tournament', id);

    const onMatchStarted = () => fetchAll();
    const onMatchEnded   = () => fetchAll();

    socket.on('match-started', onMatchStarted);
    socket.on('match-ended',   onMatchEnded);

    return () => {
      socket.emit('leave-tournament', id);
      socket.off('match-started', onMatchStarted);
      socket.off('match-ended',   onMatchEnded);
    };
  }, [socket, id, fetchAll]);

  /* socket: listen for score updates on live matches */
  useEffect(() => {
    if (!socket || !liveMatches.length) return;

    liveMatches.forEach(m => socket.emit('join-match', m.id));

    const onScoreUpdate = ({ matchId, score }) => {
      setLiveMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, scoreData: score } : m
      ));
    };
    socket.on('score-update', onScoreUpdate);

    return () => {
      liveMatches.forEach(m => socket.emit('leave-match', m.id));
      socket.off('score-update', onScoreUpdate);
    };
  }, [socket, liveMatches]);

  /* fallback poll every 30s */
  useEffect(() => {
    const t = setInterval(fetchAll, 30000);
    return () => clearInterval(t);
  }, [fetchAll]);

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
