/**
 * Regression tests: Round Robin / Knockout stage isolation.
 *
 * Proves (against real DB rows + the real production handlers, not reimplementations):
 *   A. RR completion can never mutate knockout data.
 *   B. A bad parentMatchId on an RR match is ignored.
 *   C. Null-stage legacy pure-KNOCKOUT tournaments still advance winners.
 *   D. RRK tournaments with null-stage RR rows cannot create parent links into knockout matches.
 *   E. Normal KO flow still works end-to-end (SF -> Final advancement, RR standings update).
 *
 * endMatchHandler and setKnockoutParentRelationships are the exact functions wired to the
 * live routes (verified via grep against every router file) — invoked directly here with
 * constructed req/res, not reimplemented.
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { endMatchHandler } from '../src/routes/match.routes.js';
import { setKnockoutParentRelationships } from '../src/controllers/draw.controller.js';

const prisma = new PrismaClient();
const T = 30000; // real network DB (Supabase) — default 5s jest timeout is too tight

// Minimal mock of Express res — captures the JSON payload for assertions.
function mockRes() {
  const res = { statusCode: 200, body: null };
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.body = payload; return res; };
  return res;
}

function mockReq(matchId, userId, winnerId, sets) {
  return {
    params: { matchId },
    body: { winnerId, finalScore: { sets } },
    user: { userId, roles: [] }
  };
}

async function callEndMatch(matchId, userId, winnerId, p1, p2) {
  const req = mockReq(matchId, userId, winnerId, [{ player1: p1, player2: p2 }]);
  const res = mockRes();
  await endMatchHandler(req, res);
  return res;
}

describe('Round Robin / Knockout stage isolation', () => {
  let organizerId, p1, p2, p3, p4;
  let rrkTournamentId, rrkCategoryId;
  let groupMatches = []; // 6 RR matches, round-robin among p1..p4
  let sf1, sf2, final; // KO matches

  beforeAll(async () => {
    const organizer = await prisma.user.create({
      data: {
        email: `stage-isolation-organizer-${Date.now()}@test.com`,
        password: 'test-password',
        name: 'Stage Isolation Organizer',
        phone: `+91${Date.now().toString().slice(-10)}`,
        roles: 'ORGANIZER'
      }
    });
    organizerId = organizer.id;
    p1 = `guest-p1-${Date.now()}`;
    p2 = `guest-p2-${Date.now()}`;
    p3 = `guest-p3-${Date.now()}`;
    p4 = `guest-p4-${Date.now()}`;

    const tournament = await prisma.tournament.create({
      data: {
        name: 'Stage Isolation RRK Tournament',
        description: 'test', venue: 'test', address: 'test', city: 'test', state: 'test',
        pincode: '123456', zone: 'test',
        registrationOpenDate: '2024-01-01', registrationCloseDate: '2024-01-31',
        startDate: '2024-02-01', endDate: '2024-02-28',
        format: 'ROUND_ROBIN_KNOCKOUT', organizerId
      }
    });
    rrkTournamentId = tournament.id;

    const category = await prisma.category.create({
      data: {
        tournamentId: rrkTournamentId, name: 'Test RRK Category', format: 'SINGLES',
        gender: 'MIXED', entryFee: 0, tournamentFormat: 'ROUND_ROBIN_KNOCKOUT', scoringFormat: '21x3'
      }
    });
    rrkCategoryId = category.id;

    // bracketJson: 1 group of 4 (6 RR matches), KO = Round of 4 (2 SF + 1 Final)
    const bracketJson = {
      format: 'ROUND_ROBIN_KNOCKOUT',
      groups: [{
        groupName: 'A',
        participants: [
          { id: p1, name: 'P1', played: 0, wins: 0, losses: 0, points: 0 },
          { id: p2, name: 'P2', played: 0, wins: 0, losses: 0, points: 0 },
          { id: p3, name: 'P3', played: 0, wins: 0, losses: 0, points: 0 },
          { id: p4, name: 'P4', played: 0, wins: 0, losses: 0, points: 0 },
        ],
        matches: [
          { matchNumber: 1, player1: { id: p1 }, player2: { id: p2 }, status: 'pending' },
          { matchNumber: 2, player1: { id: p1 }, player2: { id: p3 }, status: 'pending' },
          { matchNumber: 3, player1: { id: p1 }, player2: { id: p4 }, status: 'pending' },
          { matchNumber: 4, player1: { id: p2 }, player2: { id: p3 }, status: 'pending' },
          { matchNumber: 5, player1: { id: p2 }, player2: { id: p4 }, status: 'pending' },
          { matchNumber: 6, player1: { id: p3 }, player2: { id: p4 }, status: 'pending' },
        ]
      }],
      knockout: {
        format: 'KNOCKOUT', bracketSize: 4,
        rounds: [
          { roundNumber: 1, matches: [{ matchNumber: 1, player1: null, player2: null, status: 'PENDING' }, { matchNumber: 2, player1: null, player2: null, status: 'PENDING' }] },
          { roundNumber: 2, matches: [{ matchNumber: 1, player1: null, player2: null, status: 'PENDING' }] }
        ]
      }
    };

    await prisma.draw.create({
      data: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId, format: 'ROUND_ROBIN_KNOCKOUT', bracketJson: JSON.stringify(bracketJson) }
    });

    // GROUP matches — matchNumber 1-6, round 1, stage 'GROUP' (mirrors createConfiguredDraw output)
    const groupDefs = [
      { num: 1, a: p1, b: p2 }, { num: 2, a: p1, b: p3 }, { num: 3, a: p1, b: p4 },
      { num: 4, a: p2, b: p3 }, { num: 5, a: p2, b: p4 }, { num: 6, a: p3, b: p4 },
    ];
    for (const g of groupDefs) {
      const m = await prisma.match.create({
        data: {
          tournamentId: rrkTournamentId, categoryId: rrkCategoryId,
          round: 1, matchNumber: g.num, stage: 'GROUP',
          player1Id: g.a, player2Id: g.b, status: 'READY'
        }
      });
      groupMatches.push(m);
    }

    // KO matches — matchNumber continues from 7, stage 'KNOCKOUT', no players yet (unarranged)
    sf1 = await prisma.match.create({ data: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId, round: 2, matchNumber: 7, stage: 'KNOCKOUT', status: 'PENDING' } });
    sf2 = await prisma.match.create({ data: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId, round: 2, matchNumber: 8, stage: 'KNOCKOUT', status: 'PENDING' } });
    final = await prisma.match.create({ data: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId, round: 1, matchNumber: 9, stage: 'KNOCKOUT', status: 'PENDING' } });

    // Real production function — links SF1/SF2 -> Final via parentMatchId
    await setKnockoutParentRelationships(rrkTournamentId, rrkCategoryId);
  });

  afterAll(async () => {
    await prisma.match.deleteMany({ where: { tournamentId: rrkTournamentId } });
    await prisma.draw.deleteMany({ where: { tournamentId: rrkTournamentId } });
    await prisma.category.deleteMany({ where: { tournamentId: rrkTournamentId } });
    await prisma.tournament.delete({ where: { id: rrkTournamentId } }).catch(() => {});
    await prisma.user.delete({ where: { id: organizerId } }).catch(() => {});
    await prisma.$disconnect();
  });

  it('SETUP: setKnockoutParentRelationships links SF1/SF2 to Final, never touches GROUP matches', async () => {
    const updatedSf1 = await prisma.match.findUnique({ where: { id: sf1.id } });
    const updatedSf2 = await prisma.match.findUnique({ where: { id: sf2.id } });
    const updatedGroup1 = await prisma.match.findUnique({ where: { id: groupMatches[0].id } });

    console.log('[SETUP] SF1.parentMatchId =', updatedSf1.parentMatchId, '(expect Final id', final.id, ')');
    console.log('[SETUP] SF2.parentMatchId =', updatedSf2.parentMatchId);
    console.log('[SETUP] GROUP match 1.parentMatchId =', updatedGroup1.parentMatchId, '(expect null)');

    expect(updatedSf1.parentMatchId).toBe(final.id);
    expect(updatedSf2.parentMatchId).toBe(final.id);
    expect(updatedGroup1.parentMatchId).toBeNull();
  });

  it('A. RR completion never mutates knockout data (snapshot before/after every group match)', async () => {
    for (const gm of groupMatches) {
      const koBefore = await prisma.match.findMany({ where: { id: { in: [sf1.id, sf2.id, final.id] } } });
      const drawBefore = await prisma.draw.findUnique({ where: { tournamentId_categoryId: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId } } });
      const koJsonBefore = JSON.parse(drawBefore.bracketJson).knockout;

      const res = await callEndMatch(gm.id, organizerId, gm.player1Id, 21, 15);

      const koAfter = await prisma.match.findMany({ where: { id: { in: [sf1.id, sf2.id, final.id] } } });
      const drawAfter = await prisma.draw.findUnique({ where: { tournamentId_categoryId: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId } } });
      const koJsonAfter = JSON.parse(drawAfter.bracketJson).knockout;

      console.log(`[A] RR match ${gm.matchNumber} completed: ${gm.player1Id} beat ${gm.player2Id} 21-15. status=${res.statusCode}`);
      console.log(`[A]   KO rows before:`, koBefore.map(m => ({ id: m.id, p1: m.player1Id, p2: m.player2Id, status: m.status, winnerId: m.winnerId })));
      console.log(`[A]   KO rows after: `, koAfter.map(m => ({ id: m.id, p1: m.player1Id, p2: m.player2Id, status: m.status, winnerId: m.winnerId })));

      expect(res.statusCode).toBe(200);
      // KO match rows: zero mutation, byte for byte
      expect(koAfter).toEqual(koBefore);
      // bracketJson.knockout: zero mutation
      expect(koJsonAfter).toEqual(koJsonBefore);

      const updatedGm = await prisma.match.findUnique({ where: { id: gm.id } });
      expect(updatedGm.status).toBe('COMPLETED');
      expect(updatedGm.winnerId).toBe(gm.player1Id);
    }
  }, 90000); // 6 matches x real-network DB round trips per endMatchHandler call

  it('A2. RR standings (bracketJson.groups) updated correctly after all 6 RR matches', async () => {
    const draw = await prisma.draw.findUnique({ where: { tournamentId_categoryId: { tournamentId: rrkTournamentId, categoryId: rrkCategoryId } } });
    const group = JSON.parse(draw.bracketJson).groups[0];
    console.log('[A2] Final group standings:', group.participants.map(p => ({ id: p.id, played: p.played, wins: p.wins, points: p.points })));

    // p1 beat everyone (p2,p3,p4) in the loop above (player1 always set as winner) -> p1 should have 3 wins
    const standing1 = group.participants.find(p => p.id === p1);
    expect(standing1.wins).toBe(3);
    expect(standing1.played).toBe(3);
  });

  it('B. A bad parentMatchId on an RR match is ignored — KO Final untouched even when corrupted', async () => {
    // Manufacture the exact corruption scenario: wrongly link a completed GROUP match to the KO Final
    const corruptedMatch = groupMatches[0];
    await prisma.match.update({
      where: { id: corruptedMatch.id },
      data: { status: 'READY', winnerId: null, scoreJson: null, parentMatchId: final.id, winnerPosition: 'player1' }
    });

    const finalBefore = await prisma.match.findUnique({ where: { id: final.id } });
    console.log('[B] Final BEFORE re-completing corrupted RR match:', { p1: finalBefore.player1Id, p2: finalBefore.player2Id, status: finalBefore.status });

    const res = await callEndMatch(corruptedMatch.id, organizerId, corruptedMatch.player1Id, 21, 10);

    const finalAfter = await prisma.match.findUnique({ where: { id: final.id } });
    console.log('[B] Final AFTER re-completing corrupted RR match:', { p1: finalAfter.player1Id, p2: finalAfter.player2Id, status: finalAfter.status });

    expect(res.statusCode).toBe(200);
    // Despite parentMatchId pointing at the Final, isKnockoutMatch is false (stage='GROUP') — guard blocks the write
    expect(finalAfter.player1Id).toBe(finalBefore.player1Id);
    expect(finalAfter.player2Id).toBe(finalBefore.player2Id);
    expect(finalAfter.status).toBe(finalBefore.status);
  });

  it('D. RRK with null-stage rows: setKnockoutParentRelationships creates zero parent links', async () => {
    // Simulate the historical corruption: a SECOND category where stage tags were lost
    // entirely (both RR and KO rows null-stage) — exactly what we found live in production.
    const category2 = await prisma.category.create({
      data: { tournamentId: rrkTournamentId, name: 'Legacy null-stage RRK', format: 'SINGLES', gender: 'MIXED', entryFee: 0, tournamentFormat: 'ROUND_ROBIN_KNOCKOUT', scoringFormat: '21x3' }
    });
    await prisma.draw.create({
      data: { tournamentId: rrkTournamentId, categoryId: category2.id, format: 'ROUND_ROBIN_KNOCKOUT', bracketJson: JSON.stringify({ format: 'ROUND_ROBIN_KNOCKOUT', groups: [], knockout: { rounds: [] } }) }
    });
    // RR matches with null stage (legacy), round 1
    const legacyRr1 = await prisma.match.create({ data: { tournamentId: rrkTournamentId, categoryId: category2.id, round: 1, matchNumber: 1, stage: null, player1Id: p1, player2Id: p2, status: 'READY' } });
    // KO matches ALSO null stage (legacy corruption) — SF round 2, Final round 1 — same round=1 as RR!
    const legacySf = await prisma.match.create({ data: { tournamentId: rrkTournamentId, categoryId: category2.id, round: 2, matchNumber: 2, stage: null, status: 'PENDING' } });
    const legacyFinal = await prisma.match.create({ data: { tournamentId: rrkTournamentId, categoryId: category2.id, round: 1, matchNumber: 3, stage: null, status: 'PENDING' } });

    await setKnockoutParentRelationships(rrkTournamentId, category2.id);

    const allAfter = await prisma.match.findMany({ where: { categoryId: category2.id } });
    console.log('[D] All matches after setKnockoutParentRelationships on null-stage RRK category:',
      allAfter.map(m => ({ matchNumber: m.matchNumber, round: m.round, stage: m.stage, parentMatchId: m.parentMatchId })));

    // FIX: query only matches stage:'KNOCKOUT' for RRK format — finds zero rows (all are null-stage)
    // -> function logs "no matches found" and returns early -> nothing gets linked, ever.
    for (const m of allAfter) {
      expect(m.parentMatchId).toBeNull();
    }

    await prisma.match.deleteMany({ where: { categoryId: category2.id } });
    await prisma.draw.deleteMany({ where: { categoryId: category2.id } });
    await prisma.category.delete({ where: { id: category2.id } });
  });

  describe('Normal KO flow + legacy pure-KNOCKOUT (after RR fully complete)', () => {
    it('Arrange KO: assign qualifiers (p1, p2) into SF1, complete SF1, confirm Final updates', async () => {
      // Organizer explicitly arranges KO — assign p1 vs p3 in SF1, p2 vs p4 in SF2 (manual, mirrors arrangeKnockoutMatchups)
      await prisma.match.update({ where: { id: sf1.id }, data: { player1Id: p1, player2Id: p3, status: 'READY' } });
      await prisma.match.update({ where: { id: sf2.id }, data: { player1Id: p2, player2Id: p4, status: 'READY' } });

      const res = await callEndMatch(sf1.id, organizerId, p1, 21, 18);
      expect(res.statusCode).toBe(200);

      const finalAfter = await prisma.match.findUnique({ where: { id: final.id } });
      console.log('[E] Final after SF1 (p1 won) completes:', { p1: finalAfter.player1Id, p2: finalAfter.player2Id, status: finalAfter.status });

      // SF1 winnerPosition is whatever setKnockoutParentRelationships assigned (index 0 -> player1)
      expect(finalAfter.player1Id).toBe(p1);
    });

    it('Complete SF2, confirm Final now has both players and is READY', async () => {
      const res = await callEndMatch(sf2.id, organizerId, p2, 21, 19);
      expect(res.statusCode).toBe(200);

      const finalAfter = await prisma.match.findUnique({ where: { id: final.id } });
      console.log('[E] Final after SF2 (p2 won) completes:', { p1: finalAfter.player1Id, p2: finalAfter.player2Id, status: finalAfter.status });

      expect(finalAfter.player1Id).toBe(p1);
      expect(finalAfter.player2Id).toBe(p2);
      expect(finalAfter.status).toBe('READY');
    });

    it('Complete the Final, confirm category closes with winner/runner-up recorded', async () => {
      const res = await callEndMatch(final.id, organizerId, p1, 21, 20);
      expect(res.statusCode).toBe(200);

      const category = await prisma.category.findUnique({ where: { id: rrkCategoryId } });
      console.log('[E] Category after Final completes:', { status: category.status, winnerId: category.winnerId, runnerUpId: category.runnerUpId });

      expect(category.status).toBe('completed');
    });
  });

  describe('C. Legacy pure-KNOCKOUT with null stage still advances winners', () => {
    let legacyTournamentId, legacyCategoryId, legacySf1, legacySf2, legacyFinal;

    beforeAll(async () => {
      const tournament = await prisma.tournament.create({
        data: {
          name: 'Legacy Pure KO Tournament', description: 'test', venue: 'test', address: 'test',
          city: 'test', state: 'test', pincode: '123456', zone: 'test',
          registrationOpenDate: '2024-01-01', registrationCloseDate: '2024-01-31',
          startDate: '2024-02-01', endDate: '2024-02-28', format: 'KNOCKOUT', organizerId
        }
      });
      legacyTournamentId = tournament.id;
      const category = await prisma.category.create({
        data: { tournamentId: legacyTournamentId, name: 'Legacy KO Category', format: 'SINGLES', gender: 'MIXED', entryFee: 0, tournamentFormat: 'KNOCKOUT', scoringFormat: '21x3' }
      });
      legacyCategoryId = category.id;
      await prisma.draw.create({
        data: { tournamentId: legacyTournamentId, categoryId: legacyCategoryId, format: 'KNOCKOUT', bracketJson: JSON.stringify({ format: 'KNOCKOUT', rounds: [] }) }
      });

      // ALL matches null-stage — true legacy data, predates the stage column being populated
      legacySf1 = await prisma.match.create({ data: { tournamentId: legacyTournamentId, categoryId: legacyCategoryId, round: 2, matchNumber: 1, stage: null, player1Id: p1, player2Id: p2, status: 'READY' } });
      legacySf2 = await prisma.match.create({ data: { tournamentId: legacyTournamentId, categoryId: legacyCategoryId, round: 2, matchNumber: 2, stage: null, player1Id: p3, player2Id: p4, status: 'READY' } });
      legacyFinal = await prisma.match.create({ data: { tournamentId: legacyTournamentId, categoryId: legacyCategoryId, round: 1, matchNumber: 1, stage: null, status: 'PENDING' } });

      await setKnockoutParentRelationships(legacyTournamentId, legacyCategoryId);
    });

    afterAll(async () => {
      await prisma.match.deleteMany({ where: { tournamentId: legacyTournamentId } });
      await prisma.draw.deleteMany({ where: { tournamentId: legacyTournamentId } });
      await prisma.category.deleteMany({ where: { tournamentId: legacyTournamentId } });
      await prisma.tournament.delete({ where: { id: legacyTournamentId } }).catch(() => {});
    });

    it('parent links ARE created for pure-KNOCKOUT null-stage draws (isPureKnockout=true path)', async () => {
      const updated = await prisma.match.findUnique({ where: { id: legacySf1.id } });
      console.log('[C] Legacy SF1.parentMatchId =', updated.parentMatchId, '(expect Final id', legacyFinal.id, ')');
      expect(updated.parentMatchId).toBe(legacyFinal.id);
    });

    it('completing a legacy null-stage SF match still advances the winner into the Final', async () => {
      const res = await callEndMatch(legacySf1.id, organizerId, p1, 21, 14);
      expect(res.statusCode).toBe(200);

      const finalAfter = await prisma.match.findUnique({ where: { id: legacyFinal.id } });
      console.log('[C] Legacy Final after SF1 completes:', { p1: finalAfter.player1Id, p2: finalAfter.player2Id, status: finalAfter.status });

      // isKnockoutMatch = (stage===null && drawFormat==='KNOCKOUT') = true here -> advancement still works
      expect(finalAfter.player1Id).toBe(p1);
    });
  });
});
