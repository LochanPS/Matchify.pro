import express from 'express';
import multer from 'multer';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { getOrganizerHistory, getCategoryDetails, getCancellationLogs } from '../controllers/tournamentHistory.controller.js';
import { getTournamentRegistrations, getTournamentAnalytics, exportParticipants, approveRegistration, rejectRegistration, removeRegistration, getCancellationRequests, approveRefund, rejectRefund, completeRefund } from '../controllers/organizer.controller.js';

const router = express.Router();

// Configure multer for payment screenshot upload
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

// GET /organizer/payment-details - Get saved payment details
router.get('/payment-details', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await prisma.organizerProfile.findUnique({
      where: { userId },
      select: {
        savedUpiId: true,
        savedAccountHolder: true,
        savedPaymentQRUrl: true,
      }
    });

    if (!profile) {
      return res.json({
        success: true,
        data: { upiId: null, accountHolderName: null, paymentQRUrl: null }
      });
    }

    res.json({
      success: true,
      data: {
        upiId: profile.savedUpiId,
        accountHolderName: profile.savedAccountHolder,
        paymentQRUrl: profile.savedPaymentQRUrl,
      }
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch payment details' });
  }
});

// PUT /organizer/payment-details - Save payment details
router.put('/payment-details', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { upiId, accountHolderName, paymentQRUrl } = req.body;

    const profile = await prisma.organizerProfile.upsert({
      where: { userId },
      update: {
        savedUpiId: upiId || null,
        savedAccountHolder: accountHolderName || null,
        savedPaymentQRUrl: paymentQRUrl || null,
      },
      create: {
        userId,
        savedUpiId: upiId || null,
        savedAccountHolder: accountHolderName || null,
        savedPaymentQRUrl: paymentQRUrl || null,
      }
    });

    res.json({
      success: true,
      message: 'Payment details saved successfully',
      data: {
        upiId: profile.savedUpiId,
        accountHolderName: profile.savedAccountHolder,
        paymentQRUrl: profile.savedPaymentQRUrl,
      }
    });
  } catch (error) {
    console.error('Save payment details error:', error);
    res.status(500).json({ success: false, error: 'Failed to save payment details' });
  }
});

// GET /organizer/dashboard - Dashboard statistics
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const organizerId = req.user.id;

    // Verify user is organizer (support multi-role)
    const userRoles = req.user.roles || [req.user.role];
    const isOrganizer = userRoles.includes('ORGANIZER');
    
    if (!isOrganizer) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Organizer role required.'
      });
    }

    // Total tournaments created
    const totalTournaments = await prisma.tournament.count({
      where: { organizerId }
    });

    // Upcoming tournaments (next 30 days)
    const upcomingTournaments = await prisma.tournament.findMany({
      where: {
        organizerId,
        startDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        },
        status: { in: ['draft', 'published', 'ongoing'] }
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      include: {
        _count: {
          select: { registrations: true }
        }
      }
    });

    // Get ALL registrations for this organizer (not just recent 10)
    const allRegistrations = await prisma.registration.findMany({
      where: {
        tournament: {
          organizerId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, city: true, state: true, profilePhoto: true }
        },
        tournament: {
          select: { id: true, name: true }
        },
        category: {
          select: { name: true, entryFee: true, format: true, gender: true }
        }
      }
    });

    // Revenue stats - count ALL confirmed registrations regardless of payment status
    const confirmedRegistrations = await prisma.registration.findMany({
      where: {
        tournament: {
          organizerId
        },
        status: 'confirmed' // Count all confirmed registrations
      },
      select: {
        amountTotal: true
      }
    });

    const totalRevenue = confirmedRegistrations.reduce((sum, reg) => sum + (reg.amountTotal || 0), 0);

    // Tournament stats breakdown
    const tournamentsByStatus = await prisma.tournament.groupBy({
      by: ['status'],
      where: { organizerId },
      _count: true
    });

    // Total registrations count
    const totalRegistrations = await prisma.registration.count({
      where: {
        tournament: {
          organizerId
        }
      }
    });

    res.json({
      success: true,
      data: {
        total_tournaments: totalTournaments,
        total_registrations: totalRegistrations,
        upcoming_tournaments: upcomingTournaments.map(t => ({
          id: t.id,
          name: t.name,
          start_date: t.startDate,
          end_date: t.endDate,
          city: t.city,
          state: t.state,
          status: t.status,
          registration_count: t._count.registrations
        })),
        recent_registrations: allRegistrations.map(r => ({
          id: r.id,
          player_name: r.user.name,
          player_email: r.user.email,
          player_phone: r.user.phone,
          player_city: r.user.city,
          player_state: r.user.state,
          player_photo: r.user.profilePhoto,
          tournament_id: r.tournament.id,
          tournament_name: r.tournament.name,
          category_name: r.category.name,
          category_format: r.category.format,
          category_gender: r.category.gender,
          amount_paid: r.amountTotal,
          payment_status: r.paymentStatus,
          status: r.status,
          created_at: r.createdAt
        })),
        revenue: {
          type1: 0, // Player → Organizer transactions (not tracked at organizer level)
          type2: 0, // Admin profit (not tracked at organizer level)
          total: totalRevenue,
          currency: 'INR'
        },
        tournaments_by_status: tournamentsByStatus.reduce((acc, stat) => {
          acc[stat.status] = stat._count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics'
    });
  }
});

