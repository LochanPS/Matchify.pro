import express from 'express';
import { testSMS, getSMSLogs, getSMSStatus } from '../controllers/smsController.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Test SMS (admin only)
router.post('/test', authenticate, requireAdmin, testSMS);

// Get SMS logs (admin only)
router.get('/logs', authenticate, requireAdmin, getSMSLogs);

// Get SMS status by Twilio SID
router.get('/status/:twilioSid', authenticate, requireAdmin, getSMSStatus);

export default router;
