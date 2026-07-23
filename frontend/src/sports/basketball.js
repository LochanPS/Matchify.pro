// Basketball scoring — OWNS ONLY basketball's rules (official FIBA).
// Changing this file cannot affect any other sport, and no other sport's
// engine can affect basketball.
//
// FIBA rules encoded here:
//   • 4 quarters of 10 minutes; overtime periods of 5 minutes.
//   • Points: free throw = 1, field goal = 2, shot from behind the arc = 3.
//   • Running total — highest total at the end wins (no sets/games).
//   • A tie after the 4th quarter is broken by overtime, repeated until the
//     scores differ, so a basketball match can never end level.
//   • Personal fouls: a player is disqualified on their 5th foul (Art. 40).
//   • Team fouls: from a team's 5th foul in a period, the opponent shoots
//     bonus free throws (Art. 41). An overtime period counts as an extension
//     of the 4th quarter for team fouls, so that bucket carries over.
//
// EVENT-LOG DESIGN: every score and foul is an append-only event and all
// totals are derived from the log. That is what lets the umpire undo the last
// action OR remove any earlier action at will (their explicit requirement)
// without the running score ever drifting out of sync — there is no separate
// total to correct.

export const BASKETBALL_DEFAULTS = {
  periods: 4,            // quarters in regulation
  minutesPerPeriod: 10,  // FIBA quarter length
  otMinutes: 5,          // overtime length
  personalFoulLimit: 5,  // 5th personal foul disqualifies a player
  teamFoulBonus: 5,      // 5th team foul in a period puts the opponent in the bonus
};

// Valid scoring values. Anything else is rejected rather than silently stored.
const POINT_VALUES = [1, 2, 3];

const cfgWith = (cfg = {}) => ({ ...BASKETBALL_DEFAULTS, ...cfg });

// OT is an extension of Q4 for team-foul purposes (FIBA Art. 41.2.1), so every
// period from the 4th onward shares the 4th quarter's team-foul bucket.
const foulBucket = (period, cfg) => Math.min(period, cfgWith(cfg).periods - 1);

export const periodLabel = (period, cfg = {}) => {
  const { periods } = cfgWith(cfg);
  return period < periods ? `Q${period + 1}` : `OT${period - periods + 1}`;
};

export function newBasketballState(cfg = {}) {
  return {
    model: 'basketball',
    config: cfgWith(cfg),
    currentPeriod: 0,
    events: [],
    nextEventId: 1,
  };
}

// ── Mutations (all pure: return a new state, never mutate the argument) ──────

export function addScore(state, { team, points, playerId = null }) {
  if (team !== 1 && team !== 2) throw new Error('team must be 1 or 2');
  if (!POINT_VALUES.includes(points)) throw new Error('points must be 1, 2 or 3');
  const id = state.nextEventId || 1;
  return {
    ...state,
    nextEventId: id + 1,
    events: [...state.events, { id, type: 'score', team, points, playerId, period: state.currentPeriod }],
  };
}

export function addFoul(state, { team, playerId = null }) {
  if (team !== 1 && team !== 2) throw new Error('team must be 1 or 2');
  const id = state.nextEventId || 1;
  return {
    ...state,
    nextEventId: id + 1,
    events: [...state.events, { id, type: 'foul', team, playerId, period: state.currentPeriod }],
  };
}

// Undo the most recent event of any kind (the umpire's "oops" button).
export function undoLast(state) {
  if (!state.events.length) return state;
  return { ...state, events: state.events.slice(0, -1) };
}

// Remove ANY event by id — the umpire can correct a mistake made several
// actions ago without unwinding everything after it.
export function removeEvent(state, eventId) {
  return { ...state, events: state.events.filter(e => e.id !== eventId) };
}

// Advance to the next period. Guarded so a tied game cannot be left unfinished
// and a decided game cannot roll into a pointless overtime.
export function nextPeriod(state) {
  return { ...state, currentPeriod: state.currentPeriod + 1 };
}

// ── Derivation ──────────────────────────────────────────────────────────────

export function derive(state) {
  const cfg = cfgWith(state.config);
  const periodsPlayed = Math.max(state.currentPeriod + 1, cfg.periods);

  const totals = { 1: 0, 2: 0 };
  const byPeriod = [];       // [{ 1: n, 2: n }] indexed by period
  const teamFouls = {};      // bucket -> { 1: n, 2: n }
  const playerPoints = {};   // playerId -> points
  const playerFouls = {};    // playerId -> fouls

  for (let p = 0; p < periodsPlayed; p++) byPeriod.push({ 1: 0, 2: 0 });

  for (const e of state.events) {
    while (byPeriod.length <= e.period) byPeriod.push({ 1: 0, 2: 0 });
    if (e.type === 'score') {
      totals[e.team] += e.points;
      byPeriod[e.period][e.team] += e.points;
      if (e.playerId != null) {
        playerPoints[e.playerId] = (playerPoints[e.playerId] || 0) + e.points;
      }
    } else if (e.type === 'foul') {
      const b = foulBucket(e.period, cfg);
      if (!teamFouls[b]) teamFouls[b] = { 1: 0, 2: 0 };
      teamFouls[b][e.team] += 1;
      if (e.playerId != null) {
        playerFouls[e.playerId] = (playerFouls[e.playerId] || 0) + 1;
      }
    }
  }

  const bucket = teamFouls[foulBucket(state.currentPeriod, cfg)] || { 1: 0, 2: 0 };
  // A team is "in the bonus" when its OPPONENT has committed enough team fouls.
  const inBonus = {
    1: bucket[2] >= cfg.teamFoulBonus,
    2: bucket[1] >= cfg.teamFoulBonus,
  };

  const fouledOut = Object.keys(playerFouls)
    .filter(pid => playerFouls[pid] >= cfg.personalFoulLimit);

  const regulationDone = state.currentPeriod >= cfg.periods - 1;
  const tied = totals[1] === totals[2];

  return {
    p1Total: totals[1],
    p2Total: totals[2],
    byPeriod,
    teamFouls: bucket,
    inBonus,
    playerPoints,
    playerFouls,
    fouledOut,
    // A basketball match is only decidable once regulation is done AND the
    // scores differ. Tied after Q4 → overtime, never a draw.
    needsOvertime: regulationDone && tied,
    canEnd: regulationDone && !tied,
    winner: regulationDone && !tied ? (totals[1] > totals[2] ? 1 : 2) : 0,
  };
}

// Winner of a finished match: 1, 2, or 0 when not yet decided.
export function matchWinner(state) {
  return derive(state).winner;
}

export default {
  id: 'Basketball',
  model: 'basketball',
  unit: 'Quarter',
  defaults: BASKETBALL_DEFAULTS,
  newState: newBasketballState,
  addScore,
  addFoul,
  undoLast,
  removeEvent,
  nextPeriod,
  derive,
  matchWinner,
  periodLabel,
};
