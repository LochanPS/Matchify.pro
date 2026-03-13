/**
 * Match Lifecycle Routes
 * Handles match management during live tournaments
 */

import express from 'express';
import {
  assignUmpire,
  startMatch,
  updateScore,
  completeMatch,
  resetMatch,
  assignCourt,
  getMatchDetails,
  getMatches,
  getAvailableUmpires
} from '../controllers/match-lifecycle.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Match management
router.get('/matches/:matchId', getMatchDetails);
router.post('/matches/:matchId/assign-umpire', authenticate, assignUmpire);
router.post('/matches/:matchId/start', authenticate, startMatch);
router.post('/matches/:matchId/update-score', authenticate, updateScore);
router.post('/matches/:matchId/complete', authenticate, completeMatch);
router.post('/matches/:matchId/reset', authenticate, resetMatch);
router.post('/matches/:matchId/assign-court', authenticate, assignCourt);

// Tournament matches
router.get('/tournaments/:tournamentId/categories/:categoryId/matches', getMatches);
router.get('/tournaments/:tournamentId/umpires', getAvailableUmpires);

export default router;
