// ── Central sports registry ─────────────────────────────────────────────────
// Single source of truth for every sport the app supports. Add a sport here and
// it becomes available across tournament creation, filtering, and display.
//
// Phase 1: racket sports (below). Phase 2 (later): cricket, basketball, football…
//   defaultScoring — "pointsPerSet x maxSets" for the existing point-based engine.
//   doubles        — whether the sport supports doubles categories.
//   ballTerm       — sport-appropriate word ("shuttle" / "ball") for neutral copy.

// scoringModel is the AUTHORITATIVE way a sport is scored — routing MUST use
// this (via getSport by exact id), never substring checks like /tennis/ which
// wrongly match "Table Tennis". model: 'points' (rally: race to N, win by 2)
// or 'tennis' (15/30/40, games, sets, tiebreak). For 'points': unit label,
// pointsToWin, bestOf, and cap (badminton's 30 deuce cap; null = pure win-by-2).
export const SPORTS = [
  { id: 'Badminton',    label: 'Badminton',    emoji: '🏸', defaultScoring: '21x3', doubles: true,  ballTerm: 'shuttle', scoringModel: { model: 'points', unit: 'Set',  pointsToWin: 21, bestOf: 3, cap: 30 } },
  { id: 'Tennis',       label: 'Tennis',       emoji: '🎾', defaultScoring: '6x3',  doubles: true,  ballTerm: 'ball',    scoringModel: { model: 'tennis' } },
  { id: 'Table Tennis', label: 'Table Tennis', emoji: '🏓', defaultScoring: '11x5', doubles: true,  ballTerm: 'ball',    scoringModel: { model: 'points', unit: 'Game', pointsToWin: 11, bestOf: 5, cap: null } },
  { id: 'Pickleball',   label: 'Pickleball',   emoji: '🥒', defaultScoring: '11x3', doubles: true,  ballTerm: 'ball',    scoringModel: { model: 'points', unit: 'Game', pointsToWin: 11, bestOf: 3, cap: null } },
  { id: 'Squash',       label: 'Squash',       emoji: '🎾', defaultScoring: '11x5', doubles: false, ballTerm: 'ball',    scoringModel: { model: 'points', unit: 'Game', pointsToWin: 11, bestOf: 5, cap: null } },
  { id: 'Padel',        label: 'Padel',        emoji: '🎾', defaultScoring: '6x3',  doubles: true,  ballTerm: 'ball',    scoringModel: { model: 'tennis' } },
];

export const DEFAULT_SPORT = 'Badminton';
export const RACKET_SPORTS = SPORTS.map((s) => s.id);

export const getSport = (id) => SPORTS.find((s) => s.id === id) || SPORTS[0];
export const sportEmoji = (id) => getSport(id).emoji;
export const sportLabel = (id) => getSport(id).label;
