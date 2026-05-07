import express from 'express';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import {
  createRegistration,
  createRegistrationWithScreenshot,
  getMyRegistrations,
  cancelRegistration,
  verifyPayment,
  getPartnerByCode,
} from '../controllers/registration.controller.js';
import { authenticate, preventAdminAccess } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for memory storage (Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
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

// GET /api/registrations/partner-by-code/:playerCode - Get partner info by player code
router.get('/partner-by-code/:playerCode', getPartnerByCode);

// POST /api/registrations - Register for tournament (legacy)
router.post('/', createRegistration);

// POST /api/registrations/with-screenshot - Register with payment screenshot
router.post('/with-screenshot', upload.single('paymentScreenshot'), createRegistrationWithScreenshot);

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
router.post('/:id/cancel', upload.single('refundQrCode'), cancelRegistration);

// POST /api/registrations/:id/submit-refund-details - Submit refund details after rejection
router.post('/:id/submit-refund-details', upload.fields([
  { name: 'refundQrCode', maxCount: 1 },
  { name: 'paymentScreenshot', maxCount: 1 }
]), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { upiId, accountName } = req.body;

    // Validate inputs
    if (!upiId || !accountName) {
      return res.status(400).json({
        success: false,
        error: 'UPI ID and Account Name are required'
      });
    }

    // Find registration
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: { tournament: true }
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Check ownership
    if (registration.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Check if registration is rejected
    if (registration.status !== 'rejected') {
      return res.status(400).json({
        success: false,
        error: 'Can only submit refund details for rejected registrations'
      });
    }

    // Upload QR code to Cloudinary if provided
    let refundQrCodeUrl = registration.refundQrCode;
    if (req.files && req.files.refundQrCode) {
      const cloudinary = (await import('cloudinary')).v2;
      const file = req.files.refundQrCode[0];
      
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: 'matchify/refund-qr-codes',
            public_id: `refund_${id}_${Date.now()}`,
            transformation: [{ width: 800, height: 800, crop: 'limit' }]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(file.buffer);
      });
      
      refundQrCodeUrl = result.secure_url;
    }

    // Update registration with refund details
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        refundUpiId: upiId.trim(),
        refundAccountName: accountName.trim(),
        refundQrCode: refundQrCodeUrl,
        refundStatus: 'pending' // Ready for admin to process
      }
    });

    res.json({
      success: true,
      message: 'Refund details submitted successfully',
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Error submitting refund details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit refund details'
    });
  }
});

// DELETE /api/registrations/:id - Cancel registration (legacy - redirect to POST)
router.delete('/:id', upload.single('refundQrCode'), cancelRegistration);

export default router;
