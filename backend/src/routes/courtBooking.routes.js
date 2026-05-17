import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  createBooking,
  getMyBookings,
  getAcademyBookings,
  confirmBooking,
  rejectBooking,
  cancelBooking,
  uploadBookingScreenshot
} from '../controllers/courtBooking.controller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'), false);
  }
});

// ── User booking routes ───────────────────────────────────
// GET my bookings
router.get('/my', authenticate, getMyBookings);

// CREATE booking (with optional screenshot)
router.post('/',
  authenticate,
  upload.single('paymentScreenshot'),
  createBooking
);

// UPLOAD screenshot for existing booking
router.post('/:bookingId/screenshot',
  authenticate,
  upload.single('paymentScreenshot'),
  uploadBookingScreenshot
);

// CANCEL booking (user)
router.post('/:bookingId/cancel', authenticate, cancelBooking);

// ── Academy owner routes ──────────────────────────────────
// GET all bookings for an academy
router.get('/academy/:academyId', authenticate, getAcademyBookings);

// CONFIRM booking
router.post('/:bookingId/confirm', authenticate, confirmBooking);

// REJECT booking
router.post('/:bookingId/reject', authenticate, rejectBooking);

export default router;
