import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import {
  submitKYCPayment,
  getKYCPaymentStatus,
  getAllKYCPayments,
  verifyKYCPayment,
  rejectKYCPayment,
  upload
} from '../controllers/kyc-payment.controller.js';

const router = express.Router();

// Organizer routes
router.post('/payment', authenticate, upload.single('paymentScreenshot'), submitKYCPayment);
router.get('/payment/status', authenticate, getKYCPaymentStatus);

// Admin routes
router.get('/admin/payments', authenticate, requireRole(['ADMIN']), getAllKYCPayments);
router.post('/admin/payments/:id/verify', authenticate, requireRole(['ADMIN']), verifyKYCPayment);
router.post('/admin/payments/:id/reject', authenticate, requireRole(['ADMIN']), rejectKYCPayment);

export default router;
