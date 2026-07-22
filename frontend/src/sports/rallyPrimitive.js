// ── Generic rally-scoring primitive (shared, sport-AGNOSTIC infrastructure) ──
// This holds NO sport's rules. It's a generic "race to N points, win by 2,
// best of K, optional hard cap" calculator. Each sport module calls
// createRallyEngine() with ITS OWN rules, producing a fully independent engine.
// Changing one sport's module never affects another — they only share this
// generic math, exactly like sharing a standard library function.
//
// Common engine interface (every scoring engine implements this shape):
//   id, model, unit, defaults
//   setWinner(p1, p2, cfg)      -> 1 | 2 | 0     (winner of a set/game, 0 = unresolved)
//   setsWon(sets, cfg)          -> { p1, p2 }    (completed sets/games won by each)
//   matchWinner(sets, cfg)      -> 1 | 2 | 0      (0 = match not decided yet)

export function createRallyEngine({ id, unit, pointsToWin, bestOf, cap = null }) {
  const setsToWin = Math.ceil(bestOf / 2);
  const hardCap = cap == null ? Infinity : cap;

  const cfgWith = (cfg = {}) => ({
    pointsToWin: cfg.pointsPerSet ?? cfg.pointsToWin ?? pointsToWin,
    cap: cfg.cap ?? hardCap,
    setsToWin: cfg.setsToWin ?? Math.ceil((cfg.maxSets ?? bestOf) / 2),
  });

  const setWinner = (p1, p2, cfg = {}) => {
    const { pointsToWin: pts, cap: c } = cfgWith(cfg);
    if ((p1 >= pts && p1 - p2 >= 2) || p1 >= c) return 1;
    if ((p2 >= pts && p2 - p1 >= 2) || p2 >= c) return 2;
    return 0;
  };

  const setsWon = (sets = [], cfg = {}) => {
    let p1 = 0, p2 = 0;
    for (const s of sets) {
      const w = s.winner || setWinner(s.player1 || 0, s.player2 || 0, cfg);
      if (w === 1) p1++; else if (w === 2) p2++;
    }
    return { p1, p2 };
  };

  const matchWinner = (sets = [], cfg = {}) => {
    const need = cfgWith(cfg).setsToWin;
    const { p1, p2 } = setsWon(sets, cfg);
    if (p1 >= need) return 1;
    if (p2 >= need) return 2;
    return 0;
  };

  return {
    id,
    model: 'points',
    unit,                                   // 'Set' (badminton) | 'Game' (others)
    defaults: { pointsToWin, bestOf, setsToWin, cap: hardCap },
    setWinner,
    setsWon,
    matchWinner,
  };
}
