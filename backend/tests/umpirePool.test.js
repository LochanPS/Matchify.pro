/**
 * Unit tests for the shared umpire pool.
 *
 * These run the REAL handler code (tournament.controller + match.routes'
 * startMatchHandler) against a mocked Prisma client, so we verify the actual
 * authorization branches, the bulk-post filter, and the atomic claim/lock —
 * without needing a live database.
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ── Prisma mock (shared by controller + routes; same absolute module) ─────────
const prismaMock = {
  tournament:       { findUnique: jest.fn() },
  tournamentUmpire: { findUnique: jest.fn() },
  match:            { findUnique: jest.fn(), findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
  user:             { findUnique: jest.fn(), findMany: jest.fn() },
  registration:     { findMany: jest.fn(), findUnique: jest.fn() },
};

jest.unstable_mockModule('../src/lib/prisma.js', () => ({ default: prismaMock }));

// ── Side-effect-free stand-ins for heavy imports ──────────────────────────────
jest.unstable_mockModule('../src/config/cloudinary.js', () => ({ default: {} }));
jest.unstable_mockModule('../src/services/notificationService.js', () => ({ default: { createNotification: jest.fn() } }));
jest.unstable_mockModule('../src/services/tournamentPoints.service.js', () => ({ default: { awardTournamentPoints: jest.fn() } }));
jest.unstable_mockModule('../src/services/redisService.js', () => ({
  cacheGet: jest.fn(), cacheSet: jest.fn(), cacheDel: jest.fn(),
}));
jest.unstable_mockModule('../src/services/socketService.js', () => ({
  broadcastScoreUpdate: jest.fn(), broadcastMatchStatus: jest.fn(),
  broadcastMatchComplete: jest.fn(), broadcastToTournament: jest.fn(),
}));
jest.unstable_mockModule('../src/controllers/drawPage.controller.js', () => ({
  getDrawPageCacheKey: jest.fn(() => 'key'),
}));
jest.unstable_mockModule('../src/services/standings.service.js', () => ({
  recalcGroupStandings: jest.fn(), sortStandings: jest.fn(() => []),
  pointsScheme: jest.fn(() => ({ win: 2, loss: 0 })), matchPointTotals: jest.fn(() => null),
}));
jest.unstable_mockModule('../src/controllers/match.controller.js', () => ({
  assignUmpire: jest.fn(), getUmpireMatches: jest.fn(), saveUmpireQueue: jest.fn(), giveBye: jest.fn(),
  getMatches: jest.fn(), createMatch: jest.fn(),
}));
jest.unstable_mockModule('../src/middleware/auth.js', () => ({
  authenticate: (req, res, next) => next && next(), authorize: () => (req, res, next) => next && next(),
  optionalAuth: (req, res, next) => next && next(),
}));

// Dynamic imports AFTER mocks are registered
const { getUmpirePostedMatches, setUmpirePostedMatches } = await import('../src/controllers/tournament.controller.js');
const { startMatchHandler } = await import('../src/routes/match.routes.js');

// ── Helpers ───────────────────────────────────────────────────────────────────
const makeRes = () => {
  const res = {};
  res.statusCode = 200;
  res.body = null;
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn((b) => { res.body = b; return res; });
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  prismaMock.tournament.findUnique.mockReset();
  prismaMock.tournamentUmpire.findUnique.mockReset();
  prismaMock.match.findUnique.mockReset();
  prismaMock.match.findMany.mockReset();
  prismaMock.match.update.mockReset();
  prismaMock.match.updateMany.mockReset();
  prismaMock.user.findUnique.mockReset();
  prismaMock.user.findMany.mockReset();
  prismaMock.registration.findMany.mockReset();
  prismaMock.registration.findUnique.mockReset();
});

// ══════════════════════════════════════════════════════════════════════════════
describe('setUmpirePostedMatches (organizer bulk post/unpost)', () => {
  it('rejects a non-array / empty matchIds with 400', async () => {
    const req = { params: { id: 't1' }, user: { id: 'org1' }, body: { matchIds: [] } };
    const res = makeRes();
    await setUmpirePostedMatches(req, res);
    expect(res.statusCode).toBe(400);
  });

  it('rejects a non-organizer with 403', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1', organizerId: 'org1' });
    const req = { params: { id: 't1' }, user: { id: 'someoneElse' }, body: { matchIds: ['m1'] } };
    const res = makeRes();
    await setUmpirePostedMatches(req, res);
    expect(res.statusCode).toBe(403);
    expect(prismaMock.match.updateMany).not.toHaveBeenCalled();
  });

  it('posts selected matches with the playable filter (both players, not completed)', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1', organizerId: 'org1' });
    prismaMock.match.updateMany.mockResolvedValue({ count: 2 });
    const req = { params: { id: 't1' }, user: { id: 'org1' }, body: { matchIds: ['m1', 'm2'], posted: true } };
    const res = makeRes();
    await setUmpirePostedMatches(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({ success: true, updated: 2, posted: true });
    const arg = prismaMock.match.updateMany.mock.calls[0][0];
    expect(arg.where).toMatchObject({
      id: { in: ['m1', 'm2'] }, tournamentId: 't1',
      player1Id: { not: null }, player2Id: { not: null },
      status: { notIn: ['COMPLETED', 'BYE'] },
    });
    expect(arg.data).toEqual({ umpirePosted: true });
  });

  it('unposts without the playable filter when posted=false', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1', organizerId: 'org1' });
    prismaMock.match.updateMany.mockResolvedValue({ count: 1 });
    const req = { params: { id: 't1' }, user: { id: 'org1' }, body: { matchIds: ['m1'], posted: false } };
    const res = makeRes();
    await setUmpirePostedMatches(req, res);

    expect(res.statusCode).toBe(200);
    const arg = prismaMock.match.updateMany.mock.calls[0][0];
    expect(arg.where).toEqual({ id: { in: ['m1'] }, tournamentId: 't1' });
    expect(arg.where.player1Id).toBeUndefined();
    expect(arg.data).toEqual({ umpirePosted: false });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('getUmpirePostedMatches (universal page access + shape)', () => {
  const postedMatch = {
    id: 'm1', tournamentId: 't1', categoryId: 'c1', round: 2, matchNumber: 5,
    status: 'PENDING', courtNumber: 3, player1Id: 'p1', player2Id: 'p2',
    umpireId: null, category: { id: 'c1', name: 'MS' }, umpire: null,
  };

  it('returns 404 when the tournament does not exist', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue(null);
    const req = { params: { id: 'tX' }, user: { id: 'u1', roles: [] } };
    const res = makeRes();
    await getUmpirePostedMatches(req, res);
    expect(res.statusCode).toBe(404);
  });

  it('rejects a user who is neither organizer, admin, nor registered umpire (403)', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1', name: 'T', organizerId: 'org1' });
    prismaMock.tournamentUmpire.findUnique.mockResolvedValue(null);
    const req = { params: { id: 't1' }, user: { id: 'stranger', roles: [] } };
    const res = makeRes();
    await getUmpirePostedMatches(req, res);
    expect(res.statusCode).toBe(403);
    expect(prismaMock.match.findMany).not.toHaveBeenCalled();
  });

  it('lets a registered umpire see posted matches with resolved names', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1', name: 'T', organizerId: 'org1' });
    prismaMock.tournamentUmpire.findUnique.mockResolvedValue({ id: 'tu1' });
    prismaMock.match.findMany.mockResolvedValue([postedMatch]);
    // name resolution: user.findMany then registration.findMany (guest) then registration.findMany (partner)
    prismaMock.user.findMany.mockResolvedValue([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }]);
    prismaMock.registration.findMany.mockResolvedValue([]);

    const req = { params: { id: 't1' }, user: { id: 'ump1', roles: [] } };
    const res = makeRes();
    await getUmpirePostedMatches(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.isOrganizer).toBe(false);
    expect(res.body.viewerId).toBe('ump1');
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0]).toMatchObject({
      id: 'm1', player1Name: 'Alice', player2Name: 'Bob', umpireId: null, umpireName: null,
    });
  });

  it('lets the organizer see posted matches without an umpire-registration check', async () => {
    prismaMock.tournament.findUnique.mockResolvedValue({ id: 't1', name: 'T', organizerId: 'org1' });
    prismaMock.match.findMany.mockResolvedValue([{ ...postedMatch, umpireId: 'ump9', umpire: { id: 'ump9', name: 'Zoe' } }]);
    prismaMock.user.findMany.mockResolvedValue([{ id: 'p1', name: 'Alice' }, { id: 'p2', name: 'Bob' }]);
    prismaMock.registration.findMany.mockResolvedValue([]);

    const req = { params: { id: 't1' }, user: { id: 'org1', roles: [] } };
    const res = makeRes();
    await getUmpirePostedMatches(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.isOrganizer).toBe(true);
    expect(prismaMock.tournamentUmpire.findUnique).not.toHaveBeenCalled();
    expect(res.body.matches[0]).toMatchObject({ umpireId: 'ump9', umpireName: 'Zoe' });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
describe('startMatchHandler (claim + first-come lock)', () => {
  const baseMatch = {
    id: 'm1', tournamentId: 't1', categoryId: 'c1', player1Id: 'p1', player2Id: 'p2',
    umpireId: null, umpirePosted: true, status: 'PENDING', scoreJson: null,
    tournament: { organizerId: 'org1', id: 't1', name: 'T', sport: 'Badminton' },
    category: { id: 'c1', name: 'MS' }, umpire: null,
  };

  it('rejects a user who is not organizer/admin/owner and not a registered umpire (403)', async () => {
    prismaMock.match.findUnique.mockResolvedValue(baseMatch);
    prismaMock.tournamentUmpire.findUnique.mockResolvedValue(null);
    const req = { params: { matchId: 'm1' }, user: { id: 'stranger', roles: [] } };
    const res = makeRes();
    await startMatchHandler(req, res);
    expect(res.statusCode).toBe(403);
    expect(prismaMock.match.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a registered umpire when the match is NOT posted (403)', async () => {
    prismaMock.match.findUnique.mockResolvedValue({ ...baseMatch, umpirePosted: false });
    prismaMock.tournamentUmpire.findUnique.mockResolvedValue({ id: 'tu1' });
    const req = { params: { matchId: 'm1' }, user: { id: 'ump1', roles: [] } };
    const res = makeRes();
    await startMatchHandler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/not open for umpires/i);
  });

  it('claims a posted, unclaimed match atomically and locks it to the umpire', async () => {
    prismaMock.match.findUnique
      .mockResolvedValueOnce(baseMatch) // initial fetch
      .mockResolvedValueOnce({ ...baseMatch, umpireId: 'ump1', status: 'IN_PROGRESS', umpire: { id: 'ump1', name: 'Ann' } }); // finalMatch
    prismaMock.tournamentUmpire.findUnique.mockResolvedValue({ id: 'tu1' });
    prismaMock.match.updateMany.mockResolvedValue({ count: 1 });
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'p1', name: 'Alice' })
      .mockResolvedValueOnce({ id: 'p2', name: 'Bob' });

    const req = { params: { matchId: 'm1' }, user: { id: 'ump1', roles: [] } };
    const res = makeRes();
    await startMatchHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    // The lock is the guarded conditional update
    const claimArg = prismaMock.match.updateMany.mock.calls[0][0];
    expect(claimArg.where).toMatchObject({ id: 'm1', umpireId: null, umpirePosted: true });
    expect(claimArg.where.status.in).toEqual(expect.arrayContaining(['PENDING', 'READY', 'SCHEDULED']));
    expect(claimArg.data).toMatchObject({ umpireId: 'ump1', status: 'IN_PROGRESS' });
    // Never used the privileged direct-update path
    expect(prismaMock.match.update).not.toHaveBeenCalled();
  });

  it('returns 409 when another umpire already took the match (claim matches 0 rows)', async () => {
    prismaMock.match.findUnique.mockResolvedValue(baseMatch);
    prismaMock.tournamentUmpire.findUnique.mockResolvedValue({ id: 'tu1' });
    prismaMock.match.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'p1', name: 'Alice' })
      .mockResolvedValueOnce({ id: 'p2', name: 'Bob' });

    const req = { params: { matchId: 'm1' }, user: { id: 'ump2', roles: [] } };
    const res = makeRes();
    await startMatchHandler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.body.message).toMatch(/already been taken/i);
  });

  it('lets the organizer start directly (no claim path, no lock check)', async () => {
    prismaMock.match.findUnique.mockResolvedValue(baseMatch);
    prismaMock.match.update.mockResolvedValue({ ...baseMatch, status: 'IN_PROGRESS', umpire: null });
    prismaMock.user.findUnique
      .mockResolvedValueOnce({ id: 'p1', name: 'Alice' })
      .mockResolvedValueOnce({ id: 'p2', name: 'Bob' });

    const req = { params: { matchId: 'm1' }, user: { id: 'org1', roles: [] } };
    const res = makeRes();
    await startMatchHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(prismaMock.match.updateMany).not.toHaveBeenCalled(); // organizer uses the direct path
    expect(prismaMock.match.update).toHaveBeenCalled();
    expect(prismaMock.tournamentUmpire.findUnique).not.toHaveBeenCalled();
  });

  it('blocks starting a match that is already IN_PROGRESS', async () => {
    prismaMock.match.findUnique.mockResolvedValue({ ...baseMatch, status: 'IN_PROGRESS' });
    const req = { params: { matchId: 'm1' }, user: { id: 'org1', roles: [] } };
    const res = makeRes();
    await startMatchHandler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/already been started/i);
  });
});
