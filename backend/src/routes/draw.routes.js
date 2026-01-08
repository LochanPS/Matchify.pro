import express from 'express';
import { generateDraw, getDraw, deleteDraw } from '../controllers/draw.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

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

// Delete draw (organizer only)
router.delete(
  '/tournaments/:tournamentId/categories/:categoryId/draw',
  authenticate,
  deleteDraw
);

export default router;
