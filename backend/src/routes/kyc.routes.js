import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  uploadAadhaar,
  upload,
  submitKYC,
  requestVideoCall,
  getKYCStatus,
  rejoinCall
} from '../controllers/kyc.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload Aadhaar image
router.post('/upload-aadhaar', upload.single('aadhaar'), uploadAadhaar);

// Organizer KYC routes
router.post('/submit', submitKYC);
router.post('/request-call', requestVideoCall);
router.get('/status', getKYCStatus);
router.post('/rejoin-call', rejoinCall);

export default router;
