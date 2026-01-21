import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../../middleware/auth.js';
import { 
  protectTournamentCancellation, 
  logTournamentStatusChange, 
  handleTournamentCancellation 
} from '../../middleware/tournamentProtection.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get tournament cancellation risk assessment
router.get('/:tournamentId/cancellation-risk', authenticate, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: 'confirmed' },
          select: { 
            id: true, 
            amountTotal: true,
            createdAt: true,
            user: {
              select: { name: true, email: true }
            }
          }
        },
        organizer: {
          select: { name: true, email: true }
        },
        categories: {
          select: { name: true, registrationCount: true }
        }
      }
    });
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    const confirmedRegistrations = tournament.registrations.length;
    const totalRevenue = tournament.registrations.reduce((sum, reg) => sum + (reg.amountTotal || 0), 0);
    const averageRegistrationValue = confirmedRegistrations > 0 ? totalRevenue / confirmedRegistrations : 0;
    
    // Calculate risk factors
    const riskFactors = {
      highRegistrationCount: confirmedRegistrations >= 50,
      significantRevenue: totalRevenue >= 10000,
      tournamentStarted: tournament.status === 'ongoing',
      recentRegistrations: tournament.registrations.filter(r => 
        new Date(r.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length > 0
    };
    
    const riskScore = Object.values(riskFactors).filter(Boolean).length;
    const riskLevel = riskScore >= 3 ? 'CRITICAL' : riskScore >= 2 ? 'HIGH' : riskScore >= 1 ? 'MEDIUM' : 'LOW';
    
    // Calculate potential impact
    const impact = {
      affectedUsers: confirmedRegistrations,
      revenueAtRisk: totalRevenue,
      refundProcessingTime: '5-7 business days',
      reputationRisk: riskLevel === 'CRITICAL' ? 'High' : riskLevel === 'HIGH' ? 'Medium' : 'Low'
    };
    
    // Required approvals based on risk
    const requiredApprovals = [];
    if (riskLevel === 'CRITICAL') {
      requiredApprovals.push('Super Admin Approval', 'Detailed Cancellation Reason', 'Refund Plan', 'User Communication Plan');
    } else if (riskLevel === 'HIGH') {
      requiredApprovals.push('Admin Approval', 'Cancellation Reason', 'Refund Plan');
    } else if (riskLevel === 'MEDIUM') {
      requiredApprovals.push('Cancellation Reason');
    }
    
    res.json({
      success: true,
      data: {
        tournament: {
          id: tournament.id,
          name: tournament.name,
          status: tournament.status,
          organizer: tournament.organizer
        },
        riskAssessment: {
          level: riskLevel,
          score: riskScore,
          factors: riskFactors
        },
        impact,
        statistics: {
          confirmedRegistrations,
          totalRevenue,
          averageRegistrationValue,
          categories: tournament.categories.length
        },
        requirements: {
          approvals: requiredApprovals,
          canCancel: true, // Admin can always cancel, but with different requirements
          recommendedAction: riskLevel === 'CRITICAL' 
            ? 'Consider postponement instead of cancellation'
            : 'Proceed with caution'
        }
      }
    });
    
  } catch (error) {
    console.error('Error assessing cancellation risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assess cancellation risk',
      error: error.message
    });
  }
});

