import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { getOrganizerHistory, getCategoryDetails, getCancellationLogs } from '../controllers/tournamentHistory.controller.js';
import { getTournamentRegistrations, getTournamentAnalytics, exportParticipants, approveRegistration, rejectRegistration, removeRegistration } from '../controllers/organizer.controller.js';

const router = express.Router();
const prisma = new PrismaClient();

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

    // Revenue stats
    const revenueStats = await prisma.registration.groupBy({
      by: ['tournamentId'],
      where: {
        tournament: {
          organizerId
        },
        paymentStatus: 'completed'
      },
      _sum: {
        amountTotal: true
      }
    });

    const totalRevenue = revenueStats.reduce((sum, stat) => sum + (stat._sum.amountTotal || 0), 0);

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
router.put('/registrations/:id/approve', authenticate, approveRegistration);
router.put('/registrations/:id/reject', authenticate, rejectRegistration);
router.delete('/registrations/:id', authenticate, removeRegistration);

export default router;
