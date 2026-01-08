import express from 'express';
import { getPartnerInvitation, confirmPartner } from '../controllers/partner.controller.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/partner/confirm/:token - Get partner invitation details (public)
router.get('/confirm/:token', getPartnerInvitation);

// POST /api/partner/confirm/:token - Accept or decline invitation (optional auth)
router.post('/confirm/:token', optionalAuth, confirmPartner);

export default router;
