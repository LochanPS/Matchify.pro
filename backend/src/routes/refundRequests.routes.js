import express from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /admin/refund-requests - Get all refund requests
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query; // 'pending' or 'processed'

    const where = {
      OR: [
        { status: 'rejected', refundStatus: status === 'processed' ? 'completed' : 'pending' },
        { status: 'cancellation_requested', refundStatus: status === 'processed' ? 'completed' : 'pending' }
      ]
    };

    const refundRequests = await prisma.registration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        tournament: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            startDate: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true
          }
        }
      },
      orderBy: {
        refundRequestedAt: 'desc'
      }
    });

    // Map to include refund reason
    const mappedRequests = refundRequests.map(reg => ({
      id: reg.id,
      user: reg.user,
      tournament: reg.tournament,
      category: reg.category,
      paymentScreenshot: reg.paymentScreenshot,
      refundQrCode: reg.refundQrCode,
      refundUpiId: reg.refundUpiId,
      refundAccountName: reg.refundAccountName || reg.user.name,
      refundAmount: reg.refundAmount || reg.amountTotal,
      refundStatus: reg.refundStatus,
      refundReason: reg.status === 'rejected' ? 'REJECTED' : 'WITHDRAWAL',
      rejectionReason: reg.cancellationReason, // This could be rejection reason from admin
      cancellationReason: reg.cancellationReason, // User's cancellation reason
      refundRequestedAt: reg.refundRequestedAt,
      refundProcessedAt: reg.refundProcessedAt,
      createdAt: reg.createdAt
    }));

    res.json({
      success: true,
      refundRequests: mappedRequests
    });
  } catch (error) {
    console.error('Error fetching refund requests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch refund requests'
    });
  }
});

// POST /admin/refund-requests/:id/process - Mark refund as processed
router.post('/:id/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Find the registration
    const registration = await prisma.registration.findUnique({
      where: { id },
      include: {
        tournament: true,
        user: true
      }
    });

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Update registration status
    const updatedRegistration = await prisma.registration.update({
      where: { id },
      data: {
        refundStatus: 'completed',
        refundProcessedAt: new Date(),
        status: 'cancelled' // Final status after refund
      }
    });

    // Update tournament revenue (subtract refund amount)
    const refundAmount = registration.refundAmount || registration.amountTotal;
    
    await prisma.tournament.update({
      where: { id: registration.tournamentId },
      data: {
        totalRevenue: {
          decrement: refundAmount
        }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: registration.userId,
        type: 'REFUND_PROCESSED',
        title: '✅ Refund Processed',
        message: `Your refund of ₹${refundAmount} for "${registration.tournament.name}" has been processed. Please check your UPI account.`,
        data: JSON.stringify({
          registrationId: registration.id,
          tournamentId: registration.tournamentId,
          amount: refundAmount
        })
      }
    });

    res.json({
      success: true,
      message: 'Refund marked as processed',
      registration: updatedRegistration
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process refund'
    });
  }
});

export default router;
