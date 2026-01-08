import express from 'express';
import { getMatches, getMatch, updateMatchResult, assignCourt, getBracket } from '../controllers/match.controller.js';
import { authenticate, preventAdminAccess } from '../middleware/auth.js';
import { optionalAuth } from '../middleware/optionalAuth.js';

const router = express.Router();

// Get bracket structure for a category (public)
router.get(
  '/tournaments/:tournamentId/categories/:categoryId/bracket',
  getBracket
);

// Get all matches for a category (public)
router.get(
  '/tournaments/:tournamentId/categories/:categoryId/matches',
  getMatches
);

// Get single match (public)
router.get(
  '/matches/:matchId',
  getMatch
);

// Update match result (organizer/umpire only, block admins)
router.put(
  '/matches/:matchId/result',
  authenticate,
  preventAdminAccess,
  updateMatchResult
);

// Assign court to match (organizer only, block admins)
router.put(
  '/matches/:matchId/court',
  authenticate,
  preventAdminAccess,
  assignCourt
);

export default router;
