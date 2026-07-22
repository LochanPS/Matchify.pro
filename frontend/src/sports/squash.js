// Squash scoring — OWNS ONLY squash's rules. PAR scoring to 11, best of 5
// games, win by 2, no cap. Singles only.
import { createRallyEngine } from './rallyPrimitive.js';

export default createRallyEngine({
  id: 'Squash',
  unit: 'Game',
  pointsToWin: 11,
  bestOf: 5,
  cap: null,
});
