import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import {
  getCourts,
  getOwnerCourts,
  createCourt,
  updateCourt,
  deleteCourt,
  updateAvailability,
  getSlots,
  getOwnerDashboard,
  updateAcademy
} from '../controllers/court.controller.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Images only'), false);
  }
});

// ── Public ──────────────────────────────────────────────
// GET courts for an academy (public, active only)
router.get('/academies/:academyId/courts', getCourts);

// GET available slots for a court on a date
router.get('/courts/:courtId/slots', getSlots);

// ── Owner dashboard ──────────────────────────────────────
// GET owner dashboard stats + academies
router.get('/owner/dashboard', authenticate, getOwnerDashboard);

// ── Owner academy management ─────────────────────────────
// GET all courts (incl inactive) for owner
router.get('/owner/academies/:academyId/courts', authenticate, getOwnerCourts);

// UPDATE academy details (owner)
router.put('/owner/academies/:academyId',
  authenticate,
  upload.fields([{ name: 'photos', maxCount: 10 }]),
  updateAcademy
);

// ── Court CRUD (owner) ────────────────────────────────────
// CREATE court
router.post('/owner/academies/:academyId/courts',
  authenticate,
  upload.fields([{ name: 'photos', maxCount: 5 }]),
  createCourt
);

// UPDATE court
router.put('/owner/academies/:academyId/courts/:courtId',
  authenticate,
  upload.fields([{ name: 'photos', maxCount: 5 }]),
  updateCourt
);

// DELETE/deactivate court
router.delete('/owner/academies/:academyId/courts/:courtId', authenticate, deleteCourt);

// UPDATE availability for a court
router.put('/owner/academies/:academyId/courts/:courtId/availability', authenticate, updateAvailability);

export default router;
