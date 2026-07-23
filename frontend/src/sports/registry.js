// ── Sport scoring registry / dispatcher ─────────────────────────────────────
// Single place that maps a sport id → its scoring engine. The scoring screen
// asks the registry which engine to use; it holds NO sport-specific logic and
// no substring matching (so "Table Tennis" can never resolve to "Tennis").
//
// Point sports each have their own independent engine module. Tennis and Padel
// use the tennis engine (its own module, utils/tennisScoring.js). Adding a
// sport = add its module + one line here; existing sports are never touched.

import badminton from './badminton.js';
import pickleball from './pickleball.js';
import tableTennis from './tableTennis.js';
import squash from './squash.js';
import basketball from './basketball.js';

const POINT_ENGINES = {
  'Badminton': badminton,
  'Pickleball': pickleball,
  'Table Tennis': tableTennis,
  'Squash': squash,
};

// Sports scored by the tennis engine (15/30/40, games, sets, tiebreak).
const TENNIS_SPORTS = new Set(['Tennis', 'Padel']);

// Sports with a running total and quarters rather than sets/games. Each has
// its own engine and its own scoring console.
const RUNNING_TOTAL_ENGINES = {
  'Basketball': basketball,
};

// Returns { model: 'tennis' } OR { model: 'basketball', engine }
// OR { model: 'points', engine }.
export function getScoringModel(sportId) {
  if (TENNIS_SPORTS.has(sportId)) return { model: 'tennis' };
  const running = RUNNING_TOTAL_ENGINES[sportId];
  if (running) return { model: running.model, engine: running };
  const engine = POINT_ENGINES[sportId] || POINT_ENGINES['Badminton'];
  return { model: 'points', engine };
}

// The point engine for a sport (falls back to badminton for an unknown sport).
export function getPointEngine(sportId) {
  return POINT_ENGINES[sportId] || POINT_ENGINES['Badminton'];
}

export const isTennisModel = (sportId) => TENNIS_SPORTS.has(sportId);
