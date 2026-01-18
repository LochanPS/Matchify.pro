import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getPendingKYCs,
  approveKYC,
  rejectKYC,
  toggleAvailability,
  getKYCStats
} from '../controllers/admin-kyc.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin KYC routes
router.get('/pending', getPendingKYCs);
router.post('/approve/:kycId', approveKYC);
router.post('/reject/:kycId', rejectKYC);
router.put('/availability', toggleAvailability);
router.get('/stats', getKYCStats);

export default router;
