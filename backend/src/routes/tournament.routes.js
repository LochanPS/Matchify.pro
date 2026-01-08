import express from 'express';
import {
  createTournament,
  getTournaments,
  getTournament,
  updateTournament,
  deleteTournament,
  uploadPosters,
  uploadPaymentQR,
  updatePaymentInfo,
  upload,
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/tournament.controller.js';
import { authenticate, preventAdminAccess } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getTournaments); // Get all tournaments (with filters)
router.get('/:id', getTournament); // Get single tournament
router.get('/:id/categories', getCategories); // Get tournament categories (public)

// Protected routes (require authentication + block admins)
router.use(authenticate);
router.use(preventAdminAccess);

// POST /api/tournaments - Create tournament
router.post('/', createTournament);

// PUT /api/tournaments/:id - Update tournament
router.put('/:id', updateTournament);

// DELETE /api/tournaments/:id - Delete tournament
router.delete('/:id', deleteTournament);

// POST /api/tournaments/:id/posters - Upload posters (max 5 files)
router.post('/:id/posters', upload.array('posters', 5), uploadPosters);

// POST /api/tournaments/:id/payment-qr - Upload payment QR code
router.post('/:id/payment-qr', upload.single('paymentQR'), uploadPaymentQR);

// PUT /api/tournaments/:id/payment-info - Update payment info
router.put('/:id/payment-info', updatePaymentInfo);

// Category routes (organizer only)
router.post('/:id/categories', createCategory);
router.put('/:id/categories/:categoryId', updateCategory);
router.delete('/:id/categories/:categoryId', deleteCategory);

export default router;
