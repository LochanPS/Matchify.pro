import prisma from '../lib/prisma.js';

/**
 * Middleware to protect tournaments from accidental cancellation
 */
export const protectTournamentCancellation = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.body;
    
    // Only check if status is being changed to cancelled
    if (status !== 'cancelled') {
      return next();
    }
    
    console.log('🛡️ Tournament cancellation protection triggered');
    
    // Get tournament details
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: 'confirmed' },
          select: { id: true, amountTotal: true }
        },
        organizer: {
          select: { name: true, email: true }
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
    
    // High-risk cancellation checks
    const isHighRisk = 
      confirmedRegistrations >= 10 || // 10+ confirmed registrations
      totalRevenue >= 5000 || // ₹5000+ revenue
      tournament.status === 'ongoing'; // Tournament already started
    
    if (isHighRisk) {
      // Require additional validation for high-risk cancellations
      const { cancellationReason, adminConfirmation, refundPlan } = req.body;
      
      if (!cancellationReason || !adminConfirmation || !refundPlan) {
        return res.status(400).json({
          success: false,
          message: 'High-risk tournament cancellation requires: cancellationReason, adminConfirmation, and refundPlan',
          data: {
            tournamentName: tournament.name,
            confirmedRegistrations,
            totalRevenue,
            riskLevel: 'HIGH',
            requiredFields: ['cancellationReason', 'adminConfirmation', 'refundPlan']
          }
        });
      }
      
      // Log high-risk cancellation attempt
      await prisma.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'HIGH_RISK_TOURNAMENT_CANCELLATION_ATTEMPT',
          entityType: 'Tournament',
          entityId: tournamentId,
          details: JSON.stringify({
            tournamentName: tournament.name,
            organizerName: tournament.organizer.name,
            confirmedRegistrations,
            totalRevenue,
            cancellationReason,
            refundPlan
          }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    }
    
    // Add cancellation metadata to request
    req.cancellationData = {
      tournamentName: tournament.name,
      organizerName: tournament.organizer.name,
      confirmedRegistrations,
      totalRevenue,
      riskLevel: isHighRisk ? 'HIGH' : 'LOW'
    };
    
    next();
    
  } catch (error) {
    console.error('❌ Tournament protection middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Tournament protection check failed',
      error: error.message
    });
  }
};

/**
 * Middleware to log all tournament status changes
 */
export const logTournamentStatusChange = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { status: newStatus } = req.body;
    
    if (!newStatus) {
      return next();
    }
    
    // Get current tournament status
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { status: true, name: true }
    });
    
    if (tournament && tournament.status !== newStatus) {
      // Log status change
      await prisma.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'TOURNAMENT_STATUS_CHANGE',
          entityType: 'Tournament',
          entityId: tournamentId,
          details: JSON.stringify({
            tournamentName: tournament.name,
            oldStatus: tournament.status,
            newStatus,
            timestamp: new Date().toISOString()
          }),
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      console.log(`📝 Tournament status change logged: ${tournament.name} (${tournament.status} → ${newStatus})`);
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Status change logging error:', error);
    next(); // Don't block the request if logging fails
  }
};

/**
 * Post-cancellation cleanup and notifications
 */
export const handleTournamentCancellation = async (req, res, next) => {
  try {
    const { tournamentId } = req.params;
    const { status } = req.body;
    
    // Only run after successful cancellation
    if (status !== 'cancelled' || !res.locals.tournamentUpdated) {
      return next();
    }
    
    console.log('🔄 Processing tournament cancellation cleanup...');
    
    const cancellationData = req.cancellationData;
    
    // Send notifications to all registered users
    const registrations = await prisma.registration.findMany({
      where: { 
        tournamentId,
        status: { in: ['confirmed', 'pending'] }
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });
    
    console.log(`📧 Sending cancellation notifications to ${registrations.length} users`);
    
    // Create notifications for all registered users
    const notifications = registrations.map(reg => ({
      userId: reg.user.id,
      type: 'TOURNAMENT_CANCELLED',
      title: 'Tournament Cancelled',
      message: `The tournament "${cancellationData.tournamentName}" has been cancelled. You will receive a full refund within 5-7 business days.`,
      data: JSON.stringify({
        tournamentId,
        tournamentName: cancellationData.tournamentName,
        registrationId: reg.id,
        refundAmount: reg.amountTotal
      })
    }));
    
    await prisma.notification.createMany({
      data: notifications
    });
    
    // Update registration statuses to cancelled
    await prisma.registration.updateMany({
      where: { 
        tournamentId,
        status: { in: ['confirmed', 'pending'] }
      },
      data: {
        status: 'cancelled',
        cancellationReason: 'Tournament cancelled by organizer',
        cancelledAt: new Date()
      }
    });
    
    // Log final cancellation summary
    await prisma.auditLog.create({
      data: {
        adminId: req.user.userId,
        action: 'TOURNAMENT_CANCELLATION_COMPLETED',
        entityType: 'Tournament',
        entityId: tournamentId,
        details: JSON.stringify({
          ...cancellationData,
          notificationsSent: registrations.length,
          registrationsCancelled: registrations.length,
          completedAt: new Date().toISOString()
        }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });
    
    console.log('✅ Tournament cancellation cleanup completed');
    
    next();
    
  } catch (error) {
    console.error('❌ Cancellation cleanup error:', error);
    // Don't fail the request, but log the error
    next();
  }
};

export default {
  protectTournamentCancellation,
  logTournamentStatusChange,
  handleTournamentCancellation
};