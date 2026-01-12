import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import {
  createRegistration,
  createRegistrationWithScreenshot,
  getMyRegistrations,
  cancelRegistration,
  verifyPayment,
} from '../controllers/registration.controller.js';
import { authenticate, preventAdminAccess } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for payment screenshot uploads
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/payment-screenshots';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer for refund QR code uploads
const refundQrStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/refund-qr';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'refund-qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadScreenshot = multer({
  storage: screenshotStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

const uploadRefundQr = multer({
  storage: refundQrStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// All routes require authentication + block admins
router.use(authenticate);
router.use(preventAdminAccess);

// POST /api/registrations - Register for tournament (legacy)
router.post('/', createRegistration);

// POST /api/registrations/with-screenshot - Register with payment screenshot
router.post('/with-screenshot', uploadScreenshot.single('paymentScreenshot'), createRegistrationWithScreenshot);

// GET /api/registrations/my - Get user's registrations
router.get('/my', getMyRegistrations);

// GET /api/registrations/:id - Get single registration
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const registration = await prisma.registration.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            startDate: true,
            city: true,
            state: true,
            organizerId: true,
          },
        },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found',
      });
    }

    res.json({
      success: true,
      registration,
    });
  } catch (error) {
    console.error('Get registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch registration',
    });
  }
});

// POST /api/registrations/:id/verify-payment - Organizer verifies payment
router.post('/:id/verify-payment', verifyPayment);

// PUT /api/registrations/:id/confirm-refund - Player confirms refund received
router.put('/:id/confirm-refund', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // First, find the registration without status checks to provide better error messages
    const registration = await prisma.registration.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        tournament: true,
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or you do not have access to it',
      });
    }

    // Check if the registration is in the correct state
    if (registration.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        error: `Cannot confirm refund. Registration status is "${registration.status}" (expected "cancelled")`,
      });
    }

    if (registration.refundStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        error: `Cannot confirm refund. Refund status is "${registration.refundStatus || 'not set'}" (expected "approved")`,
      });
    }

    await prisma.registration.update({
      where: { id },
      data: {
        refundStatus: 'completed',
        refundCompletedAt: new Date(),
      },
    });

    // Notify organizer that player confirmed refund
    await prisma.notification.create({
      data: {
        userId: registration.tournament.organizerId,
        type: 'REFUND_CONFIRMED',
        title: 'Refund Confirmed by Player',
        message: `The player has confirmed receiving the refund of ₹${registration.refundAmount} for ${registration.tournament.name}.`,
        data: JSON.stringify({
          registrationId: registration.id,
          tournamentId: registration.tournamentId,
          amount: registration.refundAmount,
        }),
      },
    });

    res.json({
      success: true,
      message: 'Refund confirmed successfully',
    });
  } catch (error) {
    console.error('Confirm refund error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm refund',
    });
  }
});

// PUT /api/registrations/:id/report-refund-issue - Player reports refund not received
router.put('/:id/report-refund-issue', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const registration = await prisma.registration.findFirst({
      where: {
        id,
        userId,
        status: 'cancelled',
        refundStatus: 'approved',
      },
      include: {
        tournament: true,
        user: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found or refund not approved',
      });
    }

    // Notify organizer about the issue
    await prisma.notification.create({
      data: {
        userId: registration.tournament.organizerId,
        type: 'REFUND_ISSUE',
        title: 'Refund Issue Reported ⚠️',
        message: `${registration.user.name} has reported that they haven't received the refund of ₹${registration.refundAmount} for ${registration.tournament.name}. Please contact them to resolve this issue.`,
        data: JSON.stringify({
          registrationId: registration.id,
          tournamentId: registration.tournamentId,
          playerName: registration.user.name,
          playerEmail: registration.user.email,
          playerPhone: registration.user.phone,
          amount: registration.refundAmount,
          upiId: registration.refundUpiId,
        }),
      },
    });

    res.json({
      success: true,
      message: 'Issue reported to organizer',
    });
  } catch (error) {
    console.error('Report refund issue error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report issue',
    });
  }
});

// POST /api/registrations/:id/cancel - Cancel registration with reason and UPI details
router.post('/:id/cancel', uploadRefundQr.single('refundQrCode'), cancelRegistration);

// DELETE /api/registrations/:id - Cancel registration (legacy - redirect to POST)
router.delete('/:id', uploadRefundQr.single('refundQrCode'), cancelRegistration);

export default router;
