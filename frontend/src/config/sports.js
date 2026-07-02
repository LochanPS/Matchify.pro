// ── Central sports registry ─────────────────────────────────────────────────
// Single source of truth for every sport the app supports. Add a sport here and
// it becomes available across tournament creation, filtering, and display.
//
// Phase 1: racket sports (below). Phase 2 (later): cricket, basketball, football…
//   defaultScoring — "pointsPerSet x maxSets" for the existing point-based engine.
//   doubles        — whether the sport supports doubles categories.
//   ballTerm       — sport-appropriate word ("shuttle" / "ball") for neutral copy.

export const SPORTS = [
  { id: 'Badminton',    label: 'Badminton',    emoji: '🏸', defaultScoring: '21x3', doubles: true,  ballTerm: 'shuttle' },
  { id: 'Tennis',       label: 'Tennis',       emoji: '🎾', defaultScoring: '6x3',  doubles: true,  ballTerm: 'ball' },
  { id: 'Table Tennis', label: 'Table Tennis', emoji: '🏓', defaultScoring: '11x5', doubles: true,  ballTerm: 'ball' },
  { id: 'Pickleball',   label: 'Pickleball',   emoji: '🥒', defaultScoring: '11x3', doubles: true,  ballTerm: 'ball' },
  { id: 'Squash',       label: 'Squash',       emoji: '🎾', defaultScoring: '11x5', doubles: false, ballTerm: 'ball' },
  { id: 'Padel',        label: 'Padel',        emoji: '🎾', defaultScoring: '6x3',  doubles: true,  ballTerm: 'ball' },
];

export const DEFAULT_SPORT = 'Badminton';
export const RACKET_SPORTS = SPORTS.map((s) => s.id);

export const getSport = (id) => SPORTS.find((s) => s.id === id) || SPORTS[0];
export const sportEmoji = (id) => getSport(id).emoji;
export const sportLabel = (id) => getSport(id).label;
