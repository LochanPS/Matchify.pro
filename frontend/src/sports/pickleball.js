// Pickleball scoring — OWNS ONLY pickleball's rules. Rally scoring, 11 points,
// best of 3 games, win by 2, NO deuce cap (a game continues 12–10, 13–11, …).
import { createRallyEngine } from './rallyPrimitive.js';

export default createRallyEngine({
  id: 'Pickleball',
  unit: 'Game',
  pointsToWin: 11,
  bestOf: 3,
  cap: null,
});
