import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all payment verifications (with filters)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, tournamentId, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (tournamentId) where.tournamentId = tournamentId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [verifications, total] = await Promise.all([
      prisma.paymentVerification.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.paymentVerification.count({ where })
    ]);

    // Manually fetch related data for each verification
    const enrichedVerifications = await Promise.all(
      verifications.map(async (verification) => {
        const registration = await prisma.registration.findUnique({
          where: { id: verification.registrationId },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                format: true
              }
            },
            tournament: {
              select: {
                id: true,
                name: true,
                startDate: true
              }
            }
          }
        });

        return {
          ...verification,
          registration
        };
      })
    );

    res.json({
      success: true,
      data: enrichedVerifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching payment verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment verifications',
      error: error.message
    });
  }
});

// Get payment verification stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const [pending, approved, rejected, totalAmount] = await Promise.all([
      prisma.paymentVerification.count({ where: { status: 'pending' } }),
      prisma.paymentVerification.count({ where: { status: 'approved' } }),
      prisma.paymentVerification.count({ where: { status: 'rejected' } }),
      prisma.paymentVerification.aggregate({
        where: { status: 'approved' },
        _sum: { amount: true }
      })
    ]);

    res.json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        totalAmountCollected: totalAmount._sum.amount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats'
    });
  }
});

// Approve payment
router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const verification = await prisma.paymentVerification.findUnique({
      where: { id },
      include: { registration: true }
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Payment verification not found'
      });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Update verification status
    await prisma.paymentVerification.update({
      where: { id },
      data: {
        status: 'approved',
        verifiedBy: adminId,
        verifiedAt: new Date()
      }
    });

    // Update registration status
    await prisma.registration.update({
      where: { id: verification.registrationId },
      data: {
        paymentStatus: 'verified',
        status: 'confirmed'
      }
    });

    // Update tournament payment tracking
    await updateTournamentPayment(verification.tournamentId, verification.amount);

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: verification.userId,
        type: 'PAYMENT_APPROVED',
        title: 'Payment Approved',
        message: 'Your payment has been verified. Registration confirmed!',
        data: JSON.stringify({
          registrationId: verification.registrationId,
          tournamentId: verification.tournamentId
        })
      }
    });

    res.json({
      success: true,
      message: 'Payment approved successfully'
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment'
    });
  }
});

// Reject payment
router.post('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.userId;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const verification = await prisma.paymentVerification.findUnique({
      where: { id }
    });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Payment verification not found'
      });
    }

    if (verification.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Payment already processed'
      });
    }

    // Update verification status
    await prisma.paymentVerification.update({
      where: { id },
      data: {
        status: 'rejected',
        verifiedBy: adminId,
        verifiedAt: new Date(),
        rejectionReason: reason
      }
    });

    // Update registration status
    await prisma.registration.update({
      where: { id: verification.registrationId },
      data: {
        paymentStatus: 'rejected',
        status: 'cancelled'
      }
    });

    // Send notification to user
    await prisma.notification.create({
      data: {
        userId: verification.userId,
        type: 'PAYMENT_REJECTED',
        title: 'Payment Rejected',
        message: `Your payment was rejected. Reason: ${reason}`,
        data: JSON.stringify({
          registrationId: verification.registrationId,
          tournamentId: verification.tournamentId,
          reason
        })
      }
    });

    res.json({
      success: true,
      message: 'Payment rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
});

// Helper function to update tournament payment tracking
async function updateTournamentPayment(tournamentId, amount) {
  const tournamentPayment = await prisma.tournamentPayment.findUnique({
    where: { tournamentId }
  });

  if (!tournamentPayment) {
    return;
  }

  const totalCollected = tournamentPayment.totalCollected + amount;
  const platformFeeAmount = totalCollected * (tournamentPayment.platformFeePercent / 100);
  const organizerShare = totalCollected - platformFeeAmount;
  const payout50Percent1 = organizerShare * 0.5; // First 50%
  const payout50Percent2 = organizerShare * 0.5; // Second 50%

  await prisma.tournamentPayment.update({
    where: { tournamentId },
    data: {
      totalCollected,
      totalRegistrations: { increment: 1 },
      platformFeeAmount,
      organizerShare,
      payout50Percent1,
      payout50Percent2
    }
  });
}

export default router;
