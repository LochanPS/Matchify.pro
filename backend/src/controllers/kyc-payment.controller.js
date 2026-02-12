import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG and PNG are allowed.'));
    }
  }
});

export { upload };

/**
 * Submit KYC Payment
 * POST /api/kyc/payment
 */
export const submitKYCPayment = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { transactionId, amount } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Payment screenshot is required'
      });
    }

    if (!transactionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID and amount are required'
      });
    }

    if (parseFloat(amount) !== 50) {
      return res.status(400).json({
        success: false,
        message: 'KYC payment amount must be ₹50'
      });
    }

    // Check if payment already exists
    const existingPayment = await prisma.kYCPayment.findUnique({
      where: { organizerId }
    });

    if (existingPayment && existingPayment.status === 'VERIFIED') {
      return res.status(400).json({
        success: false,
        message: 'KYC payment already verified'
      });
    }

    // Upload screenshot to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'kyc/payments',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Create or update payment record
    const payment = await prisma.kYCPayment.upsert({
      where: { organizerId },
      update: {
        transactionId,
        amount: parseFloat(amount),
        screenshotUrl: result.secure_url,
        status: 'PENDING',
        submittedAt: new Date()
      },
      create: {
        organizerId,
        transactionId,
        amount: parseFloat(amount),
        screenshotUrl: result.secure_url,
        status: 'PENDING'
      }
    });

    res.json({
      success: true,
      message: 'Payment submitted successfully. You can now proceed with KYC verification.',
      payment: {
        id: payment.id,
        status: payment.status
      }
    });
  } catch (error) {
    console.error('KYC payment submission error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit payment',
      error: error.message
    });
  }
};

/**
 * Check KYC Payment Status
 * GET /api/kyc/payment/status
 */
export const getKYCPaymentStatus = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const payment = await prisma.kYCPayment.findUnique({
      where: { organizerId }
    });

    if (!payment) {
      return res.json({
        success: true,
        hasPaid: false,
        status: null
      });
    }

    res.json({
      success: true,
      hasPaid: payment.status === 'VERIFIED' || payment.status === 'PENDING',
      status: payment.status,
      payment: {
        id: payment.id,
        amount: payment.amount,
        transactionId: payment.transactionId,
        submittedAt: payment.submittedAt,
        verifiedAt: payment.verifiedAt
      }
    });
  } catch (error) {
    console.error('Get KYC payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

/**
 * Admin: Get All KYC Payments
 * GET /api/admin/kyc/payments
 */
export const getAllKYCPayments = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { status } = req.query;

    const where = {};
    if (status) {
      where.status = status;
    }

    const payments = await prisma.kYCPayment.findMany({
      where,
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Get all KYC payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

/**
 * Admin: Verify KYC Payment
 * POST /api/admin/kyc/payments/:id/verify
 */
export const verifyKYCPayment = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;
    const adminId = req.user.id;

    const payment = await prisma.kYCPayment.update({
      where: { id },
      data: {
        status: 'VERIFIED',
        verifiedBy: adminId,
        verifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment
    });
  } catch (error) {
    console.error('Verify KYC payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * Admin: Reject KYC Payment
 * POST /api/admin/kyc/payments/:id/reject
 */
export const rejectKYCPayment = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.roles || !req.user.roles.includes('ADMIN')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const payment = await prisma.kYCPayment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    res.json({
      success: true,
      message: 'Payment rejected',
      payment
    });
  } catch (error) {
    console.error('Reject KYC payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment',
      error: error.message
    });
  }
};
