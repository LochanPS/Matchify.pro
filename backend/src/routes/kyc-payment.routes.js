import express from 'express';
import { authenticate } from '../middleware/auth.js';
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

// Admin routes (authenticate middleware already checks for ADMIN role)
router.get('/admin/payments', authenticate, getAllKYCPayments);
router.post('/admin/payments/:id/verify', authenticate, verifyKYCPayment);
router.post('/admin/payments/:id/reject', authenticate, rejectKYCPayment);

export default router;
