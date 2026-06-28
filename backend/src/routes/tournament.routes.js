import express from 'express';
import prisma from '../lib/prisma.js';
import {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  uploadPosters,
  deletePoster,
  uploadPaymentQR,
  updatePaymentInfo,
  upload,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
  addUmpireByCode,
  getTournamentUmpires,
  removeUmpire,
  getCategoryRegistrations,
  endTournament,
  endCategory,
} from '../controllers/tournament.controller.js';
import { getMatches, createMatch, assignUmpire } from '../controllers/match.controller.js';
import { restartDraw } from '../controllers/restartDraw.controller.js';
import { quickAddPlayer } from '../controllers/quickAdd.controller.js';
import { authenticate, preventAdminAccess } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getTournaments); // Get all tournaments (with filters)
router.get('/:id', getTournament); // Get single tournament
router.get('/:id/categories', getCategories); // Get tournament categories (public)
router.get('/:tournamentId/categories/:categoryId/registrations', authenticate, getCategoryRegistrations); // Get category registrations

// Match routes (require authentication but allow admins)
router.get('/:tournamentId/categories/:categoryId/matches', authenticate, getMatches);
router.post('/:tournamentId/categories/:categoryId/matches', authenticate, createMatch);

// GET /tournaments/:id/matches — all matches for a tournament (all categories)
// Used by frontend api/matches.js getTournamentMatches()
router.get('/:tournamentId/matches', authenticate, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { categoryId, status, round } = req.query;

    const where = { tournamentId };
    if (categoryId) where.categoryId = categoryId;
    if (status)     where.status     = status;
    if (round)      where.round      = parseInt(round);

    const matches = await prisma.match.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
      },
      orderBy: [{ round: 'asc' }, { matchNumber: 'asc' }],
    });

    // Batch-fetch all unique player IDs — avoids N+1
    const playerIds = [...new Set(
      matches.flatMap(m => [m.player1Id, m.player2Id, m.team1Player1Id, m.team1Player2Id, m.team2Player1Id, m.team2Player2Id])
        .filter(Boolean)
    )];
    const players = playerIds.length
      ? await prisma.user.findMany({ where: { id: { in: playerIds } }, select: { id: true, name: true, profilePhoto: true } })
      : [];
    const playerMap = Object.fromEntries(players.map(p => [p.id, p]));

    const result = matches.map(m => ({
      ...m,
      score: m.scoreJson ? (() => { try { return JSON.parse(m.scoreJson); } catch { return null; } })() : null,
      player1: playerMap[m.player1Id] || null,
      player2: playerMap[m.player2Id] || null,
      team1Player1: playerMap[m.team1Player1Id] || null,
      team1Player2: playerMap[m.team1Player2Id] || null,
      team2Player1: playerMap[m.team2Player1Id] || null,
      team2Player2: playerMap[m.team2Player2Id] || null,
    }));

    res.json({ success: true, matches: result });
  } catch (error) {
    console.error('Error fetching tournament matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch matches' });
  }
});

// Restart draw route (require authentication, organizer only)
router.post('/:tournamentId/categories/:categoryId/draw/restart', authenticate, restartDraw);

// End category route (require authentication, organizer only)
// IMPORTANT: This route MUST be before the generic /:id/categories/:categoryId route
router.put('/:tournamentId/categories/:categoryId/end', authenticate, endCategory);

// Protected routes (require authentication)
// NOTE: preventAdminAccess removed — admin must be able to create/manage tournaments
router.use(authenticate);

// POST /api/tournaments - Create tournament (NO KYC REQUIRED)
router.post('/', createTournament);

// PUT /api/tournaments/:id - Update tournament
router.put('/:id', updateTournament);

// DELETE /api/tournaments/:id - Delete tournament
router.delete('/:id', deleteTournament);

// Multer error handler — converts multer's LIMIT_FILE_SIZE error to a clean JSON 400
// so the frontend can show a human-readable message instead of "Network Error".
const handleUploadError = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: 'File too large. Each image must be under 4 MB.' });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({ success: false, error: 'Too many files. Maximum 5 posters allowed.' });
      }
      return res.status(400).json({ success: false, error: err.message || 'Upload failed' });
    }
    next();
  });
};

// POST /api/tournaments/:id/posters - Upload posters (max 5 files)
router.post('/:id/posters', handleUploadError(upload.array('posters', 5)), uploadPosters);

