import express from 'express';
import {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  uploadPosters,
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
import { authenticate, preventAdminAccess } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getTournaments); // Get all tournaments (with filters)
router.get('/:id', getTournament); // Get single tournament
router.get('/:id/categories', getCategories); // Get tournament categories (public)
router.get('/:tournamentId/categories/:categoryId/registrations', getCategoryRegistrations); // Get category registrations

// Match routes (require authentication but allow admins)
router.get('/:tournamentId/categories/:categoryId/matches', authenticate, getMatches);
router.post('/:tournamentId/categories/:categoryId/matches', authenticate, createMatch);

// Restart draw route (require authentication, organizer only)
router.post('/:tournamentId/categories/:categoryId/draw/restart', authenticate, restartDraw);

// End category route (require authentication, organizer only)
// IMPORTANT: This route MUST be before the generic /:id/categories/:categoryId route
router.put('/:tournamentId/categories/:categoryId/end', authenticate, endCategory);

// Protected routes (require authentication + block admins)
router.use(authenticate);
router.use(preventAdminAccess);

// POST /api/tournaments - Create tournament (NO KYC REQUIRED)
router.post('/', createTournament);

// PUT /api/tournaments/:id - Update tournament
router.put('/:id', updateTournament);

// DELETE /api/tournaments/:id - Delete tournament
router.delete('/:id', deleteTournament);

// POST /api/tournaments/:id/posters - Upload posters (max 5 files)
router.post('/:id/posters', upload.array('posters', 5), uploadPosters);

// POST /api/tournaments/:id/payment-qr - Upload payment QR code
router.post('/:id/payment-qr', upload.single('paymentQR'), uploadPaymentQR);

// PUT /api/tournaments/:id/payment-info - Update payment info
router.put('/:id/payment-info', updatePaymentInfo);

// PUT /api/tournaments/:id/end - End tournament (legacy - ends all categories)
router.put('/:id/end', endTournament);

// Category routes (organizer only)
router.post('/:id/categories', createCategory);
router.put('/:id/categories/:categoryId', updateCategory);
router.delete('/:id/categories/:categoryId', deleteCategory);

// Umpire routes (organizer only)
router.get('/:id/umpires', getTournamentUmpires);
router.post('/:id/umpires', addUmpireByCode);
router.delete('/:id/umpires/:umpireId', removeUmpire);

export default router;
