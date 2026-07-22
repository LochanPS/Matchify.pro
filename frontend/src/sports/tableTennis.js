// Table Tennis scoring — OWNS ONLY table tennis's rules. Rally scoring, 11
// points, best of 5 games, win by 2, no cap.
import { createRallyEngine } from './rallyPrimitive.js';

export default createRallyEngine({
  id: 'Table Tennis',
  unit: 'Game',
  pointsToWin: 11,
  bestOf: 5,
  cap: null,
});
