import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get complete revenue overview
router.get('/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get all revenue sources
    const [
      // Platform fees from tournaments
      platformFees,
      
      // Total collected from all tournaments
      totalCollected,
      
      // Pending collections
      pendingPayments,
      
      // Paid out to organizers
      paidToOrganizers50_1,
      paidToOrganizers50_2,
      
      // Tournament count
      tournamentCount,
      
      // Registration count
      registrationCount
    ] = await Promise.all([
      // Platform fees (5% of all collected)
      prisma.tournamentPayment.aggregate({
        _sum: { platformFeeAmount: true },
        where: dateFilter.gte ? { createdAt: dateFilter } : {}
      }),
      
      // Total collected
      prisma.tournamentPayment.aggregate({
        _sum: { totalCollected: true },
        where: dateFilter.gte ? { createdAt: dateFilter } : {}
      }),
      
      // Pending payments (not yet verified)
      prisma.paymentVerification.aggregate({
        _sum: { amount: true },
        where: {
          status: 'pending',
          ...(dateFilter.gte ? { submittedAt: dateFilter } : {})
        }
      }),
      
      // Paid to organizers (First 50%)
      prisma.tournamentPayment.aggregate({
        _sum: { payout50Percent1: true },
        where: {
          payout50Status1: 'paid',
          ...(dateFilter.gte ? { payout50PaidAt1: dateFilter } : {})
        }
      }),
      
      // Paid to organizers (Second 50%)
      prisma.tournamentPayment.aggregate({
        _sum: { payout50Percent2: true },
        where: {
          payout50Status2: 'paid',
          ...(dateFilter.gte ? { payout50PaidAt2: dateFilter } : {})
        }
      }),
      
      // Tournament count
      prisma.tournament.count({
        where: dateFilter.gte ? { createdAt: dateFilter } : {}
      }),
      
      // Registration count
      prisma.registration.count({
        where: {
          status: 'confirmed',
          ...(dateFilter.gte ? { createdAt: dateFilter } : {})
        }
      })
    ]);

    const totalPlatformFees = platformFees._sum.platformFeeAmount || 0;
    const totalCollectedAmount = totalCollected._sum.totalCollected || 0;
    const pendingAmount = pendingPayments._sum.amount || 0;
    const totalPaidOut = (paidToOrganizers50_1._sum.payout50Percent1 || 0) + 
                         (paidToOrganizers50_2._sum.payout50Percent2 || 0);
    const balanceInHand = totalCollectedAmount - totalPaidOut;

    res.json({
      success: true,
      data: {
        // Your earnings
        platformFees: {
          total: totalPlatformFees,
          percentage: 5,
          description: '5% of all tournament registrations'
        },
        
        // Money flow
        totalCollected: totalCollectedAmount,
        pendingVerification: pendingAmount,
        paidToOrganizers: totalPaidOut,
        balanceInHand: balanceInHand,
        
        // Breakdown
        breakdown: {
          collected: totalCollectedAmount,
          yourShare: totalPlatformFees,
          organizerShare: totalCollectedAmount - totalPlatformFees,
          alreadyPaid: totalPaidOut,
          pendingPayout: (totalCollectedAmount - totalPlatformFees) - totalPaidOut
        },
        
        // Stats
        stats: {
          tournaments: tournamentCount,
          registrations: registrationCount,
          averagePerTournament: tournamentCount > 0 ? totalCollectedAmount / tournamentCount : 0,
          averagePerRegistration: registrationCount > 0 ? totalCollectedAmount / registrationCount : 0
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
    const { period = 'daily', startDate, endDate } = req.query;
    
    // Get all payment verifications (approved)
    const payments = await prisma.paymentVerification.findMany({
      where: {
        status: 'approved',
        verifiedAt: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        }
      },
      select: {
        amount: true,
        verifiedAt: true,
        tournamentId: true
      },
      orderBy: { verifiedAt: 'asc' }
    });

    // Get platform fees for each
    const tournamentIds = [...new Set(payments.map(p => p.tournamentId))];
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
      const date = new Date(payment.verifiedAt);
      let key;
      
      if (period === 'daily') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (period === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (period === 'monthly') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!timelineMap.has(key)) {
        timelineMap.set(key, {
          period: key,
          totalCollected: 0,
          platformFees: 0,
          registrations: 0
        });
      }
      
      const data = timelineMap.get(key);
      data.totalCollected += payment.amount;
      data.registrations++;
      
      // Calculate platform fee
      const tp = tournamentPayments.find(t => t.tournamentId === payment.tournamentId);
      if (tp) {
        data.platformFees += payment.amount * (tp.platformFeePercent / 100);
      }
    });

    const formattedData = Array.from(timelineMap.values())
      .sort((a, b) => a.period.localeCompare(b.period));

    res.json({
      success: true,
      data: formattedData,
      period
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