// DELETE /api/tournaments/:id/posters/:posterId - Delete a poster
router.delete('/:id/posters/:posterId', deletePoster);

// POST /api/tournaments/:id/payment-qr - Upload payment QR code
router.post('/:id/payment-qr', handleUploadError(upload.single('paymentQR')), uploadPaymentQR);

// PUT /api/tournaments/:id/payment-info - Update payment info
router.put('/:id/payment-info', updatePaymentInfo);

// PUT /api/tournaments/:id/end - End tournament (legacy - ends all categories)
router.put('/:id/end', endTournament);

// Quick Add Player (admin OR this tournament's organizer — ownership enforced in controller)
// Mirrors the admin quick-add: creates a confirmed guest registration with entry fee,
// which flows into tournament revenue + organizer payout via createOrUpdateTournamentPayment.
router.post('/:tournamentId/quick-add-player', quickAddPlayer);

// Category routes (organizer only)
router.post('/:id/categories', createCategory);
router.put('/:id/categories/:categoryId', updateCategory);
router.delete('/:id/categories/:categoryId', deleteCategory);

// Umpire routes (organizer only)
router.get('/:id/umpires', getTournamentUmpires);
router.post('/:id/umpires', addUmpireByCode);
router.delete('/:id/umpires/:umpireId', removeUmpire);

// DELETE /api/tournaments/:tournamentId/categories/:categoryId/registrations/:registrationId/remove
// Admin or organiser only — removes player from tournament + clears their match slots
router.delete('/:tournamentId/categories/:categoryId/registrations/:registrationId/remove', authenticate, async (req, res) => {
  try {
    const { tournamentId, categoryId, registrationId } = req.params;
    const userId = req.user.id || req.user.userId;
    const userRoles = req.user.roles || [req.user.role];
    const isAdmin = userRoles.includes('ADMIN');

    // Verify tournament exists
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return res.status(404).json({ success: false, error: 'Tournament not found' });
    }

    // Only admin or organiser of this tournament can remove players
    const isOrganiser = tournament.organizerId === userId;
    if (!isAdmin && !isOrganiser) {
      return res.status(403).json({ success: false, error: 'Only admin or tournament organiser can remove players' });
    }

    // Find the registration
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: { select: { id: true, name: true } } }
    });
    if (!registration) {
      return res.status(404).json({ success: false, error: 'Registration not found' });
    }
    if (registration.tournamentId !== tournamentId || registration.categoryId !== categoryId) {
      return res.status(400).json({ success: false, error: 'Registration does not belong to this tournament/category' });
    }

    const playerIdToRemove = registration.userId || `guest-${registration.id}`;
    const amountPaid = registration.amountTotal || 0;
    const playerName = registration.guestName || registration.user?.name || 'Unknown';

    // Clear player from all matches in this category (set slot to null — organiser handles reassignment)
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, player1Id: playerIdToRemove },
      data: { player1Id: null, status: 'PENDING', winnerId: null }
    });
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, player2Id: playerIdToRemove },
      data: { player2Id: null, status: 'PENDING', winnerId: null }
    });
    // Also clear team slots for doubles
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, team1Player1Id: playerIdToRemove },
      data: { team1Player1Id: null }
    });
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, team1Player2Id: playerIdToRemove },
      data: { team1Player2Id: null }
    });
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, team2Player1Id: playerIdToRemove },
      data: { team2Player1Id: null }
    });
    await prisma.match.updateMany({
      where: { tournamentId, categoryId, team2Player2Id: playerIdToRemove },
      data: { team2Player2Id: null }
    });

    // Delete the registration — this auto-reduces revenue stats since revenue is computed from registrations
    await prisma.registration.delete({ where: { id: registrationId } });

    // Invalidate draw page cache so UI updates immediately
    const { cacheDel } = await import('../services/redisService.js');
    const { getDrawPageCacheKey } = await import('../controllers/drawPage.controller.js');
    await cacheDel(getDrawPageCacheKey(tournamentId, categoryId)).catch(() => {});

    res.json({
      success: true,
      message: `${playerName} removed from tournament`,
      removedRegistrationId: registrationId,
      amountDeducted: amountPaid
    });
  } catch (error) {
    console.error('Remove player error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove player' });
  }
});

export default router;
