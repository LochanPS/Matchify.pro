// Basketball scoring console — OWNS ONLY basketball's scoring UI.
// Rendered instead of the rally/tennis scoreboard, never alongside it, so no
// racket sport's screen can be affected by a change here.
//
// Deliberately simple, per the tournament owner's brief:
//   • Team 1 vs Team 2, one running total each, highest wins, OT breaks a tie.
//   • Each team's five on-court players, opened by a dropdown under the name.
//   • +1 / +2 / +3 per player raises THAT player's points and the team total.
//   • Substitutes can be swapped onto the court.
//   • Per player we track ONLY points scored in this match — no fouls, no other
//     box-score stats.
//   • The umpire scores in LANDSCAPE; portrait shows a rotate prompt.
//
// All scoring rules live in src/sports/basketball.js; this file only renders
// state and forwards actions. Fouls still exist in the engine but are never
// surfaced here.

import { useState, useEffect } from 'react';
import { ArrowLeft, Play, Trophy, RotateCcw, ChevronDown, ChevronUp, RefreshCw, Smartphone } from 'lucide-react';
import bb, { addScore, undoLast, nextPeriod, derive, periodLabel } from '../../sports/basketball';

const B = {
  bg: '#040810',
  card: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.08)',
  green: '#F59E0B',
  cyan: '#FCD34D',
  amber: '#fbbf24',
  red: '#f87171',
};

const rosterOf = (player) => (Array.isArray(player?.roster) ? player.roster : []);
const playerKey = (team, idx) => `${team}-${idx}`;

// The five who start on court: starters first, then fill from the rest, capped
// at five. Fewer than five in the roster → whoever is there.
const defaultLineup = (roster) => {
  const starters = roster.map((p, i) => ({ p, i })).filter(x => x.p.starter).map(x => x.i);
  const rest = roster.map((_, i) => i).filter(i => !starters.includes(i));
  return [...starters, ...rest].slice(0, Math.min(5, roster.length));
};

// Is the viewport portrait on a phone-sized screen? Desktop (wide) is exempt so
// a narrow desktop window is not nagged to rotate.
const usePortraitPhone = () => {
  const check = () => typeof window !== 'undefined'
    && window.innerHeight > window.innerWidth
    && window.innerWidth < 900;
  const [portrait, setPortrait] = useState(check);
  useEffect(() => {
    const on = () => setPortrait(check());
    window.addEventListener('resize', on);
    window.addEventListener('orientationchange', on);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('orientationchange', on); };
  }, []);
  return portrait;
};

