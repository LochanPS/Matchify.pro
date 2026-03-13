import express from 'express';
import {
  createDraw,
  getDraw,
  deleteDraw,
  assignPlayers,
  autoAssignPlayers,
  getConfirmedPlayers,
  completeMatch,
  resetMatch,
  continueToKnockout,
  autoArrangeKnockout,
  getGroupStandings,
  getAllGroupStandings,
  shufflePlayers,
  getMatches
} from '../controllers/draw-v2.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Draw management
router.post('/tournaments/:tournamentId/categories/:categoryId/draw', authenticate, createDraw);
router.get('/tournaments/:tournamentId/categories/:categoryId/draw', getDraw);
router.delete('/tournaments/:tournamentId/categories/:categoryId/draw', authenticate, deleteDraw);

// Player assignment
router.post('/tournaments/:tournamentId/categories/:categoryId/assign-players', authenticate, assignPlayers);
router.post('/tournaments/:tournamentId/categories/:categoryId/auto-assign-players', authenticate, autoAssignPlayers);
router.get('/tournaments/:tournamentId/categories/:categoryId/confirmed-players', authenticate, getConfirmedPlayers);

// Match management
router.get('/tournaments/:tournamentId/categories/:categoryId/matches', getMatches);
router.post('/matches/:matchId/complete', authenticate, completeMatch);
router.post('/matches/:matchId/reset', authenticate, resetMatch);

// Round robin + knockout
router.post('/tournaments/:tournamentId/categories/:categoryId/continue-knockout', authenticate, continueToKnockout);
router.post('/tournaments/:tournamentId/categories/:categoryId/auto-arrange-knockout', authenticate, autoArrangeKnockout);
router.get('/tournaments/:tournamentId/categories/:categoryId/groups/:groupIndex/standings', getGroupStandings);
router.get('/tournaments/:tournamentId/categories/:categoryId/standings', getAllGroupStandings);

// Utilities
router.post('/tournaments/:tournamentId/categories/:categoryId/shuffle', authenticate, shufflePlayers);

export default router;
