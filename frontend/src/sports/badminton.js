// Badminton scoring — OWNS ONLY badminton's rules. Changing this file cannot
// affect any other sport. Rally scoring, 21 points, best of 3 games, win by 2,
// with badminton's 29–29 deuce cap at 30.
import { createRallyEngine } from './rallyPrimitive.js';

export default createRallyEngine({
  id: 'Badminton',
  unit: 'Set',
  pointsToWin: 21,
  bestOf: 3,
  cap: 30,
});
