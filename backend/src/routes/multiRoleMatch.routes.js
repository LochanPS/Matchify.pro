import express from 'express';
import { getUmpireMatches, updateScore, submitMatch } from '../controllers/matchController.js';
import { authenticate, requireRole } from '../middleware/roleAuth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Umpire-only routes
router.get('/umpire', requireRole('UMPIRE'), getUmpireMatches);
router.post('/:matchId/score', requireRole('UMPIRE'), updateScore);
router.post('/:matchId/submit', requireRole('UMPIRE'), submitMatch);

export default router;