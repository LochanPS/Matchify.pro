import express from 'express';
import { generateDraw, getDraw, deleteDraw, createConfiguredDraw, getCategoryPlayers, assignPlayersToDraw, bulkAssignAllPlayers, shuffleAssignedPlayers } from '../controllers/draw.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create configured draw (organizer only) - new flexible endpoint
router.post('/draws/create', authenticate, createConfiguredDraw);

// Assign players to draw (organizer only)
router.put('/draws/assign-players', authenticate, assignPlayersToDraw);

// Bulk assign all players (organizer only)
router.post('/draws/bulk-assign-all', authenticate, bulkAssignAllPlayers);

// Shuffle assigned players (organizer only)
router.post('/draws/shuffle-players', authenticate, shuffleAssignedPlayers);

// Generate draw (organizer only)
router.post(
  '/tournaments/:tournamentId/categories/:categoryId/draw',
  authenticate,
  generateDraw
);

// Get draw (public)
router.get(
  '/tournaments/:tournamentId/categories/:categoryId/draw',
  getDraw
);

// Get registered players for category (for draw assignment)
router.get(
  '/tournaments/:tournamentId/categories/:categoryId/players',
  authenticate,
  getCategoryPlayers
);

// Delete draw (organizer only)
router.delete(
  '/tournaments/:tournamentId/categories/:categoryId/draw',
  authenticate,
  deleteDraw
);

export default router;
