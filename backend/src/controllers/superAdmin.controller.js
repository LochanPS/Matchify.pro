import { PrismaClient } from '@prisma/client';
import prisma from '../lib/prisma.js';

// Get dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTournaments,
      totalRegistrations,
      totalMatches,
      activeUsers,
      blockedUsers,
      pendingRegistrations,
      completedTournaments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.tournament.count(),
      prisma.registration.count(),
      prisma.match.count(),
      prisma.user.count({ where: { isActive: true, isSuspended: false } }),
      prisma.user.count({ where: { isSuspended: true } }),
      prisma.registration.count({ where: { status: 'pending' } }),
      prisma.tournament.count({ where: { status: 'completed' } })
    ]);

    // Revenue Type 1: Player → Organizer transactions (tournament fees)
    const revenueType1Result = await prisma.walletTransaction.aggregate({
      where: {
        type: 'DEBIT',
        description: { contains: 'tournament registration' }
      },
      _sum: { amount: true }
    });

    // Revenue Type 2: Admin Profit (KYC fees at ₹50 each)
    const approvedKYCCount = await prisma.organizerKYC.count({
      where: { status: 'APPROVED' }
    }).catch(() => 0); // Handle if KYC table doesn't exist

    const revenueType1 = revenueType1Result._sum.amount || 0;
    const revenueType2 = approvedKYCCount * 50;
    const totalRevenue = revenueType1 + revenueType2;

    res.json({
      stats: {
        totalUsers,
        totalTournaments,
        totalRegistrations,
        totalMatches,
        activeUsers,
        blockedUsers,
        pendingRegistrations,
        completedTournaments,
        revenue: {
          type1: revenueType1,
          type2: revenueType2,
          total: totalRevenue
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

// Get all users with pagination and search
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    if (status === 'active') {
      where.isSuspended = false;
      where.isActive = true;
    } else if (status === 'blocked') {
      where.isSuspended = true;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          roles: true,
          profilePhoto: true,
          city: true,
          state: true,
          isActive: true,
          isSuspended: true,
          walletBalance: true,
          totalPoints: true,
          tournamentsPlayed: true,
          matchesWon: true,
          matchesLost: true,
          createdAt: true,
          _count: {
            select: {
              registrations: true,
              tournaments: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get single user details
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        registrations: {
          include: {
            tournament: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        tournaments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            city: true
          }
        },
        walletTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

// Block/Suspend a user
export const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    console.log('🚫 Blocking user:', { userId, reason });

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: true,
        suspensionReason: reason || 'Violation of Matchify.pro terms of service'
      }
    });

    // Create a notification for the banned user
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'ACCOUNT_SUSPENDED',
        title: 'Account Suspended',
        message: `Your Matchify.pro account has been suspended. Reason: ${reason || 'Violation of terms of service'}. If you believe this is a mistake, please contact support.`,
        data: JSON.stringify({
          reason: reason || 'Violation of terms of service',
          suspendedAt: new Date().toISOString()
        })
      }
    });

    console.log('✅ User blocked successfully:', user.email);

    res.json({ 
      success: true,
      message: 'User blocked successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuspended: user.isSuspended,
        suspensionReason: user.suspensionReason
      }
    });
  } catch (error) {
    console.error('❌ Error blocking user:', error);
    res.status(500).json({ success: false, error: 'Failed to block user', details: error.message });
  }
};

// Unblock a user
export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('✅ Unblocking user:', userId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isSuspended: false,
        suspensionReason: null
      }
    });

    // Create a notification for the unblocked user
    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'ACCOUNT_REINSTATED',
        title: 'Account Reinstated',
        message: 'Your Matchify.pro account has been reinstated. You can now access all features again. Welcome back!',
        data: JSON.stringify({
          reinstatedAt: new Date().toISOString()
        })
      }
    });

    console.log('✅ User unblocked successfully:', user.email);

    res.json({ 
      success: true,
      message: 'User unblocked successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isSuspended: user.isSuspended
      }
    });
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    res.status(500).json({ success: false, error: 'Failed to unblock user', details: error.message });
  }
};

// Get all tournaments with pagination
export const getAllTournaments = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { venue: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: {
              registrations: true,
              categories: true
            }
          }
        }
      }),
      prisma.tournament.count({ where })
    ]);

    res.json({
      tournaments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
};

// Get tournament details
export const getTournamentDetails = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        organizer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        categories: {
          include: {
            _count: { select: { registrations: true } }
          }
        },
        registrations: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            category: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json({ tournament });
  } catch (error) {
    console.error('Error fetching tournament details:', error);
    res.status(500).json({ error: 'Failed to fetch tournament details' });
  }
};

// Update tournament status
export const updateTournamentStatus = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'published', 'ongoing', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status }
    });

    res.json({ 
      message: 'Tournament status updated',
      tournament
    });
  } catch (error) {
    console.error('Error updating tournament status:', error);
    res.status(500).json({ error: 'Failed to update tournament status' });
  }
};

// Delete tournament
export const deleteTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Delete related records first
    await prisma.registration.deleteMany({ where: { tournamentId } });
    await prisma.match.deleteMany({ where: { tournamentId } });
    await prisma.category.deleteMany({ where: { tournamentId } });
    
    await prisma.tournament.delete({ where: { id: tournamentId } });

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: 'Failed to delete tournament' });
  }
};

// Get all registrations
export const getAllRegistrations = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) {
      where.status = status;
    }

    const [registrations, total] = await Promise.all([
      prisma.registration.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          tournament: { select: { id: true, name: true } },
          category: { select: { id: true, name: true } }
        }
      }),
      prisma.registration.count({ where })
    ]);

    res.json({
      registrations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
};

// Update user wallet balance
export const updateUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, type, description } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = user.walletBalance || 0;
    const newBalance = type === 'credit' 
      ? currentBalance + parseFloat(amount)
      : currentBalance - parseFloat(amount);

    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient balance for debit' });
    }

    // Update user balance
    await prisma.user.update({
      where: { id: userId },
      data: { walletBalance: newBalance }
    });

    // Create transaction record
    await prisma.walletTransaction.create({
      data: {
        userId,
        type: type === 'credit' ? 'ADMIN_CREDIT' : 'ADMIN_DEBIT',
        amount: type === 'credit' ? parseFloat(amount) : -parseFloat(amount),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        description: description || `Admin ${type}`,
        status: 'COMPLETED'
      }
    });

    res.json({ 
      message: `Wallet ${type} successful`,
      newBalance
    });
  } catch (error) {
    console.error('Error updating wallet:', error);
    res.status(500).json({ error: 'Failed to update wallet' });
  }
};
