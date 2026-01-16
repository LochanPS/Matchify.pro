import express from 'express';
import multer from 'multer';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import {
  createAcademy,
  getAcademies,
  getPendingAcademies,
  approveAcademy,
  rejectAcademy,
  getAcademyById
} from '../controllers/academy.controller.js';

const router = express.Router();

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Public routes
router.get('/', getAcademies);
router.get('/admin/pending', authenticate, getPendingAcademies);
router.get('/:id', getAcademyById);

// Submit academy (optional auth - can be guest or logged in user)
router.post('/', 
  optionalAuth,
  upload.fields([
    { name: 'paymentScreenshot', maxCount: 1 },
    { name: 'academyQrCode', maxCount: 1 },
    { name: 'photos', maxCount: 20 }
  ]),
  createAcademy
);

// Admin routes
router.post('/admin/:id/approve', authenticate, approveAcademy);
router.post('/admin/:id/reject', authenticate, rejectAcademy);

export default router;