export default function BasketballScoringConsole({
  match, score, onScoreChange, onEndMatch, onStart, onBack,
  canScore, canStart, saving,
}) {
  const [openTeam, setOpenTeam] = useState(null);   // which team's bench is open
  const [pendingSub, setPendingSub] = useState(null); // { team, benchIdx } waiting to be swapped in
  const [confirmEnd, setConfirmEnd] = useState(false);
  const portrait = usePortraitPhone();

  const state = score && score.model === 'basketball' ? score : bb.newState();
  const d = derive(state);
  const cfg = state.config || bb.defaults;

  const p1 = match?.player1 || { name: 'Team 1' };
  const p2 = match?.player2 || { name: 'Team 2' };
  const teamName = (t) => (t === 1 ? p1 : p2)?.name || `Team ${t}`;
  const teamPlayer = (t) => (t === 1 ? p1 : p2);

  const lineups = {
    1: state.onCourt?.[1] || defaultLineup(rosterOf(p1)),
    2: state.onCourt?.[2] || defaultLineup(rosterOf(p2)),
  };

  const apply = (next) => onScoreChange(next);
  const doScore = (team, points, playerIdx) => {
    if (!canScore) return;
    apply(addScore(state, { team, points, playerId: playerIdx == null ? null : playerKey(team, playerIdx) }));
  };
  const doUndo = () => { if (canScore && state.events.length) apply(undoLast(state)); };
  const doNextPeriod = () => { if (canScore) apply(nextPeriod(state)); };

  // Swap a bench player onto the court in place of an on-court player.
  const doSwap = (team, onCourtIdx, benchIdx) => {
    if (!canScore) return;
    const next = lineups[team].map(i => (i === onCourtIdx ? benchIdx : i));
    apply({ ...state, onCourt: { ...lineups, [team]: next } });
    setPendingSub(null);
  };

  const label = periodLabel(state.currentPeriod, cfg);
  const isRegulation = state.currentPeriod < cfg.periods;

  // ── Pre-start ─────────────────────────────────────────────────────────────
  if (canStart) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: B.bg }}>
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🏀</div>
          <h2 className="text-lg font-black text-white mb-1">{teamName(1)} vs {teamName(2)}</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.45)' }}>
            {cfg.periods} quarters · overtime breaks a tie · highest total wins
          </p>
          <button onClick={onStart} disabled={saving}
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 disabled:opacity-50 mb-3"
            style={{ background: B.green, color: '#050810' }}>
            <Play className="w-5 h-5" /> {saving ? 'Starting…' : 'Start match'}
          </button>
          <button onClick={onBack} className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Portrait: ask the umpire to rotate ──────────────────────────────────────
  if (portrait) {
    return (
      <div className="min-h-screen flex items-center justify-center px-8 text-center" style={{ background: B.bg }}>
        <div>
          <Smartphone className="w-12 h-12 mx-auto mb-4" style={{ color: B.green, transform: 'rotate(90deg)' }} />
          <h2 className="text-lg font-black text-white mb-2">Turn your phone sideways</h2>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Basketball is scored in landscape so both teams and all players fit on screen.
            Rotate your device to continue.
          </p>
          <button onClick={onBack} className="mt-6 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Team column (landscape) ─────────────────────────────────────────────────
  const TeamColumn = ({ team, align }) => {
    const roster = rosterOf(teamPlayer(team));
    const onCourt = lineups[team];
    const benchIdx = roster.map((_, i) => i).filter(i => !onCourt.includes(i));
    const benchOpen = openTeam === team;

    return (
      <div className="flex-1 min-w-0 flex flex-col h-full" style={{ padding: '8px 10px' }}>
        {/* Team name + dropdown toggle */}
        <button
          onClick={() => { setOpenTeam(benchOpen ? null : team); setPendingSub(null); }}
          className="flex items-center gap-1.5 mb-1.5"
          style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}
          disabled={!roster.length}
        >
          <span className="text-sm font-black text-white truncate">{teamName(team)}</span>
          {roster.length > 0 && (benchOpen
            ? <ChevronUp className="w-4 h-4 flex-shrink-0" style={{ color: B.cyan }} />
            : <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />)}
        </button>

        {roster.length === 0 ? (
          // No roster captured — score for the team as a whole.
          <div className="flex-1 flex flex-col justify-center">
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map(pts => (
                <button key={pts} onClick={() => doScore(team, pts, null)} disabled={!canScore}
                  className="py-3 rounded-xl font-black text-base disabled:opacity-30"
                  style={{ background: 'rgba(245,158,11,0.15)', color: B.green, border: '1px solid rgba(245,158,11,0.35)' }}>
                  +{pts}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-center mt-2" style={{ color: 'rgba(255,255,255,0.3)' }}>
              No roster — points count for the team
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-0.5 space-y-1">
            {/* On-court five: name + points + scoring buttons */}
            {onCourt.map(idx => {
              const pl = roster[idx];
              const pts = d.playerPoints[playerKey(team, idx)] || 0;
              const isReplaceTarget = pendingSub && pendingSub.team === team;
              return (
                <div key={idx}
                  onClick={isReplaceTarget ? () => doSwap(team, idx, pendingSub.benchIdx) : undefined}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5"
                  style={{
                    background: isReplaceTarget ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.05)',
                    border: isReplaceTarget ? '1px dashed rgba(245,158,11,0.6)' : '1px solid rgba(255,255,255,0.07)',
                    cursor: isReplaceTarget ? 'pointer' : 'default',
                  }}>
                  <span className="font-mono text-[10px] w-6 text-center flex-shrink-0"
                    style={{ color: pl.jersey ? B.cyan : 'rgba(255,255,255,0.25)' }}>
                    {pl.jersey ? `#${pl.jersey}` : '—'}
                  </span>
                  <span className="flex-1 min-w-0 truncate text-xs font-bold text-white">{pl.name}</span>
                  <span className="text-sm font-black w-6 text-center flex-shrink-0" style={{ color: B.green }}>{pts}</span>
                  {!isReplaceTarget && (
                    <div className="flex gap-1 flex-shrink-0">
                      {[1, 2, 3].map(p => (
                        <button key={p} onClick={() => doScore(team, p, idx)} disabled={!canScore}
                          className="w-7 h-7 rounded-md font-black text-xs disabled:opacity-30"
                          style={{ background: 'rgba(245,158,11,0.15)', color: B.green, border: '1px solid rgba(245,158,11,0.3)' }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                  {isReplaceTarget && (
                    <span className="text-[10px] font-black flex-shrink-0" style={{ color: B.green }}>TAP TO REPLACE</span>
                  )}
                </div>
              );
            })}

            {/* Bench, revealed by the dropdown, for substitutions */}
            {benchOpen && (
              <div className="mt-1.5 pt-1.5" style={{ borderTop: `1px solid ${B.border}` }}>
                <p className="text-[10px] font-black mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {pendingSub ? 'NOW TAP THE PLAYER TO REPLACE' : 'BENCH — TAP TO SUB IN'}
                </p>
                {benchIdx.length === 0 && (
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>No substitutes</p>
                )}
                {benchIdx.map(idx => {
                  const pl = roster[idx];
                  const pts = d.playerPoints[playerKey(team, idx)] || 0;
                  const armed = pendingSub && pendingSub.team === team && pendingSub.benchIdx === idx;
                  return (
                    <button key={idx}
                      onClick={() => setPendingSub(armed ? null : { team, benchIdx: idx })}
                      className="w-full flex items-center gap-1.5 rounded-lg px-2 py-1.5 mb-1"
                      style={{
                        background: armed ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.03)',
                        border: armed ? '1px solid rgba(245,158,11,0.5)' : '1px solid rgba(255,255,255,0.06)',
                      }}>
                      <RefreshCw className="w-3 h-3 flex-shrink-0" style={{ color: armed ? B.green : 'rgba(255,255,255,0.35)' }} />
                      <span className="font-mono text-[10px] w-6 text-center flex-shrink-0"
                        style={{ color: pl.jersey ? B.cyan : 'rgba(255,255,255,0.25)' }}>
                        {pl.jersey ? `#${pl.jersey}` : '—'}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-xs font-bold text-left"
                        style={{ color: 'rgba(255,255,255,0.75)' }}>{pl.name}</span>
                      <span className="text-xs font-black flex-shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }}>{pts}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ── Center column: score + controls ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: B.bg }}>
      {/* Top strip */}
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0" style={{ borderBottom: `1px solid ${B.border}` }}>
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="text-center">
          <span className="text-sm font-black" style={{ color: B.cyan }}>{label}</span>
          <span className="text-[10px] ml-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            {isRegulation ? `${cfg.minutesPerPeriod} min` : `${cfg.otMinutes} min OT`}
          </span>
        </div>
        <button onClick={doUndo} disabled={!canScore || !state.events.length}
          className="flex items-center gap-1 text-xs font-bold disabled:opacity-30" style={{ color: B.amber }}>
          <RotateCcw className="w-4 h-4" /> Undo
        </button>
      </div>

      {/* Body: Team | Score | Team */}
      <div className="flex-1 flex min-h-0">
        <TeamColumn team={1} align="left" />

        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0" style={{ width: '110px', borderLeft: `1px solid ${B.border}`, borderRight: `1px solid ${B.border}` }}>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black" style={{ color: d.p1Total >= d.p2Total ? '#fff' : 'rgba(255,255,255,0.6)' }}>{d.p1Total}</span>
            <span className="text-lg font-black" style={{ color: 'rgba(255,255,255,0.3)' }}>-</span>
            <span className="text-3xl font-black" style={{ color: d.p2Total >= d.p1Total ? '#fff' : 'rgba(255,255,255,0.6)' }}>{d.p2Total}</span>
          </div>

          {d.needsOvertime && (
            <p className="text-[9px] text-center mt-2 font-bold" style={{ color: B.amber }}>Tied — play overtime</p>
          )}

          {(!d.canEnd || d.needsOvertime) && canScore && (
            <button onClick={doNextPeriod}
              className="mt-3 w-full py-2 rounded-lg text-[11px] font-black"
              style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: `1px solid ${B.border}` }}>
              {d.needsOvertime ? `Start ${periodLabel(state.currentPeriod + 1, cfg)}` : `End ${label}`}
            </button>
          )}
          {d.canEnd && canScore && (
            <button onClick={() => setConfirmEnd(true)}
              className="mt-3 w-full py-2.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1"
              style={{ background: B.green, color: '#050810' }}>
              <Trophy className="w-3.5 h-3.5" /> End
            </button>
          )}
        </div>

        <TeamColumn team={2} align="right" />
      </div>

      {/* End-match confirmation */}
      {confirmEnd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: 'rgba(0,0,0,0.75)' }}>
          <div className="w-full max-w-sm rounded-2xl p-5" style={{ background: '#0a1020', border: `1px solid ${B.border}` }}>
            <Trophy className="w-8 h-8 mx-auto mb-2" style={{ color: B.green }} />
            <p className="text-center text-white font-black text-base mb-1">{teamName(d.winner)} wins</p>
            <p className="text-center text-sm mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Final score {d.p1Total} – {d.p2Total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmEnd(false)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'rgba(255,255,255,0.07)', color: '#fff', border: `1px solid ${B.border}` }}>
                Cancel
              </button>
              <button onClick={() => onEndMatch(d.winner)} disabled={saving}
                className="flex-1 py-2.5 rounded-xl font-black text-sm disabled:opacity-50"
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
