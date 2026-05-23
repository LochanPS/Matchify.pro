/**
 * drawPage.controller.js
 *
 * Single combined endpoint that replaces the 3-round-trip waterfall on the
 * draw page. Returns tournament + categories + draw (with live match data
 * injected) + matches + stats in ONE request.
 *
 * GET /api/tournaments/:tournamentId/draw-page/:categoryId
 */

import prisma from '../lib/prisma.js';

export const getDrawPage = async (req, res) => {
  try {
    const { tournamentId, categoryId } = req.params;

    // ─── Phase 1: All independent DB queries in parallel ──────────────────────
    const [tournament, categories, draw, matches, registrations] = await Promise.all([
      prisma.tournament.findUnique({
        where: { id: tournamentId }
      }),
      prisma.category.findMany({
        where: { tournamentId },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.draw.findUnique({
        where: {
          tournamentId_categoryId: { tournamentId, categoryId }
        },
        include: {
          tournament: { select: { name: true, startDate: true } },
          category:   { select: { name: true, format: true   } }
        }
      }),
      prisma.match.findMany({
        where: { tournamentId, categoryId },
        orderBy: [{ round: 'desc' }, { matchNumber: 'asc' }]
      }),
      prisma.registration.findMany({
        where:  { tournamentId, categoryId },
        select: {
          id: true,
          status: true,
          userId: true,
          guestName: true,
          guestEmail: true,
          guestPartnerName: true,
          partner: { select: { id: true, name: true } },
          user:    { select: { id: true, name: true } }
        }
      })
    ]);

    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Stats computed from already-fetched data — zero extra DB calls
    const stats = {
      totalPlayers:     registrations.length,
      confirmedPlayers: registrations.filter(r => r.status === 'confirmed').length,
      totalMatches:     matches.length,
      completedMatches: matches.filter(m => m.status === 'COMPLETED').length
    };

    // No draw yet — return early with just tournament + categories + stats
    if (!draw) {
      res.set({ 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60' });
      return res.json({
        success: true,
        data: { tournament, categories, draw: null, matches: [], stats }
      });
    }

    // ─── Phase 2: Player name lookups in parallel ──────────────────────────────
    const playerIds      = new Set();
    const guestPlayerIds = new Set();

    matches.forEach(m => {
      [m.player1Id, m.player2Id, m.winnerId].forEach(id => {
        if (!id) return;
        if (id.startsWith('guest-')) guestPlayerIds.add(id);
        else playerIds.add(id);
      });
    });

    const guestRegistrationIds = Array.from(guestPlayerIds).map(id => id.replace('guest-', ''));

    // Phase 2: Only player name lookup needs a DB call — partner data already in registrations
    const [players, guestRegistrations] = await Promise.all([
      playerIds.size > 0
        ? prisma.user.findMany({
            where:  { id: { in: Array.from(playerIds) } },
            select: { id: true, name: true }
          })
        : Promise.resolve([]),
      guestRegistrationIds.length > 0
        ? prisma.registration.findMany({
            where:  { id: { in: guestRegistrationIds } },
            select: {
              id: true, guestName: true, userId: true,
              user: { select: { id: true, name: true } }
            }
          })
        : Promise.resolve([])
    ]);

    // Build lookup maps
    const playerMap = {};
    players.forEach(p => { playerMap[p.id] = p; });
    guestRegistrations.forEach(reg => {
      const guestId = `guest-${reg.id}`;
      playerMap[guestId] = {
        id:   guestId,
        name: reg.userId && reg.user ? reg.user.name : (reg.guestName || 'Unknown')
      };
    });

    // Partner map built from Phase 1 registrations (no extra DB call needed)
    // Key by userId for real users OR by guest-{regId} for guest registrations
    const partnerMap = {};
    registrations.forEach(reg => {
      const partnerName = reg.partner?.name || reg.guestPartnerName || null;
      if (!partnerName) return;
      const pid = reg.userId || `guest-${reg.id}`;
      partnerMap[pid] = partnerName;
    });

    // ─── Phase 3: Parse bracket JSON ──────────────────────────────────────────
    let bracketData;
    try {
      bracketData = JSON.parse(draw.bracketJson);
      if (!bracketData || typeof bracketData !== 'object') {
        bracketData = { format: draw.format || 'KNOCKOUT', rounds: [] };
      }
      if (!bracketData.format) bracketData.format = draw.format || 'KNOCKOUT';
    } catch (e) {
      bracketData = { format: draw.format || 'KNOCKOUT', rounds: [] };
    }

    // ─── Helper: build dbMatch payload ────────────────────────────────────────
    const makeDbMatch = (dbm, useScore = false) => ({
      id:          dbm.id,
      matchNumber: dbm.matchNumber,
      [useScore ? 'score' : 'scoreJson']: dbm.scoreJson,
      winnerId:    dbm.winnerId,
      courtNumber: dbm.courtNumber,
      startTime:   dbm.startTime,
      startedAt:   dbm.startedAt,
      endTime:     dbm.endTime,
      completedAt: dbm.completedAt,
      duration:    dbm.duration,
      status:      dbm.status
    });

    // ─── Helper: inject a single match's live data ─────────────────────────────
    const injectMatch = (match, dbm, useScore = false) => {
      if (dbm.player1Id && playerMap[dbm.player1Id]) {
        match.player1 = { id: dbm.player1Id, name: playerMap[dbm.player1Id].name, partnerName: partnerMap[dbm.player1Id] || null };
      }
      if (dbm.player2Id && playerMap[dbm.player2Id]) {
        match.player2 = { id: dbm.player2Id, name: playerMap[dbm.player2Id].name, partnerName: partnerMap[dbm.player2Id] || null };
      }
      if (dbm.winnerId) {
        match.winner = dbm.winnerId === dbm.player1Id ? 1 : 2;
      }
      match.status    = dbm.status;
      match.completed = dbm.status === 'COMPLETED';
      match.dbMatch   = makeDbMatch(dbm, useScore);
    };

    // ─── Helper: recalculate group standings ───────────────────────────────────
    const recalcStandings = (group) => {
      if (!group.participants || !Array.isArray(group.participants)) return;
      group.participants.forEach(p => { p.played = 0; p.wins = 0; p.losses = 0; p.points = 0; p.totalPoints = 0; p.totalPointsAgainst = 0; });

      // Strategy 1: stage + matchNumber
      let groupMatches = matches.filter(m =>
        m.stage === 'GROUP' && m.status === 'COMPLETED' &&
        group.matches?.some(gm => gm.matchNumber === m.matchNumber)
      );
      // Strategy 2: matchNumber only (legacy data)
      if (groupMatches.length === 0) {
        groupMatches = matches.filter(m =>
          m.status === 'COMPLETED' &&
          group.matches?.some(gm => gm.matchNumber === m.matchNumber)
        );
      }
      // Strategy 3: player IDs
      if (groupMatches.length === 0 && group.participants) {
        const pIds = group.participants.map(p => p.id).filter(Boolean);
        groupMatches = matches.filter(m =>
          m.status === 'COMPLETED' &&
          pIds.includes(m.player1Id) &&
          pIds.includes(m.player2Id)
        );
      }

      groupMatches.forEach(m => {
        const p1 = group.participants.find(p => p.id === m.player1Id);
        const p2 = group.participants.find(p => p.id === m.player2Id);
        if (!p1 || !p2) return;
        p1.played++; p2.played++;

        if (m.scoreJson) {
          try {
            const sd = typeof m.scoreJson === 'string' ? JSON.parse(m.scoreJson) : m.scoreJson;
            if (sd?.sets && Array.isArray(sd.sets)) {
              let t1 = 0, t2 = 0;
              sd.sets.forEach(s => {
                t1 += s.player1 ?? s.p1 ?? s.score1 ?? 0;
                t2 += s.player2 ?? s.p2 ?? s.score2 ?? 0;
              });
              p1.totalPoints = (p1.totalPoints || 0) + t1;
              p2.totalPoints = (p2.totalPoints || 0) + t2;
              p1.totalPointsAgainst = (p1.totalPointsAgainst || 0) + t2;
              p2.totalPointsAgainst = (p2.totalPointsAgainst || 0) + t1;
            }
          } catch (_) {}
        }

        if (m.winnerId === m.player1Id)      { p1.wins++; p1.points += 2; p2.losses++; }
        else if (m.winnerId === m.player2Id) { p2.wins++; p2.points += 2; p1.losses++; }
      });

      // Sort: match points DESC → points diff DESC → total points FOR DESC
      group.participants.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const aDiff = (a.totalPoints || 0) - (a.totalPointsAgainst || 0);
        const bDiff = (b.totalPoints || 0) - (b.totalPointsAgainst || 0);
        if (bDiff !== aDiff) return bDiff - aDiff;
        return (b.totalPoints || 0) - (a.totalPoints || 0);
      });
    };

    // ─── Inject live data into bracket ────────────────────────────────────────
    if (bracketData.format === 'KNOCKOUT') {
      if (!Array.isArray(bracketData.rounds)) bracketData.rounds = [];

      bracketData.rounds.forEach((round, ri) => {
        if (!round.matches || !Array.isArray(round.matches)) return;
        round.matches.forEach((match, mi) => {
          const dbm = matches.find(m =>
            m.round       === (bracketData.rounds.length - ri) &&
            m.matchNumber === (mi + 1)
          );
          if (dbm) injectMatch(match, dbm, true);
        });
      });

      // Cascade winners into TBD slots for later rounds.
      // Needed when parentMatchId was not set during draw creation — the DB final
      // match still has null player1Id/player2Id even after semi-finals complete.
      // rounds[0] = earliest round (SF/QF), rounds[last] = Final.
      for (let ri = 1; ri < bracketData.rounds.length; ri++) {
        const round = bracketData.rounds[ri];
        if (!Array.isArray(round.matches)) continue;
        const feederRound = bracketData.rounds[ri - 1];
        if (!Array.isArray(feederRound?.matches)) continue;

        round.matches.forEach((match, mi) => {
          // player1 slot fed by feederRound match at index mi*2
          if (!match.player1) {
            const feeder = feederRound.matches[mi * 2];
            const wId = feeder?.dbMatch?.winnerId;
            if (wId && playerMap[wId]) {
              match.player1 = { id: wId, name: playerMap[wId].name, partnerName: partnerMap[wId] || null };
            }
          }
          // player2 slot fed by feederRound match at index mi*2+1
          if (!match.player2) {
            const feeder = feederRound.matches[mi * 2 + 1];
            const wId = feeder?.dbMatch?.winnerId;
            if (wId && playerMap[wId]) {
              match.player2 = { id: wId, name: playerMap[wId].name, partnerName: partnerMap[wId] || null };
            }
          }
        });
      }

    } else if (bracketData.format === 'ROUND_ROBIN' && bracketData.groups) {
      bracketData.groups.forEach(group => {
        // Update participant names
        group.participants?.forEach(p => {
          if (p.id && playerMap[p.id]) {
            p.name = playerMap[p.id].name;
            p.partnerName = partnerMap[p.id] || null;
          }
        });
        // Update match data
        group.matches?.forEach(match => {
          const dbm = matches.find(m => m.stage === 'GROUP' && m.matchNumber === match.matchNumber);
          if (dbm) injectMatch(match, dbm, false);
        });
        // Recalculate standings
        recalcStandings(group);
      });

    } else if (bracketData.format === 'ROUND_ROBIN_KNOCKOUT') {
      // Round robin groups
      bracketData.groups?.forEach(group => {
        group.participants?.forEach(p => {
          if (p.id && playerMap[p.id]) {
            p.name = playerMap[p.id].name;
            p.partnerName = partnerMap[p.id] || null;
          }
        });
        group.matches?.forEach(match => {
          const dbm = matches.find(m => m.stage === 'GROUP' && m.matchNumber === match.matchNumber);
          if (dbm) injectMatch(match, dbm, false);
        });
        recalcStandings(group);
      });

      // Knockout stage — use index-based lookup because KO matchNumbers are
      // global (offset after group matches), NOT per-round 1-based.
      bracketData.knockout?.rounds?.forEach((round, ri) => {
        const dbRound = bracketData.knockout.rounds.length - ri;
        const roundDbMatches = matches
          .filter(m => m.stage === 'KNOCKOUT' && m.round === dbRound)
          .sort((a, b) => a.matchNumber - b.matchNumber);

        round.matches?.forEach((match, mi) => {
          const dbm = roundDbMatches[mi];
          if (dbm) injectMatch(match, dbm, true);
        });
      });

      // Cascade winners into TBD slots for later KO rounds.
      // rounds[0] = first KO round (QF/SF), rounds[last] = Final.
      if (bracketData.knockout?.rounds?.length > 1) {
        for (let ri = 1; ri < bracketData.knockout.rounds.length; ri++) {
          const round = bracketData.knockout.rounds[ri];
          const feederRound = bracketData.knockout.rounds[ri - 1];
          if (!Array.isArray(round?.matches) || !Array.isArray(feederRound?.matches)) continue;

          round.matches.forEach((match, mi) => {
            if (!match.player1) {
              const feeder = feederRound.matches[mi * 2];
              const wId = feeder?.dbMatch?.winnerId;
              if (wId && playerMap[wId]) {
                match.player1 = { id: wId, name: playerMap[wId].name, partnerName: partnerMap[wId] || null };
              }
            }
            if (!match.player2) {
              const feeder = feederRound.matches[mi * 2 + 1];
              const wId = feeder?.dbMatch?.winnerId;
              if (wId && playerMap[wId]) {
                match.player2 = { id: wId, name: playerMap[wId].name, partnerName: partnerMap[wId] || null };
              }
            }
          });
        }
      }
    }

    // ─── Send response ─────────────────────────────────────────────────────────
    // Cache at Vercel edge CDN for 15 seconds, stale-while-revalidate for 60s.
    // Under load (50+ users), only 1 function call per 15s hits the DB —
    // the rest are served from CDN in <100ms. 15s staleness is acceptable
    // for live tournament scoring (scores update over minutes, not seconds).
    res.set({
      'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
    });

    res.json({
      success: true,
      data: {
        tournament,
        categories,
        draw: {
          id:         draw.id,
          tournament: draw.tournament,
          category:   draw.category,
          format:     draw.format,
          bracketJson: bracketData,   // parsed + live-updated object (not raw string)
          createdAt:  draw.createdAt
        },
        matches,
        stats
      }
    });

  } catch (error) {
    console.error('❌ getDrawPage error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load draw page data',
      details: error.message  // expose in all envs for debugging
    });
  }
};
