import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

// Get organizer's tournament history
export const getOrganizerHistory = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { status, startDate, endDate, page = 1, limit = 10 } = req.query;

    const filters = {
      organizerId,
    };

    // Status filter
    if (status) {
      filters.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filters.startDate = {};
      if (startDate) filters.startDate.gte = new Date(startDate);
      if (endDate) filters.startDate.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where: filters,
        include: {
          categories: {
            include: {
              _count: {
                select: { registrations: true }
              }
            }
          },
          registrations: {
            where: { paymentStatus: 'completed' }
          },
          _count: {
            select: {
              registrations: true,
              matches: true
            }
          }
        },
        orderBy: { startDate: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.tournament.count({ where: filters })
    ]);

    // Calculate stats for each tournament
    const tournamentsWithStats = tournaments.map(tournament => {
      const totalRevenue = tournament.registrations.reduce((sum, reg) => {
        return sum + (reg.amountTotal || 0);
      }, 0);

      const totalParticipants = tournament._count.registrations;

      return {
        id: tournament.id,
        name: tournament.name,
        location: `${tournament.city}, ${tournament.state}`,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        status: tournament.status,
        categoriesCount: tournament.categories.length,
        totalParticipants,
        totalMatches: tournament._count.matches,
        totalRevenue,
        categories: tournament.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          format: cat.format,
          participantCount: cat._count.registrations
        }))
      };
    });

    res.json({
      success: true,
      data: {
        tournaments: tournamentsWithStats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get organizer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament history'
    });
  }
};

// Get category details with winners and participants
export const getCategoryDetails = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user.id;

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            organizerId: true,
            status: true
          }
        },
        registrations: {
          where: { status: 'confirmed' },
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
            partner: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        matches: {
          where: { status: 'COMPLETED' },
          orderBy: { round: 'desc' }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Verify organizer owns this tournament
    if (category.tournament.organizerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Find winner (last completed match - highest round)
    const finalMatch = category.matches[0];
    let winner = null;

    if (finalMatch && finalMatch.winnerId) {
      // For now, just indicate there's a winner
      // In a real implementation, you'd fetch the winner details
      winner = { id: finalMatch.winnerId, name: 'Winner' };
    }

    res.json({
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          format: category.format,
          entryFee: category.entryFee,
          maxParticipants: category.maxParticipants,
          tournament: category.tournament
        },
        winner,
        participants: category.registrations.map(reg => ({
          id: reg.id,
          player: reg.user,
          partner: reg.partner,
          registeredAt: reg.createdAt,
          seed: null // Add seed logic if implemented
        })),
        stats: {
          totalParticipants: category.registrations.length,
          totalMatches: category.matches.length,
          completedMatches: category.matches.filter(m => m.status === 'COMPLETED').length
        }
      }
    });
  } catch (error) {
    console.error('Get category details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category details'
    });
  }
};

// Get cancellation logs for organizer
export const getCancellationLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.tournament.findMany({
        where: {
          organizerId: userId,
          status: 'cancelled'
        },
        include: {
          registrations: {
            where: { refundStatus: { not: null } },
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.tournament.count({
        where: {
          organizerId: userId,
          status: 'cancelled'
        }
      })
    ]);

    const logsWithRefunds = logs.map(tournament => {
      const totalRefunds = tournament.registrations.reduce((sum, reg) => {
        return sum + (reg.refundAmount || 0);
      }, 0);

      return {
        id: tournament.id,
        name: tournament.name,
        cancelledAt: tournament.updatedAt,
        cancelReason: tournament.suspensionReason || 'No reason provided',
        totalRefunds,
        refundedParticipants: tournament.registrations.length,
        refunds: tournament.registrations.map(reg => ({
          participant: reg.user.name,
          email: reg.user.email,
          amount: reg.refundAmount,
          status: reg.refundStatus,
          refundedAt: reg.cancelledAt
        }))
      };
    });

    res.json({
      success: true,
      data: {
        logs: logsWithRefunds,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get cancellation logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cancellation logs'
    });
  }
};
