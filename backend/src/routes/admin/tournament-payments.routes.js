import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all tournament payments
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'totalCollected', order = 'desc' } = req.query;
    
    console.log('📊 Fetching tournament payments...');
    
    const where = {};
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    const orderByField = sortBy || 'totalCollected';
    const orderDirection = order === 'asc' ? 'asc' : 'desc';

    const [payments, total] = await Promise.all([
      prisma.tournamentPayment.findMany({
        where,
        include: {
          tournament: {
            select: {
              id: true,
              name: true,
              city: true,
              state: true,
              startDate: true,
              endDate: true,
              status: true,
              paymentQRUrl: true,
              upiId: true,
              accountHolderName: true,
              organizer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        },
        orderBy: { [orderByField]: orderDirection },
        skip,
        take: parseInt(limit)
      }),
      prisma.tournamentPayment.count({ where })
    ]);

    console.log(`✅ Found ${payments.length} tournament payments`);
    if (payments.length > 0) {
      console.log('📋 First payment:', {
        tournament: payments[0].tournament.name,
        totalCollected: payments[0].totalCollected,
        registrations: payments[0].totalRegistrations
      });
    }

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching tournament payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament payments',
      error: error.message
    });
  }
});

// Get tournament payment by ID
router.get('/:tournamentId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;

    console.log('🔍 Fetching payment for tournament:', tournamentId);

    const payment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            startDate: true,
            endDate: true,
            status: true,
            paymentQRUrl: true,
            upiId: true,
            accountHolderName: true,
            organizer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!payment) {
      console.log('❌ Tournament payment not found');
      return res.status(404).json({
        success: false,
        message: 'Tournament payment not found'
      });
    }

    console.log('✅ Payment found:', payment.tournament.name);

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('❌ Error fetching tournament payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament payment',
      error: error.message
    });
  }
});

// Get payment stats
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    console.log('📊 Fetching payment stats...');

    const [
      totalCollected,
      totalPlatformFees,
      pending50Payouts1,
      pending50Payouts2,
      completedPayouts
    ] = await Promise.all([
      prisma.tournamentPayment.aggregate({
        _sum: { totalCollected: true }
      }),
      prisma.tournamentPayment.aggregate({
        _sum: { platformFeeAmount: true }
      }),
      prisma.tournamentPayment.count({
        where: { payout50Status1: 'pending' }
      }),
      prisma.tournamentPayment.count({
        where: { payout50Status2: 'pending' }
      }),
      prisma.tournamentPayment.count({
        where: {
          AND: [
            { payout50Status1: 'paid' },
            { payout50Status2: 'paid' }
          ]
        }
      })
    ]);

    const stats = {
      totalCollected: totalCollected._sum.totalCollected || 0,
      totalPlatformFees: totalPlatformFees._sum.platformFeeAmount || 0,
      pending50Payouts1,
      pending50Payouts2,
      completedPayouts
    };

    console.log('✅ Stats:', stats);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats',
      error: error.message
    });
  }
});

// Mark first 50% payout as paid
router.post('/:tournamentId/payout-50-1/mark-paid', authenticate, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.userId;

    const payment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Tournament payment not found'
      });
    }

    if (payment.payout50Status1 === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'First 50% payout already marked as paid'
      });
    }

    await prisma.tournamentPayment.update({
      where: { tournamentId },
      data: {
        payout50Status1: 'paid',
        payout50PaidAt1: new Date(),
        payout50PaidBy1: adminId,
        payout50Notes1: notes
      }
    });

    // Send notification to organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true, name: true }
    });

    await prisma.notification.create({
      data: {
        userId: tournament.organizerId,
        type: 'PAYOUT_RECEIVED',
        title: 'Payment Received - First 50%',
        message: `You have received first 50% payout (₹${payment.payout50Percent1.toFixed(2)}) for tournament "${tournament.name}"`,
        data: JSON.stringify({
          tournamentId,
          amount: payment.payout50Percent1,
          percentage: 50,
          installment: 1
        })
      }
    });

    res.json({
      success: true,
      message: 'First 50% payout marked as paid successfully'
    });
  } catch (error) {
    console.error('Error marking first 50% payout as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid'
    });
  }
});

// Mark second 50% payout as paid
router.post('/:tournamentId/payout-50-2/mark-paid', authenticate, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { notes } = req.body;
    const adminId = req.user.userId;

    const payment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Tournament payment not found'
      });
    }

    if (payment.payout50Status2 === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Second 50% payout already marked as paid'
      });
    }

    await prisma.tournamentPayment.update({
      where: { tournamentId },
      data: {
        payout50Status2: 'paid',
        payout50PaidAt2: new Date(),
        payout50PaidBy2: adminId,
        payout50Notes2: notes
      }
    });

    // Send notification to organizer
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true, name: true }
    });

    await prisma.notification.create({
      data: {
        userId: tournament.organizerId,
        type: 'PAYOUT_RECEIVED',
        title: 'Payment Received - Second 50%',
        message: `You have received final 50% payout (₹${payment.payout50Percent2.toFixed(2)}) for tournament "${tournament.name}"`,
        data: JSON.stringify({
          tournamentId,
          amount: payment.payout50Percent2,
          percentage: 50,
          installment: 2
        })
      }
    });

    res.json({
      success: true,
      message: 'Second 50% payout marked as paid successfully'
    });
  } catch (error) {
    console.error('Error marking second 50% payout as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid'
    });
  }
});

// Get pending payouts (for organizer payout page)
router.get('/pending/payouts', authenticate, requireAdmin, async (req, res) => {
  try {
    const { type } = req.query; // '50-1' or '50-2' or 'all'

    console.log('🔍 Fetching pending payouts, type:', type);

    let where = {};
    if (type === '50-1') {
      where.payout50Status1 = 'pending';
    } else if (type === '50-2') {
      where.payout50Status2 = 'pending';
    } else {
      where.OR = [
        { payout50Status1: 'pending' },
        { payout50Status2: 'pending' }
      ];
    }

    const payments = await prisma.tournamentPayment.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Found ${payments.length} pending payouts`);

    // Manually fetch tournament and organizer details
    const enrichedPayments = await Promise.all(
      payments.map(async (payment) => {
        const tournament = await prisma.tournament.findUnique({
          where: { id: payment.tournamentId },
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            startDate: true,
            endDate: true,
            status: true,
            organizerId: true,
            paymentQRUrl: true,
            upiId: true,
            accountHolderName: true
          }
        });

        if (!tournament) {
          console.error('❌ Tournament not found for payment:', payment.tournamentId);
          return null;
        }

        const organizer = await prisma.user.findUnique({
          where: { id: tournament.organizerId },
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        });

        if (!organizer) {
          console.error('❌ Organizer not found for tournament:', tournament.id);
          return null;
        }

        return {
          ...payment,
          tournament: {
            ...tournament,
            organizer
          },
          organizerUpiId: tournament.upiId,
          organizerAccountHolder: tournament.accountHolderName
        };
      })
    );

    // Filter out null entries (tournaments/organizers not found)
    const validPayments = enrichedPayments.filter(p => p !== null);

    console.log(`✅ Returning ${validPayments.length} valid payouts`);
    if (validPayments.length > 0) {
      console.log('📋 First payout:', {
        tournament: validPayments[0].tournament.name,
        organizer: validPayments[0].tournament.organizer.name,
        amount: validPayments[0].totalCollected
      });
    }

    res.json({
      success: true,
      data: validPayments
    });
  } catch (error) {
    console.error('❌ Error fetching pending payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payouts',
      error: error.message
    });
  }
});

export default router;
