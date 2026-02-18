import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get complete revenue overview
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get all tournament payments
    const payments = await prisma.tournamentPayment.findMany({
      select: {
        totalCollected: true,
        platformFeeAmount: true,
        platformFeePercent: true,
        organizerShare: true,
        payout50Percent1: true,
        payout50Percent2: true,
        payout50Status1: true,
        payout50Status2: true,
        totalRegistrations: true
      }
    });

    // Calculate totals
    const totalCollected = payments.reduce((sum, p) => sum + (p.totalCollected || 0), 0);
    const platformFeesTotal = payments.reduce((sum, p) => sum + (p.platformFeeAmount || 0), 0);
    const organizerShareTotal = payments.reduce((sum, p) => sum + (p.organizerShare || 0), 0);
    
    // Calculate already paid to organizers
    const alreadyPaid = payments.reduce((sum, p) => {
      let paid = 0;
      if (p.payout50Status1 === 'paid') paid += (p.payout50Percent1 || 0);
      if (p.payout50Status2 === 'paid') paid += (p.payout50Percent2 || 0);
      return sum + paid;
    }, 0);
    
    const pendingPayout = organizerShareTotal - alreadyPaid;
    const balanceInHand = totalCollected - alreadyPaid;
    
    // Get stats
    const totalTournaments = await prisma.tournamentPayment.count();
    const totalRegistrations = payments.reduce((sum, p) => sum + (p.totalRegistrations || 0), 0);
    
    const averagePerTournament = totalTournaments > 0 ? totalCollected / totalTournaments : 0;
    const averagePerRegistration = totalRegistrations > 0 ? totalCollected / totalRegistrations : 0;
    
    res.json({
      success: true,
      data: {
        // Your earnings
        platformFees: {
          total: platformFeesTotal,
          percentage: 5,
          description: '5% of all tournament registrations'
        },
        
        // Money flow
        totalCollected: totalCollected,
        organizerShare: organizerShareTotal,
        pendingPayouts: pendingPayout,
        balanceInHand: balanceInHand,
        
        // Breakdown
        breakdown: {
          collected: totalCollected,
          yourShare: platformFeesTotal,
          organizerShare: organizerShareTotal,
          alreadyPaid: alreadyPaid,
          pendingPayout: pendingPayout
        },
        
        // Stats
        stats: {
          tournaments: totalTournaments,
          registrations: totalRegistrations,
          averagePerTournament: averagePerTournament,
          averagePerRegistration: averagePerRegistration
        }
      }
    });
  } catch (error) {
    console.error('Error fetching revenue overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue overview'
    });
  }
});

// Get revenue by tournament (detailed breakdown)
router.get('/by-tournament', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'totalCollected', order = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tournaments = await prisma.tournamentPayment.findMany({
      orderBy: { [sortBy]: order },
      skip,
      take: parseInt(limit)
    });

    const total = await prisma.tournamentPayment.count();

    // Manually fetch tournament details for each
    const formattedData = await Promise.all(tournaments.map(async (tp) => {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tp.tournamentId },
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          startDate: true,
          endDate: true,
          status: true,
          organizerId: true
        }
      });

      const organizer = await prisma.user.findUnique({
        where: { id: tournament.organizerId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      });

      return {
        tournamentId: tp.tournamentId,
        tournamentName: tournament.name,
        location: `${tournament.city}, ${tournament.state}`,
        startDate: tournament.startDate,
        status: tournament.status,
        organizer: organizer,
        
        // Revenue breakdown
        revenue: {
          totalCollected: tp.totalCollected,
          registrations: tp.totalRegistrations,
          averagePerRegistration: tp.totalRegistrations > 0 ? tp.totalCollected / tp.totalRegistrations : 0,
          
          // Your earnings
          platformFee: {
            amount: tp.platformFeeAmount,
            percentage: tp.platformFeePercent
          },
          
          // Organizer share
          organizerShare: {
            total: tp.organizerShare,
            payout50_1: {
              amount: tp.payout50Percent1,
              status: tp.payout50Status1,
              paidAt: tp.payout50PaidAt1
            },
            payout50_2: {
              amount: tp.payout50Percent2,
              status: tp.payout50Status2,
              paidAt: tp.payout50PaidAt2
            },
            totalPaid: (tp.payout50Status1 === 'paid' ? tp.payout50Percent1 : 0) + 
                       (tp.payout50Status2 === 'paid' ? tp.payout50Percent2 : 0),
            pending: tp.organizerShare - 
                     ((tp.payout50Status1 === 'paid' ? tp.payout50Percent1 : 0) + 
                      (tp.payout50Status2 === 'paid' ? tp.payout50Percent2 : 0))
          }
        }
      };
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching revenue by tournament:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue by tournament',
      error: error.message
    });
  }
});

// Get revenue by organizer
router.get('/by-organizer', authenticate, requireAdmin, async (req, res) => {
  try {
    const organizers = await prisma.tournamentPayment.groupBy({
      by: ['organizerId'],
      _sum: {
        totalCollected: true,
        platformFeeAmount: true,
        organizerShare: true,
        payout50Percent1: true,
        payout50Percent2: true
      },
      _count: {
        tournamentId: true
      }
    });

    // Get organizer details
    const organizerIds = organizers.map(o => o.organizerId);
    const organizerDetails = await prisma.user.findMany({
      where: { id: { in: organizerIds } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true
      }
    });

    // Combine data
    const formattedData = organizers.map(org => {
      const details = organizerDetails.find(d => d.id === org.organizerId);
      
      return {
        organizer: details,
        stats: {
          tournamentsOrganized: org._count.tournamentId,
          totalRevenue: org._sum.totalCollected || 0,
          platformFeesGenerated: org._sum.platformFeeAmount || 0,
          organizerEarnings: org._sum.organizerShare || 0,
          paidOut: (org._sum.payout50Percent1 || 0) + (org._sum.payout50Percent2 || 0),
          pending: (org._sum.organizerShare || 0) - 
                   ((org._sum.payout50Percent1 || 0) + (org._sum.payout50Percent2 || 0))
        }
      };
    });

    // Sort by total revenue
    formattedData.sort((a, b) => b.stats.totalRevenue - a.stats.totalRevenue);

    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error fetching revenue by organizer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue by organizer'
    });
  }
});

