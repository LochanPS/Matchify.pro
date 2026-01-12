import express from 'express';
import { generateDraw, getDraw, deleteDraw, createConfiguredDraw, getCategoryPlayers, assignPlayersToDraw } from '../controllers/draw.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Create configured draw (organizer only) - new flexible endpoint
router.post('/draws/create', authenticate, createConfiguredDraw);

// Assign players to draw (organizer only)
router.put('/draws/assign-players', authenticate, assignPlayersToDraw);

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
