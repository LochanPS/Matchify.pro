import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getPendingKYCs,
  approveKYC,
  rejectKYC,
  toggleAvailability,
  getKYCStats,
  getKYCById,
  saveAadhaarInfo
} from '../controllers/admin-kyc.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Admin KYC routes
router.get('/pending', getPendingKYCs);
router.get('/stats', getKYCStats);
router.get('/kyc/:kycId', getKYCById);
router.post('/approve/:kycId', approveKYC);
router.post('/reject/:kycId', rejectKYC);
router.post('/kyc/:kycId/aadhaar-info', saveAadhaarInfo);
router.put('/availability', toggleAvailability);

export default router;