// Tournament history routes
router.get('/history', authenticate, getOrganizerHistory);
router.get('/categories/:categoryId/details', authenticate, getCategoryDetails);
router.get('/cancellations', authenticate, getCancellationLogs);

// Tournament registrations routes
router.get('/tournaments/:id/registrations', authenticate, getTournamentRegistrations);
router.get('/tournaments/:id/analytics', authenticate, getTournamentAnalytics);
router.get('/tournaments/:id/export', authenticate, exportParticipants);

// Registration management routes
router.get('/registrations/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const registration = await prisma.registration.findUnique({
      where: { id },
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
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true,
            entryFee: true,
          },
        },
        tournament: {
          select: {
            id: true,
            name: true,
            organizerId: true,
            startDate: true,
            city: true,
            state: true,
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

    // Verify organizer owns the tournament
    if (registration.tournament.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this registration',
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
router.put('/registrations/:id/approve', authenticate, approveRegistration);
router.put('/registrations/:id/reject', authenticate, rejectRegistration);
router.delete('/registrations/:id', authenticate, removeRegistration);

// Cancellation/Refund management routes
router.get('/cancellation-requests', authenticate, getCancellationRequests);
router.put('/registrations/:id/approve-refund', authenticate, approveRefund);
router.put('/registrations/:id/reject-refund', authenticate, rejectRefund);
router.put('/registrations/:id/complete-refund', authenticate, upload.single('paymentScreenshot'), completeRefund);

export default router;

// GET /organizer/profile/:id - Get organizer profile
router.get('/profile/:id?', authenticate, async (req, res) => {
  try {
    const organizerId = req.params.id || req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: organizerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        country: true,
        profilePhoto: true,
        isVerifiedOrganizer: true,
        createdAt: true,
        organizerProfile: {
          select: {
            organization: true,
            tournamentsOrganized: true,
            totalRevenue: true,
            rating: true,
            savedUpiId: true,
            savedAccountHolder: true,
            savedPaymentQRUrl: true,
          }
        },
        _count: {
          select: {
            tournamentsOrganized: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Organizer not found' });
    }

    // Get total registrations across all tournaments
    const tournaments = await prisma.tournament.findMany({
      where: { organizerId },
      select: {
        _count: {
          select: {
            registrations: true
          }
        }
      }
    });

    const totalParticipants = tournaments.reduce((sum, t) => sum + t._count.registrations, 0);

    // Get revenue stats
    const payments = await prisma.tournamentPayment.findMany({
      where: {
        tournament: {
          organizerId
        }
      },
      select: {
        totalAmount: true,
        payout50Percent1: true,
        payout50Percent2: true,
        payout50Status1: true,
        payout50Status2: true,
      }
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const paidOut = payments.reduce((sum, p) => {
      let paid = 0;
      if (p.payout50Status1 === 'PAID') paid += p.payout50Percent1 || 0;
      if (p.payout50Status2 === 'PAID') paid += p.payout50Percent2 || 0;
      return sum + paid;
    }, 0);
    const pending = totalRevenue - paidOut;

    res.json({
      success: true,
      profile: {
        ...user,
        organizerProfile: user.organizerProfile || {},
        stats: {
          tournamentsOrganized: user._count.tournamentsOrganized,
          totalParticipants,
          totalRevenue,
          paidOut,
          pendingPayout: pending,
        }
      }
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({ success: false, error: 'Failed to get organizer profile' });
  }
});
