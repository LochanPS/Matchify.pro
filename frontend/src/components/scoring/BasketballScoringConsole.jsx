// Basketball scoring console — OWNS ONLY basketball's scoring UI.
// It is rendered instead of the rally/tennis scoreboard, never alongside it,
// so no racket sport's screen can be affected by a change made here.
//
// All rules come from src/sports/basketball.js; this file only renders state
// and forwards umpire actions to the engine. The umpire can add any score,
// undo the last action, or delete ANY earlier action from the log at will.

import { useState } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw, Trash2, AlertTriangle, ChevronRight } from 'lucide-react';
import bb, {
  addScore, addFoul, undoLast, removeEvent, nextPeriod, derive, periodLabel,
} from '../../sports/basketball';

const B = {
  bg: '#040810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  amber: '#fbbf24',
  red: '#f87171',
};

// A team's roster comes from its registration. Players are identified by their
// index within that roster so ids stay stable even if two players share a name.
const rosterOf = (player) => (Array.isArray(player?.roster) ? player.roster : []);
const playerKey = (team, idx) => `${team}-${idx}`;

export default function BasketballScoringConsole({
  match, score, onScoreChange, onEndMatch, onStart, onBack,
  canScore, isInProgress, canStart, saving,
}) {
  // Which player subsequent points/fouls are credited to, per team. Null means
  // "team only" — the score is still recorded, it just isn't attributed. Never
  // block the umpire from scoring because nobody was selected.
  const [selected, setSelected] = useState({ 1: null, 2: null });
  const [showLog, setShowLog] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const state = score && score.model === 'basketball' ? score : bb.newState();
  const d = derive(state);
  const cfg = state.config || bb.defaults;

  const p1 = match?.player1 || { name: 'Team 1' };
  const p2 = match?.player2 || { name: 'Team 2' };
  const teamName = (t) => (t === 1 ? p1 : p2)?.name || `Team ${t}`;
  const teamPlayer = (t) => (t === 1 ? p1 : p2);

  const apply = (next) => onScoreChange(next);

  const doScore = (team, points) => {
    if (!canScore) return;
    apply(addScore(state, { team, points, playerId: selected[team] }));
  };
  const doFoul = (team) => {
    if (!canScore) return;
    apply(addFoul(state, { team, playerId: selected[team] }));
  };
  const doUndo = () => { if (canScore) apply(undoLast(state)); };
  const doRemove = (id) => { if (canScore) apply(removeEvent(state, id)); };
  const doNextPeriod = () => { if (canScore) apply(nextPeriod(state)); };

  const label = periodLabel(state.currentPeriod, cfg);
  const isRegulation = state.currentPeriod < cfg.periods;

  // ── Pre-start ─────────────────────────────────────────────────────────────
  if (canStart) {
    return (
      <div className="min-h-screen" style={{ background: B.bg }}>
        <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold mb-5"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">🏀</div>
            <h2 className="text-lg font-black text-white">{teamName(1)} vs {teamName(2)}</h2>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {cfg.periods} quarters × {cfg.minutesPerPeriod} min · overtime {cfg.otMinutes} min
            </p>
          </div>
          <div className="rounded-2xl p-4 mb-6" style={{ background: B.card, border: `1px solid ${B.border}` }}>
            <p className="text-xs font-black mb-2" style={{ color: B.cyan }}>OFFICIAL FIBA RULES</p>
            <ul className="text-xs space-y-1.5" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <li>• Free throw 1 point · field goal 2 · behind the arc 3</li>
              <li>• Highest total wins — a tie goes to overtime</li>
              <li>• 5th team foul in a quarter puts the opponent in the bonus</li>
              <li>• A player is disqualified on their 5th personal foul</li>
            </ul>
          </div>
          <button onClick={onStart} disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: B.green, color: '#050810' }}>
            <Play className="w-5 h-5" /> {saving ? 'Starting…' : 'Start match'}
          </button>
        </div>
      </div>
    );
  }

  // ── Team column ───────────────────────────────────────────────────────────
  const TeamPanel = ({ team }) => {
    const roster = rosterOf(teamPlayer(team));
    const total = team === 1 ? d.p1Total : d.p2Total;
    const sel = selected[team];
    return (
      <div className="rounded-2xl p-3" style={{ background: B.card, border: `1px solid ${B.border}` }}>
        <div className="flex items-baseline justify-between mb-1">
          <p className="text-sm font-black text-white truncate flex-1 min-w-0">{teamName(team)}</p>
          {d.inBonus[team === 1 ? 2 : 1] && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded ml-1 flex-shrink-0"
              style={{ background: 'rgba(251,191,36,0.15)', color: B.amber }}>BONUS</span>
          )}
        </div>
        <p className="text-5xl font-black text-center my-2" style={{ color: '#fff' }}>{total}</p>
        <p className="text-[11px] text-center mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Team fouls this period: <span style={{ color: d.teamFouls[team] >= cfg.teamFoulBonus ? B.amber : 'inherit' }}>
            {d.teamFouls[team] || 0}
          </span>
        </p>

        {/* Roster — tap a player to credit the next score to them */}
        {roster.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {roster.map((pl, idx) => {
              const key = playerKey(team, idx);
              const active = sel === key;
              const pts = d.playerPoints[key] || 0;
              const fouls = d.playerFouls[key] || 0;
              const out = fouls >= cfg.personalFoulLimit;
              return (
                <button key={key} type="button"
                  onClick={() => setSelected(s => ({ ...s, [team]: active ? null : key }))}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold transition-all active:scale-95"
                  style={active
                    ? { background: B.green, color: '#050810' }
                    : { background: 'rgba(255,255,255,0.06)', color: out ? B.red : 'rgba(255,255,255,0.65)',
                        border: `1px solid ${out ? 'rgba(248,113,113,0.4)' : 'rgba(255,255,255,0.1)'}` }}>
                  {pl.jersey ? `#${pl.jersey} ` : ''}{pl.name}
                  <span style={{ opacity: 0.75 }}> · {pts}</span>
                  {fouls > 0 && <span style={{ opacity: 0.75 }}> · {fouls}F</span>}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] mb-2 text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {sel ? 'Points credited to selected player' : 'No player selected — points count for the team'}
        </p>

        {/* Scoring buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          {[1, 2, 3].map(pts => (
            <button key={pts} type="button" onClick={() => doScore(team, pts)} disabled={!canScore}
              className="py-3 rounded-xl font-black text-lg transition-all active:scale-95 disabled:opacity-30"
              style={{ background: 'rgba(245,158,11,0.15)', color: B.green, border: '1px solid rgba(245,158,11,0.35)' }}>
              +{pts}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => doFoul(team)} disabled={!canScore}
          className="w-full mt-1.5 py-2 rounded-xl font-bold text-xs transition-all active:scale-95 disabled:opacity-30"
          style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}>
          Foul
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ background: B.bg }}>
      <div className="px-3 pt-4 pb-28 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold"
            style={{ color: 'rgba(255,255,255,0.5)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-center">
            <p className="text-sm font-black" style={{ color: B.cyan }}>{label}</p>
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {isRegulation ? `${cfg.minutesPerPeriod} min` : `${cfg.otMinutes} min overtime`}
            </p>
          </div>
          <button onClick={doUndo} disabled={!canScore || !state.events.length}
            className="flex items-center gap-1 text-sm font-bold disabled:opacity-30"
            style={{ color: B.amber }}>
            <RotateCcw className="w-4 h-4" /> Undo
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <TeamPanel team={1} />
          <TeamPanel team={2} />
        </div>

        {/* Per-quarter breakdown */}
        <div className="rounded-2xl mt-3 overflow-hidden" style={{ background: B.card, border: `1px solid ${B.border}` }}>
          <div className="grid" style={{ gridTemplateColumns: `1.4fr repeat(${d.byPeriod.length}, 1fr)` }}>
            <div className="px-2 py-1.5 text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.35)' }}>PERIOD</div>
            {d.byPeriod.map((_, i) => (
              <div key={i} className="px-1 py-1.5 text-[10px] font-black text-center"
                style={{ color: i === state.currentPeriod ? B.cyan : 'rgba(255,255,255,0.35)' }}>
                {periodLabel(i, cfg)}
              </div>
            ))}
          </div>
          {[1, 2].map(t => (
            <div key={t} className="grid" style={{ gridTemplateColumns: `1.4fr repeat(${d.byPeriod.length}, 1fr)`, borderTop: `1px solid ${B.border}` }}>
              <div className="px-2 py-1.5 text-[11px] font-bold text-white truncate">{teamName(t)}</div>
              {d.byPeriod.map((q, i) => (
                <div key={i} className="px-1 py-1.5 text-[11px] font-bold text-center" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {q[t]}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Fouled-out warning */}
        {d.fouledOut.length > 0 && (
          <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.red }} />
            <p className="text-xs font-bold" style={{ color: B.red }}>
              {d.fouledOut.length} player{d.fouledOut.length === 1 ? '' : 's'} disqualified on {cfg.personalFoulLimit} fouls
            </p>
          </div>
        )}

        {/* Period / match control */}
        <div className="mt-3 space-y-2">
          {d.needsOvertime && (
            <div className="px-3 py-2 rounded-xl text-xs font-bold text-center"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: B.amber }}>
              Scores are level — basketball cannot end in a draw. Play overtime.
            </div>
          )}
          {(!d.canEnd || d.needsOvertime) && canScore && (
            <button onClick={doNextPeriod}
              className="w-full py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: `1px solid ${B.border}` }}>
              {d.needsOvertime
                ? `Start ${periodLabel(state.currentPeriod + 1, cfg)}`
                : `End ${label} → ${periodLabel(state.currentPeriod + 1, cfg)}`}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {d.canEnd && canScore && (
            <button onClick={() => setConfirmEnd(true)}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2"
              style={{ background: B.green, color: '#050810' }}>
              <Trophy className="w-5 h-5" /> End match — {teamName(d.winner)} wins
            </button>
          )}
        </div>

        {/* Event log — the umpire can delete any individual action */}
        {state.events.length > 0 && (
          <div className="mt-4">
            <button onClick={() => setShowLog(v => !v)} className="text-xs font-bold"
              style={{ color: 'rgba(255,255,255,0.45)' }}>
              {showLog ? 'Hide' : 'Show'} action log ({state.events.length})
            </button>
            {showLog && (
              <div className="mt-2 space-y-1">
                {[...state.events].reverse().map(e => (
                  <div key={e.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                    style={{ background: B.card, border: `1px solid ${B.border}` }}>
                    <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      {periodLabel(e.period, cfg)}
                    </span>
                    <span className="text-xs font-bold text-white flex-1 min-w-0 truncate">
                      {teamName(e.team)} · {e.type === 'score' ? `+${e.points}` : 'Foul'}
                      {e.playerId && (() => {
                        const [t, i] = e.playerId.split('-');
                        const pl = rosterOf(teamPlayer(Number(t)))[Number(i)];
                        return pl ? ` · ${pl.name}` : '';
                      })()}
                    </span>
                    <button onClick={() => doRemove(e.id)} disabled={!canScore}
                      className="p-1.5 rounded-lg flex-shrink-0 disabled:opacity-30"
                      style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)' }}>
                      <Trash2 className="w-3.5 h-3.5" style={{ color: B.red }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* End-match confirmation */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-lg rounded-t-3xl p-5" style={{ background: '#0a1020', border: `1px solid ${B.border}` }}>
            <Trophy className="w-9 h-9 mx-auto mb-3" style={{ color: B.green }} />
            <p className="text-center text-white font-black text-lg mb-1">{teamName(d.winner)} wins</p>
            <p className="text-center text-sm mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Final score {d.p1Total} – {d.p2Total}. This cannot be undone from here.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmEnd(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: `1px solid ${B.border}` }}>
                Cancel
              </button>
              <button onClick={() => onEndMatch(d.winner)} disabled={saving}
                className="flex-1 py-3 rounded-2xl font-black text-sm disabled:opacity-50"
                style={{ background: B.green, color: '#050810' }}>
                {saving ? 'Saving…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
