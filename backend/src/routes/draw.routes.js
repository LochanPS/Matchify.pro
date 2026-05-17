import express from 'express';
import { generateDraw, getDraw, deleteDraw, restartDraw, createConfiguredDraw, getCategoryPlayers, assignPlayersToDraw, bulkAssignAllPlayers, shuffleAssignedPlayers, arrangeKnockoutMatchups, continueToKnockout, repairKnockoutRelationships } from '../controllers/draw.controller.js';
import { getDrawPage } from '../controllers/drawPage.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Create configured draw (organizer only) - new flexible endpoint
router.post('/draws/create', authenticate, createConfiguredDraw);

// Assign players to draw (organizer only)
router.put('/draws/assign-players', authenticate, assignPlayersToDraw);

// Bulk assign all players (organizer only)
router.post('/draws/bulk-assign-all', authenticate, bulkAssignAllPlayers);

// Shuffle assigned players (organizer only)
router.post('/draws/shuffle-players', authenticate, shuffleAssignedPlayers);

// Arrange knockout matchups (organizer only)
router.post('/tournaments/:tournamentId/categories/:categoryId/draw/arrange-knockout', authenticate, arrangeKnockoutMatchups);

// Continue to knockout stage automatically (organizer only)
router.post('/tournaments/:tournamentId/categories/:categoryId/draw/continue-to-knockout', authenticate, continueToKnockout);

// Repair knockout parent relationships (organizer/admin — fixes draws created before the index-based fix)
router.post('/tournaments/:tournamentId/categories/:categoryId/draw/repair-knockout', authenticate, repairKnockoutRelationships);

// Restart draw - reset all match results (organizer only)
router.post('/tournaments/:tournamentId/categories/:categoryId/draw/restart', authenticate, restartDraw);

// Generate draw (organizer only)
router.post(
  '/tournaments/:tournamentId/categories/:categoryId/draw',
  authenticate,
  generateDraw
);

// Combined draw page endpoint — tournament + categories + draw + matches + stats in one call (PUBLIC)
router.get('/tournaments/:tournamentId/draw-page/:categoryId', getDrawPage);

// Get draw (PUBLIC - no authentication required for viewing)
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