// Get revenue by location (city/state)
router.get('/by-location', authenticate, requireAdmin, async (req, res) => {
  try {
    const { groupBy = 'city' } = req.query; // 'city' or 'state'

    const tournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        city: true,
        state: true
      }
    });

    const tournamentIds = tournaments.map(t => t.id);
    
    const payments = await prisma.tournamentPayment.findMany({
      where: { tournamentId: { in: tournamentIds } },
      select: {
        tournamentId: true,
        totalCollected: true,
        platformFeeAmount: true,
        totalRegistrations: true
      }
    });

    // Group by location
    const locationMap = new Map();
    
    tournaments.forEach(tournament => {
      const location = groupBy === 'city' ? tournament.city : tournament.state;
      const payment = payments.find(p => p.tournamentId === tournament.id);
      
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          location,
          tournaments: 0,
          totalRevenue: 0,
          platformFees: 0,
          registrations: 0
        });
      }
      
      const data = locationMap.get(location);
      data.tournaments++;
      if (payment) {
        data.totalRevenue += payment.totalCollected;
        data.platformFees += payment.platformFeeAmount;
        data.registrations += payment.totalRegistrations;
      }
    });

    const formattedData = Array.from(locationMap.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    res.json({
      success: true,
      data: formattedData,
      groupBy
    });
  } catch (error) {
    console.error('Error fetching revenue by location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue by location'
    });
  }
});

// Get revenue timeline (daily/weekly/monthly)
router.get('/timeline', authenticate, requireAdmin, async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    // Get all payments with registration details
    const payments = await prisma.paymentVerification.findMany({
      where: { status: 'approved' },
      include: {
        registration: {
          select: {
            tournamentId: true,
            amountTotal: true
          }
        }
      },
      orderBy: { verifiedAt: 'desc' }
    });

    // Get tournament payment info for platform fee percentage
    const tournamentIds = [...new Set(payments.map(p => p.registration.tournamentId))];
    const tournamentPayments = await prisma.tournamentPayment.findMany({
      where: { tournamentId: { in: tournamentIds } },
      select: {
        tournamentId: true,
        platformFeePercent: true
      }
    });

    // Group by period
    const timelineMap = new Map();
    
    payments.forEach(payment => {
      if (!payment.verifiedAt) return;
      
      const date = new Date(payment.verifiedAt);
      let periodKey;
      
      if (period === 'daily') {
        periodKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        periodKey = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!timelineMap.has(periodKey)) {
        timelineMap.set(periodKey, {
          period: periodKey,
          totalCollected: 0,
          platformFees: 0,
          registrations: 0
        });
      }
      
      const data = timelineMap.get(periodKey);
      const amount = payment.amount || 0;
      const tournamentPayment = tournamentPayments.find(tp => tp.tournamentId === payment.registration.tournamentId);
      const platformFeePercent = tournamentPayment?.platformFeePercent || 5;
      const platformFee = amount * (platformFeePercent / 100);
      
      data.totalCollected += amount;
      data.platformFees += platformFee;
      data.registrations += 1;
    });

    const formattedData = Array.from(timelineMap.values())
      .sort((a, b) => b.period.localeCompare(a.period));
    
    res.json({
      success: true,
      data: formattedData,
      period: period
    });
  } catch (error) {
    console.error('Error fetching revenue timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue timeline'
    });
  }
});

// Get individual payment details
router.get('/payments/detailed', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = 'approved' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [payments, total] = await Promise.all([
      prisma.paymentVerification.findMany({
        where: { status },
        include: {
          registration: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  city: true,
                  state: true
                }
              },
              category: {
                select: {
                  name: true,
                  format: true,
                  gender: true
                }
              },
              tournament: {
                select: {
                  id: true,
                  name: true,
                  city: true,
                  state: true,
                  startDate: true,
                  organizer: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { verifiedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.paymentVerification.count({ where: { status } })
    ]);

    // Calculate platform fee for each payment
    const formattedData = await Promise.all(payments.map(async (payment) => {
      const tournamentPayment = await prisma.tournamentPayment.findUnique({
        where: { tournamentId: payment.tournamentId },
        select: { platformFeePercent: true }
      });

      const platformFee = payment.amount * ((tournamentPayment?.platformFeePercent || 5) / 100);
      const organizerShare = payment.amount - platformFee;

      return {
        paymentId: payment.id,
        amount: payment.amount,
        platformFee: platformFee,
        organizerShare: organizerShare,
        
        player: payment.registration.user,
        category: payment.registration.category,
        tournament: payment.registration.tournament,
        
        paymentDate: payment.submittedAt,
        verifiedDate: payment.verifiedAt,
        verifiedBy: payment.verifiedBy,
        
        screenshot: payment.paymentScreenshot
      };
    }));

    res.json({
      success: true,
      data: formattedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching detailed payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed payments'
    });
  }
});

export default router;
