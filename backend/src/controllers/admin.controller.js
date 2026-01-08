import { PrismaClient } from '@prisma/client';
import AuditLogService from '../services/auditLog.service.js';

const prisma = new PrismaClient();

class AdminController {
  /**
   * GET /admin/users - List all users with filters
   */
  static async getUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        search, // email, name, phone
        role,
        status, // ACTIVE, SUSPENDED
        city,
        state,
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};

      // Search filter
      if (search) {
        where.OR = [
          { email: { contains: search } },
          { name: { contains: search } },
          { phone: { contains: search } },
        ];
      }

      // Role filter
      if (role) where.role = role;

      // Status filter
      if (status) {
        if (status === 'SUSPENDED') {
          where.suspendedUntil = { gt: new Date() };
        } else if (status === 'ACTIVE') {
          where.OR = [
            { suspendedUntil: null },
            { suspendedUntil: { lte: new Date() } },
          ];
        }
      }

      // Location filters
      if (city) where.city = { contains: city };
      if (state) where.state = { contains: state };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            city: true,
            state: true,
            createdAt: true,
            suspendedUntil: true,
            suspensionReason: true,
            _count: {
              select: {
                registrations: true,
                tournaments: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.user.count({ where }),
      ]);

      // Add isSuspended flag
      const usersWithStatus = users.map(user => ({
        ...user,
        isSuspended: user.suspendedUntil && new Date(user.suspendedUntil) > new Date(),
      }));

      res.json({
        success: true,
        users: usersWithStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch users',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/users/:id - Get single user details with activity
   */
  static async getUserDetails(req, res) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findUnique({
        where: { id },
        include: {
          registrations: {
            include: {
              tournament: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  city: true,
                },
              },
              category: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          tournaments: {
            select: {
              id: true,
              name: true,
              startDate: true,
              status: true,
              _count: {
                select: { registrations: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          walletTransactions: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Check if currently suspended
      user.isSuspended = user.suspendedUntil && new Date(user.suspendedUntil) > new Date();

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error('Get user details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user details',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/users/:id/suspend - Suspend a user
   */
  static async suspendUser(req, res) {
    try {
      const { id } = req.params;
      const { reason, durationDays } = req.body;
      const adminId = req.user.id;

      // Validation
      if (!reason || !durationDays) {
        return res.status(400).json({
          success: false,
          message: 'Reason and duration are required',
        });
      }

      if (durationDays < 1 || durationDays > 365) {
        return res.status(400).json({
          success: false,
          message: 'Duration must be between 1 and 365 days',
        });
      }

      // Check user exists
      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Cannot suspend admins
      if (user.role === 'ADMIN') {
        return res.status(403).json({
          success: false,
          message: 'Cannot suspend admin users',
        });
      }

      // Calculate suspension end date
      const suspendedUntil = new Date();
      suspendedUntil.setDate(suspendedUntil.getDate() + parseInt(durationDays));

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          suspendedUntil,
          suspensionReason: reason,
        },
      });

      // Log the action
      await AuditLogService.log({
        adminId,
        action: 'USER_SUSPEND',
        entityType: 'USER',
        entityId: id,
        details: {
          reason,
          durationDays: parseInt(durationDays),
          suspendedUntil,
          userEmail: user.email,
          userName: user.name,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        message: 'User suspended successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          suspendedUntil: updatedUser.suspendedUntil,
          suspensionReason: updatedUser.suspensionReason,
        },
      });
    } catch (error) {
      console.error('Suspend user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to suspend user',
        error: error.message,
      });
    }
  }

  /**
   * POST /admin/users/:id/unsuspend - Unsuspend a user
   */
  static async unsuspendUser(req, res) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          suspendedUntil: null,
          suspensionReason: null,
        },
      });

      // Log the action
      await AuditLogService.log({
        adminId,
        action: 'USER_UNSUSPEND',
        entityType: 'USER',
        entityId: id,
        details: {
          userEmail: user.email,
          userName: user.name,
          previousSuspensionReason: user.suspensionReason,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        message: 'User unsuspended successfully',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
        },
      });
    } catch (error) {
      console.error('Unsuspend user error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to unsuspend user',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/tournaments - Get all tournaments with filters
   */
  static async getTournaments(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        organizerId,
        search,
      } = req.query;

      const skip = (page - 1) * limit;

      const where = {};
      if (status) where.status = status;
      if (organizerId) where.organizerId = organizerId;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { city: { contains: search } },
        ];
      }

      const [tournaments, total] = await Promise.all([
        prisma.tournament.findMany({
          where,
          include: {
            organizer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                registrations: true,
                categories: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: parseInt(limit),
        }),
        prisma.tournament.count({ where }),
      ]);

      res.json({
        success: true,
        tournaments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error('Get tournaments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tournaments',
        error: error.message,
      });
    }
  }

  /**
   * DELETE /admin/tournaments/:id - Emergency cancel tournament
   */
  static async cancelTournament(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Cancellation reason is required',
        });
      }

      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            include: {
              user: true,
              category: true,
            },
          },
        },
      });

      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found',
        });
      }

      if (tournament.status === 'CANCELLED') {
        return res.status(400).json({
          success: false,
          message: 'Tournament is already cancelled',
        });
      }

      // Process refunds
      const refundPromises = tournament.registrations.map(async (reg) => {
        // Get user's current balance
        const user = await prisma.user.findUnique({
          where: { id: reg.userId },
          select: { walletBalance: true },
        });

        // Create wallet transaction
        await prisma.walletTransaction.create({
          data: {
            userId: reg.userId,
            amount: reg.amountTotal,
            type: 'CREDIT',
            balanceBefore: user.walletBalance,
            balanceAfter: user.walletBalance + reg.amountTotal,
            status: 'COMPLETED',
            description: `Refund for ${tournament.name} - ${reg.category.name} (Admin Cancellation)`,
          },
        });

        // Update user balance
        await prisma.user.update({
          where: { id: reg.userId },
          data: {
            walletBalance: {
              increment: reg.amountTotal,
            },
          },
        });

        return reg;
      });

      await Promise.all(refundPromises);

      // Update tournament status
      const updatedTournament = await prisma.tournament.update({
        where: { id },
        data: {
          status: 'CANCELLED',
        },
      });

      // Log the action
      await AuditLogService.log({
        adminId,
        action: 'TOURNAMENT_CANCEL',
        entityType: 'TOURNAMENT',
        entityId: id,
        details: {
          reason,
          tournamentName: tournament.name,
          organizerId: tournament.organizerId,
          registrationsRefunded: tournament.registrations.length,
          totalRefundAmount: tournament.registrations.reduce((sum, reg) => sum + reg.amountTotal, 0),
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });

      res.json({
        success: true,
        message: 'Tournament cancelled successfully',
        refundsProcessed: tournament.registrations.length,
      });
    } catch (error) {
      console.error('Cancel tournament error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel tournament',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/stats - Get platform statistics
   */
  static async getStats(req, res) {
    try {
      const { startDate, endDate } = req.query;

      const dateFilter = {};
      if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
      }

      const [
        totalUsers,
        totalTournaments,
        totalRegistrations,
        totalMatches,
        totalRevenue,
        usersByRole,
        tournamentsByStatus,
        recentRegistrations,
      ] = await Promise.all([
        // Total users
        prisma.user.count({ where: dateFilter }),

        // Total tournaments
        prisma.tournament.count({ where: dateFilter }),

        // Total registrations
        prisma.registration.count({
          where: {
            ...dateFilter,
            status: 'CONFIRMED',
          },
        }),

        // Total matches
        prisma.match.count({ where: dateFilter }),

        // Total revenue
        prisma.walletTransaction.aggregate({
          where: {
            ...dateFilter,
            type: 'DEBIT',
            status: 'COMPLETED',
          },
          _sum: {
            amount: true,
          },
        }),

        // Users by role
        prisma.user.groupBy({
          by: ['role'],
          where: dateFilter,
          _count: true,
        }),

        // Tournaments by status
        prisma.tournament.groupBy({
          by: ['status'],
          where: dateFilter,
          _count: true,
        }),

        // Recent registrations (last 10)
        prisma.registration.findMany({
          where: {
            ...dateFilter,
            status: 'CONFIRMED',
          },
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            tournament: {
              select: {
                name: true,
              },
            },
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalTournaments,
          totalRegistrations,
          totalMatches,
          totalRevenue: totalRevenue._sum.amount || 0,
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count;
            return acc;
          }, {}),
          tournamentsByStatus: tournamentsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {}),
          recentActivity: recentRegistrations,
        },
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/audit-logs - Get all audit logs
   */
  static async getAuditLogs(req, res) {
    try {
      const { page, limit, action, entityType, adminId, startDate, endDate } = req.query;

      const result = await AuditLogService.getAll({
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 50,
        action,
        entityType,
        adminId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/audit-logs/:entityType/:entityId - Get logs for specific entity
   */
  static async getEntityAuditLogs(req, res) {
    try {
      const { entityType, entityId } = req.params;

      const logs = await AuditLogService.getByEntity(entityType, entityId);

      res.json({
        success: true,
        logs,
      });
    } catch (error) {
      console.error('Get entity audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch entity audit logs',
        error: error.message,
      });
    }
  }

  /**
   * GET /admin/audit-logs/export - Export audit logs as CSV
   */
  static async exportAuditLogs(req, res) {
    try {
      const { action, entityType, adminId, startDate, endDate } = req.query;

      const result = await AuditLogService.getAll({
        page: 1,
        limit: 10000, // Get all logs for export
        action,
        entityType,
        adminId,
        startDate,
        endDate,
      });

      // Convert to CSV
      const csvHeader = 'Timestamp,Admin Name,Admin Email,Action,Entity Type,Entity ID,IP Address,User Agent,Details\n';
      const csvRows = result.logs.map(log => {
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
        const userAgent = (log.userAgent || '').replace(/"/g, '""');
        return `"${log.createdAt}","${log.admin.name}","${log.admin.email}","${log.action}","${log.entityType || ''}","${log.entityId || ''}","${log.ipAddress || ''}","${userAgent}","${details}"`;
      }).join('\n');

      const csv = csvHeader + csvRows;

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      res.send(csv);

      // Log this export action
      await AuditLogService.log({
        adminId: req.user.id,
        action: 'AUDIT_LOG_EXPORTED',
        entityType: 'AUDIT_LOG',
        entityId: null,
        details: {
          filters: { action, entityType, adminId, startDate, endDate },
          recordCount: result.logs.length,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    } catch (error) {
      console.error('Export audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export audit logs',
        error: error.message,
      });
    }
  }
}

export default AdminController;
