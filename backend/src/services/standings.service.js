// ── Round-robin standings ────────────────────────────────────────────────────
// Single source of truth for group standings, shared by every site that builds
// or refreshes a table (draw page, draw controller, match controller, match
// routes). Before this existed the same logic was copy-pasted six times, which
// is how basketball ended up with an all-zero points column.
//
// Two things vary by sport and NOTHING else:
//   • how points-for/against are read out of a stored score, and
//   • the competition points scheme + tie-break order.
//
// Racket sports keep exactly the behaviour they had before this file existed:
// 2 points for a win, 0 for a loss, ranked by points → points-for → difference.
//
// Basketball follows the official FIBA classification rules:
//   • 2 points for a win, 1 for a loss (a played-and-lost game still scores).
//   • Ties are broken by a head-to-head mini-league between the tied teams —
//     their results against each other come first, and only if that cannot
//     separate them do overall figures apply. This is the part casual
//     implementations skip; it is what makes a professional basketball table
//     correct.

import { isTeamSport } from '../config/sports.js';

const parseScore = (scoreJson) => {
  if (!scoreJson) return null;
  try {
    return typeof scoreJson === 'string' ? JSON.parse(scoreJson) : scoreJson;
  } catch {
    return null;
  }
};

// Points scored by each side in one match, whatever the score shape.
// Returns { t1, t2 } or null when the score carries no usable totals.
export function matchPointTotals(scoreJson) {
  const sd = parseScore(scoreJson);
  if (!sd) return null;

  // Running-total sports (basketball): sum the scoring events. This reads the
  // stored log only — it does not re-implement any rule, so it cannot drift
  // from the engine that produced it.
  if (sd.model === 'basketball' && Array.isArray(sd.events)) {
    let t1 = 0, t2 = 0;
    for (const e of sd.events) {
      if (e?.type !== 'score') continue;
      const pts = Number(e.points) || 0;
      if (e.team === 1) t1 += pts;
      else if (e.team === 2) t2 += pts;
    }
    return { t1, t2 };
  }

  // Set-based sports: sum every set. Field names vary across historical data,
  // so all known shapes are accepted (unchanged from the original logic).
  if (Array.isArray(sd.sets)) {
    let t1 = 0, t2 = 0;
    for (const s of sd.sets) {
      t1 += s.player1 ?? s.p1 ?? s.score1 ?? s.score?.player1 ?? 0;
      t2 += s.player2 ?? s.p2 ?? s.score2 ?? s.score?.player2 ?? 0;
    }
    return { t1, t2 };
  }

  return null;
}

// Competition points. FIBA awards a point for turning up and losing; racket
// sports here award nothing for a loss, as they always have.
export function pointsScheme(sport) {
  return isTeamSport(sport) ? { win: 2, loss: 1 } : { win: 2, loss: 0 };
}

const diffOf = (p) => (p.totalPoints || 0) - (p.totalPointsAgainst || 0);

// ── FIBA head-to-head tie-break ─────────────────────────────────────────────
// Teams level on points are separated by the results of the games they played
// against each other, in this order: mini-league points, then point difference
// in those games, then points scored in those games. Only when that still
// cannot separate them do overall difference and overall points apply.
function fibaSort(participants, groupMatches, scheme) {
  const byPoints = new Map();
  for (const p of participants) {
    const k = p.points || 0;
    if (!byPoints.has(k)) byPoints.set(k, []);
    byPoints.get(k).push(p);
  }

  const ordered = [];
  for (const key of [...byPoints.keys()].sort((a, b) => b - a)) {
    const cluster = byPoints.get(key);
    if (cluster.length === 1) { ordered.push(cluster[0]); continue; }

    // Mini-league across only the matches played between the tied teams.
    const ids = new Set(cluster.map(p => p.id));
    const h2h = new Map(cluster.map(p => [p.id, { pts: 0, for: 0, against: 0 }]));

    for (const m of groupMatches) {
      if (!ids.has(m.player1Id) || !ids.has(m.player2Id)) continue;
      const a = h2h.get(m.player1Id);
      const b = h2h.get(m.player2Id);
      if (!a || !b) continue;

      const totals = matchPointTotals(m.scoreJson);
      if (totals) {
        a.for += totals.t1; a.against += totals.t2;
        b.for += totals.t2; b.against += totals.t1;
      }
      if (m.winnerId === m.player1Id)      { a.pts += scheme.win;  b.pts += scheme.loss; }
      else if (m.winnerId === m.player2Id) { b.pts += scheme.win;  a.pts += scheme.loss; }
    }

    cluster.sort((x, y) => {
      const hx = h2h.get(x.id), hy = h2h.get(y.id);
      if (hy.pts !== hx.pts) return hy.pts - hx.pts;                       // 1. mini-league points
      const dx = hx.for - hx.against, dy = hy.for - hy.against;
      if (dy !== dx) return dy - dx;                                        // 2. mini-league difference
      if (hy.for !== hx.for) return hy.for - hx.for;                        // 3. mini-league points scored
      const od = diffOf(y) - diffOf(x);
      if (od !== 0) return od;                                              // 4. overall difference
      return (y.totalPoints || 0) - (x.totalPoints || 0);                   // 5. overall points scored
    });
    ordered.push(...cluster);
  }

  participants.length = 0;
  participants.push(...ordered);
  return participants;
}

// The long-standing racket-sport order, preserved byte-for-byte.
function racketSort(participants) {
  participants.sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
    const aTp = a.totalPoints || 0, bTp = b.totalPoints || 0;
    if (bTp !== aTp) return bTp - aTp;
    return diffOf(b) - diffOf(a);
  });
  return participants;
}

export function sortStandings(participants, sport, groupMatches = []) {
  return isTeamSport(sport)
    ? fibaSort(participants, groupMatches, pointsScheme(sport))
    : racketSort(participants);
}

// ── Main entry point ────────────────────────────────────────────────────────
// Resets and recomputes played/wins/losses/points/totalPoints/totalPointsAgainst
// on `participants` from `groupMatches`, then sorts them. Mutates in place
// because every existing call site expects that, and returns the same array.
export function recalcGroupStandings(participants, groupMatches, sport) {
  if (!Array.isArray(participants)) return participants;
  const scheme = pointsScheme(sport);

  participants.forEach(p => {
    p.played = 0; p.wins = 0; p.losses = 0;
    p.points = 0; p.totalPoints = 0; p.totalPointsAgainst = 0;
  });

  for (const m of groupMatches || []) {
    const p1 = participants.find(p => p.id === m.player1Id);
    const p2 = participants.find(p => p.id === m.player2Id);
    if (!p1 || !p2) continue;
    p1.played++; p2.played++;

    const totals = matchPointTotals(m.scoreJson);
    if (totals) {
      p1.totalPoints += totals.t1; p1.totalPointsAgainst += totals.t2;
      p2.totalPoints += totals.t2; p2.totalPointsAgainst += totals.t1;
    }

    if (m.winnerId === m.player1Id)      { p1.wins++; p1.points += scheme.win; p2.losses++; p2.points += scheme.loss; }
    else if (m.winnerId === m.player2Id) { p2.wins++; p2.points += scheme.win; p1.losses++; p1.points += scheme.loss; }
  }

  return sortStandings(participants, sport, groupMatches);
}