// Cancel tournament with protection
router.post('/:tournamentId/cancel', 
  authenticate, 
  requireAdmin, 
  protectTournamentCancellation,
  logTournamentStatusChange,
  async (req, res) => {
    try {
      const { tournamentId } = req.params;
      const { cancellationReason, refundPlan, adminConfirmation, notifyUsers = true } = req.body;
      
      // Update tournament status
      const updatedTournament = await prisma.tournament.update({
        where: { id: tournamentId },
        data: {
          status: 'cancelled',
          updatedAt: new Date()
        }
      });
      
      // Mark for post-processing
      res.locals.tournamentUpdated = true;
      
      // Create cancellation record
      await prisma.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'TOURNAMENT_CANCELLED',
          entityType: 'Tournament',
          entityId: tournamentId,
          details: JSON.stringify({
            tournamentName: req.cancellationData.tournamentName,
            organizerName: req.cancellationData.organizerName,
            confirmedRegistrations: req.cancellationData.confirmedRegistrations,
            totalRevenue: req.cancellationData.totalRevenue,
            riskLevel: req.cancellationData.riskLevel,
            cancellationReason,
            refundPlan,
            adminConfirmation,
            cancelledBy: req.user.email,
            cancelledAt: new Date().toISOString()
          }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      res.json({
        success: true,
        message: 'Tournament cancelled successfully',
        data: {
          tournament: updatedTournament,
          cancellationData: req.cancellationData,
          nextSteps: [
            'User notifications will be sent automatically',
            'Registrations will be marked as cancelled',
            'Refund processing will begin within 24 hours',
            'Organizer will be notified of the cancellation'
          ]
        }
      });
      
    } catch (error) {
      console.error('Error cancelling tournament:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel tournament',
        error: error.message
      });
    }
  },
  handleTournamentCancellation
);

// Get tournament status change history
router.get('/:tournamentId/status-history', authenticate, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    const statusHistory = await prisma.auditLog.findMany({
      where: {
        entityType: 'Tournament',
        entityId: tournamentId,
        action: { in: ['TOURNAMENT_STATUS_CHANGE', 'TOURNAMENT_CANCELLED', 'TOURNAMENT_CREATED'] }
      },
      include: {
        admin: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const parsedHistory = statusHistory.map(log => {
      let details = {};
      try {
        details = JSON.parse(log.details);
      } catch (e) {
        details = { rawDetails: log.details };
      }
      
      return {
        id: log.id,
        action: log.action,
        admin: log.admin,
        details,
        timestamp: log.createdAt,
        ipAddress: log.ipAddress
      };
    });
    
    res.json({
      success: true,
      data: parsedHistory
    });
    
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament status history',
      error: error.message
    });
  }
});

// Get cancellation statistics
router.get('/cancellation-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const { timeframe = '30' } = req.query; // days
    const startDate = new Date(Date.now() - parseInt(timeframe) * 24 * 60 * 60 * 1000);
    
    const [
      totalCancellations,
      recentCancellations,
      cancelledRevenue,
      affectedUsers
    ] = await Promise.all([
      // Total cancelled tournaments
      prisma.tournament.count({
        where: { status: 'cancelled' }
      }),
      
      // Recent cancellations
      prisma.auditLog.count({
        where: {
          action: 'TOURNAMENT_CANCELLED',
          createdAt: { gte: startDate }
        }
      }),
      
      // Revenue from cancelled tournaments
      prisma.tournament.aggregate({
        where: { status: 'cancelled' },
        _sum: { totalRevenue: true }
      }),
      
      // Users affected by cancellations
      prisma.registration.count({
        where: {
          status: 'cancelled',
          cancelledAt: { gte: startDate }
        }
      })
    ]);
    
    // Get cancellation reasons
    const cancellationReasons = await prisma.auditLog.findMany({
      where: {
        action: 'TOURNAMENT_CANCELLED',
        createdAt: { gte: startDate }
      },
      select: { details: true }
    });
    
    const reasonCounts = {};
    cancellationReasons.forEach(log => {
      try {
        const details = JSON.parse(log.details);
        const reason = details.cancellationReason || 'No reason provided';
        reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
      } catch (e) {
        reasonCounts['Parse error'] = (reasonCounts['Parse error'] || 0) + 1;
      }
    });
    
    res.json({
      success: true,
      data: {
        timeframe: `${timeframe} days`,
        statistics: {
          totalCancellations,
          recentCancellations,
          cancelledRevenue: cancelledRevenue._sum.totalRevenue || 0,
          affectedUsers
        },
        cancellationReasons: reasonCounts,
        recommendations: [
          'Monitor tournaments with high registration counts',
          'Implement early warning system for at-risk tournaments',
          'Provide organizer support to prevent cancellations',
          'Consider postponement options before cancellation'
        ]
      }
    });
    
  } catch (error) {
    console.error('Error fetching cancellation stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cancellation statistics',
      error: error.message
    });
  }
});

export default router;