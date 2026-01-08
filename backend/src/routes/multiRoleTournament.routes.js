import express from 'express';
import { createTournament, getAllTournaments, getTournament } from '../controllers/tournamentController.js';
import { authenticate, requireRole } from '../middleware/roleAuth.js';

const router = express.Router();

// Public routes
router.get('/', getAllTournaments);
router.get('/:id', getTournament);

// Protected routes
router.use(authenticate);

// Organizer-only routes
router.post('/', requireRole('ORGANIZER'), createTournament);

export default router;