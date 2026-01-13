import express from 'express';
import { getMatches, getMatch, updateMatchResult, assignCourt, getBracket, startMatch, updateLiveScore, endMatch, getUmpireMatches, assignUmpire, createMatch, undoPoint, setMatchConfig, pauseMatchTimer, resumeMatchTimer } from '../controllers/match.controller.js';
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

// Create match for a category (organizer only)
router.post(
  '/tournaments/:tournamentId/categories/:categoryId/matches',
  authenticate,
  createMatch
);

// Get matches for umpire (authenticated)
router.get(
  '/umpire/matches',
  authenticate,
  getUmpireMatches
);

// Get single match (public)
router.get(
  '/matches/:matchId',
  getMatch
);

// Start match (umpire/organizer)
router.put(
  '/matches/:matchId/start',
  authenticate,
  startMatch
);

// Update live score (umpire/organizer)
router.put(
  '/matches/:matchId/score',
  authenticate,
  updateLiveScore
);

// End match (umpire/organizer)
router.put(
  '/matches/:matchId/end',
  authenticate,
  endMatch
);

// Undo last point (umpire/organizer)
router.put(
  '/matches/:matchId/undo',
  authenticate,
  undoPoint
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

// Assign umpire to match (organizer only)
router.put(
  '/matches/:matchId/umpire',
  authenticate,
  assignUmpire
);

// Set match scoring config (umpire/organizer)
router.put(
  '/matches/:matchId/config',
  authenticate,
  setMatchConfig
);

// Pause match timer (umpire/organizer)
router.put(
  '/matches/:matchId/timer/pause',
  authenticate,
  pauseMatchTimer
);

// Resume match timer (umpire/organizer)
router.put(
  '/matches/:matchId/timer/resume',
  authenticate,
  resumeMatchTimer
);

export default router;
