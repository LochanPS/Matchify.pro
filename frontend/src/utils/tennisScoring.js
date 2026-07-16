// ── Tennis scoring engine ────────────────────────────────────────────────────
// Pure, dependency-free. The source of truth is a log of point winners (1|2);
// the full match state is DERIVED by replaying that log. This makes Undo exact
// (pop the last point and re-derive) and immune to reversing set/game math.
//
// Hierarchy implemented: Points (0/15/30/40/Ad, deuce/advantage or No-Ad) →
// Games (first to N, win by 2, tiebreak at T–T) → Sets (best of K) with an
// optional match-tiebreak deciding set. Everything is organizer-configurable.

export function defaultTennisConfig(overrides = {}) {
  const sets = overrides.sets ?? 3;
  return {
    sport: 'Tennis',
    sets,                                   // best of N (odd)
    setsToWin: Math.ceil(sets / 2),
    gamesPerSet: overrides.gamesPerSet ?? 6,
    winByGames: overrides.winByGames ?? 2,
    tiebreakEnabled: overrides.tiebreakEnabled ?? true,
    tiebreakAt: overrides.tiebreakAt ?? 6,  // trigger at games tiebreakAt–tiebreakAt
    tiebreakTo: overrides.tiebreakTo ?? 7,  // race to this, win by 2
    noAd: overrides.noAd ?? false,          // sudden death at deuce
    matchTiebreak: overrides.matchTiebreak ?? false,   // deciding set is a match-tiebreak
    matchTiebreakTo: overrides.matchTiebreakTo ?? 10,
  };
}

// Is the set that is about to start the deciding set (so it may be a match-tiebreak)?
function isDecidingSet(cfg, setsWon1, setsWon2) {
  return cfg.matchTiebreak && setsWon1 === cfg.setsToWin - 1 && setsWon2 === cfg.setsToWin - 1;
}

function makeSet(cfg, setsWon1, setsWon2) {
  const matchTb = isDecidingSet(cfg, setsWon1, setsWon2);
  return { player1: 0, player2: 0, winner: null, tb1: null, tb2: null, isMatchTiebreak: matchTb };
}

export function newTennisState(cfg) {
  const first = makeSet(cfg, 0, 0);
  return {
    matchConfig: cfg,
    sets: [first],
    currentSet: 0,
    game: { p1: 0, p2: 0 },        // current game (or tiebreak) point counts
    inTiebreak: first.isMatchTiebreak,
    status: 'in_progress',
    matchWinner: null,
  };
}

function setsWonSoFar(state) {
  let w1 = 0, w2 = 0;
  for (const s of state.sets) { if (s.winner === 1) w1++; else if (s.winner === 2) w2++; }
  return [w1, w2];
}

// Advance to the next set, or finish the match if the winner has enough sets.
function finishSet(state, player) {
  const cfg = state.matchConfig;
  const [w1, w2] = setsWonSoFar(state);
  const meSets = player === 1 ? w1 : w2;
  if (meSets >= cfg.setsToWin) {
    state.status = 'completed';
    state.matchWinner = player;
    return;
  }
  const next = makeSet(cfg, w1, w2);
  state.sets.push(next);
  state.currentSet += 1;
  state.game = { p1: 0, p2: 0 };
  state.inTiebreak = next.isMatchTiebreak;
}

// Apply one point (winner = 1|2) to a derived state, mutating and returning it.
function applyPoint(state, player) {
  if (state.status === 'completed') return state;
  const cfg = state.matchConfig;
  const set = state.sets[state.currentSet];
  const meG = player === 1 ? 'p1' : 'p2';
  const opG = player === 1 ? 'p2' : 'p1';
  state.game[meG] += 1;
  const my = state.game[meG];
  const op = state.game[opG];

  if (state.inTiebreak) {
    const target = set.isMatchTiebreak ? cfg.matchTiebreakTo : cfg.tiebreakTo;
    if (my >= target && my - op >= 2) {
      set.tb1 = state.game.p1;
      set.tb2 = state.game.p2;
      if (set.isMatchTiebreak) {
        // Match-tiebreak stands in for the whole set; games are nominal 1–0.
        set.player1 = player === 1 ? 1 : 0;
        set.player2 = player === 2 ? 1 : 0;
      } else {
        // Winning a set tiebreak makes the set tiebreakAt+1 – tiebreakAt (e.g. 7–6).
        set.player1 = player === 1 ? cfg.tiebreakAt + 1 : cfg.tiebreakAt;
        set.player2 = player === 2 ? cfg.tiebreakAt + 1 : cfg.tiebreakAt;
      }
      set.winner = player;
      finishSet(state, player);
    }
    return state;
  }

  // Normal game
  const gameWon = cfg.noAd ? (my >= 4) : (my >= 4 && my - op >= 2);
  if (gameWon) {
    if (player === 1) set.player1 += 1; else set.player2 += 1;
    state.game = { p1: 0, p2: 0 };
    const g1 = set.player1, g2 = set.player2;
    // Tiebreak trigger (e.g. 6–6)
    if (cfg.tiebreakEnabled && g1 === cfg.tiebreakAt && g2 === cfg.tiebreakAt) {
      state.inTiebreak = true;
      return state;
    }
    const meGames = player === 1 ? g1 : g2;
    const opGames = player === 1 ? g2 : g1;
    if (meGames >= cfg.gamesPerSet && meGames - opGames >= cfg.winByGames) {
      set.winner = player;
      finishSet(state, player);
    }
  }
  return state;
}

// Replay a point log into a full derived state. Extra points after match
// completion are ignored (defensive).
export function deriveTennisState(cfg, points = []) {
  const state = newTennisState(cfg);
  for (const p of points) {
    if (state.status === 'completed') break;
    applyPoint(state, p);
  }
  return state;
}

// Display label for a side's current-game score given both raw counts.
export function pointLabel(myCount, opCount, inTiebreak) {
  if (inTiebreak) return String(myCount);
  if (myCount >= 3 && opCount >= 3) {
    if (myCount === opCount) return '40';      // deuce
    return myCount > opCount ? 'Ad' : '40';    // advantage / opponent has Ad
  }
  return ['0', '15', '30', '40'][Math.min(myCount, 3)];
}

// "6–4, 7–6(5)" style summary of completed + current sets.
export function tennisSetSummary(state) {
  return state.sets.map(s => {
    let cell = `${s.player1}-${s.player2}`;
    if (s.tb1 != null && s.tb2 != null && !s.isMatchTiebreak) {
      cell += `(${Math.min(s.tb1, s.tb2)})`;
    }
    return cell;
  }).join(', ');
}
