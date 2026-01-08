import express from 'express';
import {
  createRegistration,
  getMyRegistrations,
  cancelRegistration,
} from '../controllers/registration.controller.js';
import { authenticate, preventAdminAccess } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication + block admins
router.use(authenticate);
router.use(preventAdminAccess);

// POST /api/registrations - Register for tournament
router.post('/', createRegistration);

// GET /api/registrations/my - Get user's registrations
router.get('/my', getMyRegistrations);

// DELETE /api/registrations/:id - Cancel registration
router.delete('/:id', cancelRegistration);

export default router;
