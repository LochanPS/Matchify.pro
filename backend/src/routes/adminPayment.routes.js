import express from 'express';
import adminPaymentService from '../services/adminPaymentService.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

// Middleware to ensure only admins can access these routes
const requireAdmin = (req, res, next) => {
  if (!req.user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================
// DASHBOARD DATA
// ============================================

// GET /api/admin/payment/dashboard - Get payment dashboard data
router.get('/dashboard', authenticate, requireAdmin, async (req, res) => {
  try {
    const dashboardData = await adminPaymentService.getPaymentDashboardData();
    res.json({ success: true, data: dashboardData });
  } catch (error) {
    console.error('Error getting payment dashboard data:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// GET /api/admin/payment/notifications - Get admin payment notifications
router.get('/notifications', authenticate, requireAdmin, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { 
        userId: req.user.id,
        type: { in: ['PAYMENT_RECEIVED', 'PAYMENT_DUE', 'PAYMENT_OVERDUE', 'DAILY_SUMMARY'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error getting payment notifications:', error);
    res.status(500).json({ error: 'Failed to get notifications' });
  }
});

// GET /api/admin/payment/schedule - Get payment schedule
router.get('/schedule', authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Payments due today (30% for tournaments starting tomorrow)
    const todayPayments = await prisma.tournament.findMany({
      where: {
        startDate: tomorrow.toISOString().split('T')[0],
        payment: { payout50Status1: 'pending' }
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payment: true,
        registrations: {
          where: { paymentStatus: 'verified' },
          select: { id: true }
        }
      }
    });

    // Payments due tomorrow (65% for tournaments that ended yesterday)
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const tomorrowPayments = await prisma.tournament.findMany({
      where: {
        endDate: yesterday.toISOString().split('T')[0],
        payment: { payout50Status2: 'pending' }
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payment: true,
        registrations: {
          where: { paymentStatus: 'verified' },
          select: { id: true }
        }
      }
    });

    // Payments due this week
    const weekPayments = await prisma.tournament.findMany({
      where: {
        OR: [
          {
            startDate: { gte: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            startDate: { lte: nextWeek.toISOString().split('T')[0] },
            payment: { payout50Status1: 'pending' }
          },
          {
            endDate: { gte: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            endDate: { lte: yesterday.toISOString().split('T')[0] },
            payment: { payout50Status2: 'pending' }
          }
        ]
      },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        payment: true,
        registrations: {
          where: { paymentStatus: 'verified' },
          select: { id: true }
        }
      }
    });

    const formatPayment = (tournament, paymentType) => ({
      id: `${tournament.id}_${paymentType}`,
      tournamentId: tournament.id,
      organizerId: tournament.organizer.id,
      organizerName: tournament.organizer.name,
      organizerEmail: tournament.organizer.email,
      organizerPhone: tournament.organizer.phone,
      tournament: tournament.name,
      amount: paymentType === 'first' ? tournament.payment.payout50Percent1 : tournament.payment.payout50Percent2,
      type: paymentType,
      percentage: paymentType === 'first' ? '30%' : '65%',
      timing: paymentType === 'first' ? 'Before Tournament' : 'After Tournament',
      status: 'due',
      totalCollected: tournament.payment.totalCollected,
      totalRegistrations: tournament.registrations.length,
      dueDate: paymentType === 'first' ? tournament.startDate : tournament.endDate
    });

    const schedule = [
      {
        date: 'Today',
        payments: todayPayments.map(t => formatPayment(t, 'first'))
      },
      {
        date: 'Tomorrow', 
        payments: tomorrowPayments.map(t => formatPayment(t, 'second'))
      },
      {
        date: 'This Week',
        payments: weekPayments.map(t => {
          const paymentType = t.payment.payout50Status1 === 'pending' ? 'first' : 'second';
          return formatPayment(t, paymentType);
        })
      }
    ].filter(schedule => schedule.payments.length > 0); // Only include sections with actual payments

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error getting payment schedule:', error);
    res.status(500).json({ error: 'Failed to get payment schedule' });
  }
});

// ============================================
// PAYMENT VERIFICATION
// ============================================

// GET /api/admin/payment/pending-verifications - Get pending payment verifications
router.get('/pending-verifications', authenticate, requireAdmin, async (req, res) => {
  try {
    const pendingPayments = await prisma.registration.findMany({
      where: { paymentStatus: 'pending' },
      include: {
        user: true,
        tournament: true,
        category: true,
        paymentVerification: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: pendingPayments });
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

// POST /api/admin/payment/approve/:registrationId - Approve payment
router.post('/approve/:registrationId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { notes } = req.body;

    const result = await adminPaymentService.approvePayment(registrationId, req.user.id);
    
    // Save approval record
    await adminPaymentService.savePaymentRecord({
      type: 'APPROVED',
      notes: notes || 'Payment approved by admin',
      amount: 0,
      status: 'APPROVED',
      timestamp: new Date(),
      registrationId
    });

    res.json(result);
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({ error: 'Failed to approve payment' });
  }
});

// POST /api/admin/payment/reject/:registrationId - Reject payment
router.post('/reject/:registrationId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { reason, rejectionType, customMessage, amountPaid, amountRequired } = req.body;

    // Update both registration and payment verification
    await prisma.$transaction([
      prisma.registration.update({
        where: { id: registrationId },
        data: { 
          paymentStatus: 'rejected',
          status: 'cancelled'
        }
      }),
      prisma.paymentVerification.update({
        where: { registrationId },
        data: {
          status: 'rejected',
          rejectionReason: reason,
          rejectionType: rejectionType || 'CUSTOM',
          verifiedBy: req.user.id,
          verifiedAt: new Date()
        }
      })
    ]);

    // Save rejection record for audit
    await adminPaymentService.savePaymentRecord({
      type: 'REJECTED',
      notes: `${reason}${customMessage ? ` - ${customMessage}` : ''}`,
      amount: amountPaid || 0,
      status: 'REJECTED',
      timestamp: new Date(),
      registrationId,
      metadata: {
        rejectionType,
        amountRequired,
        amountPaid,
        adminId: req.user.id
      }
    });

    // Get registration details for notification
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
      include: { user: true, tournament: true }
    });

    if (registration) {
      // Create detailed rejection message
      let rejectionMessage = `Your payment for ${registration.tournament.name} was rejected.`;
      
      if (rejectionType === 'INSUFFICIENT_AMOUNT') {
        rejectionMessage += ` Amount paid: ₹${amountPaid}, Required: ₹${amountRequired}. Please pay the correct amount.`;
      } else if (rejectionType === 'WRONG_ACCOUNT') {
        rejectionMessage += ` Payment was made to wrong account. Please pay to the correct UPI ID shown during registration.`;
      } else if (rejectionType === 'INVALID_PROOF') {
        rejectionMessage += ` Payment screenshot is invalid or unclear. Please upload a clear screenshot.`;
      } else {
        rejectionMessage += ` Reason: ${reason}`;
      }

      if (customMessage) {
        rejectionMessage += ` Additional info: ${customMessage}`;
      }

      await notificationService.createNotification(registration.userId, {
        type: 'PAYMENT_REJECTED',
        title: 'Payment Rejected',
        message: rejectionMessage,
        data: JSON.stringify({ 
          tournamentId: registration.tournamentId, 
          reason,
          rejectionType,
          canRetry: ['INSUFFICIENT_AMOUNT', 'WRONG_ACCOUNT', 'INVALID_PROOF'].includes(rejectionType)
        })
      });
    }

    // Log the rejection for audit trail
    await adminPaymentService.logPaymentTransaction({
      type: 'PAYMENT_REJECTED',
      registrationId,
      amount: amountPaid || 0,
      adminId: req.user.id,
      metadata: {
        reason,
        rejectionType,
        customMessage,
        amountRequired
      }
    });

    res.json({ success: true, message: 'Payment rejected successfully' });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ error: 'Failed to reject payment' });
  }
});

// ============================================
// ORGANIZER PAYOUTS
// ============================================

// GET /api/admin/payment/pending-payouts - Get pending organizer payouts
router.get('/pending-payouts', authenticate, requireAdmin, async (req, res) => {
  try {
    const pendingPayouts = await prisma.tournamentPayment.findMany({
      where: {
        OR: [
          { payout50Status1: 'pending' },
          { payout50Status2: 'pending' }
        ]
      },
      include: {
        tournament: { 
          include: { 
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
      orderBy: { createdAt: 'desc' }
    });

    // Format the data for frontend
    const formattedPayouts = pendingPayouts.map(payout => {
      const tournament = payout.tournament;
      const organizer = tournament.organizer;
      
      const payouts = [];
      
      // Check if first payment (30%) is pending
      if (payout.payout50Status1 === 'pending') {
        payouts.push({
          id: `${payout.id}_first`,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          organizerId: organizer.id,
          organizerName: organizer.name,
          organizerEmail: organizer.email,
          organizerPhone: organizer.phone,
          amount: payout.payout50Percent1,
          type: 'first', // 30% before tournament
          percentage: '30%',
          timing: 'Before Tournament',
          status: 'pending',
          dueDate: tournament.startDate,
          totalCollected: payout.totalCollected,
          totalRegistrations: payout.totalRegistrations
        });
      }
      
      // Check if second payment (65%) is pending
      if (payout.payout50Status2 === 'pending') {
        payouts.push({
          id: `${payout.id}_second`,
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          organizerId: organizer.id,
          organizerName: organizer.name,
          organizerEmail: organizer.email,
          organizerPhone: organizer.phone,
          amount: payout.payout50Percent2,
          type: 'second', // 65% after tournament
          percentage: '65%',
          timing: 'After Tournament',
          status: 'pending',
          dueDate: tournament.endDate,
          totalCollected: payout.totalCollected,
          totalRegistrations: payout.totalRegistrations
        });
      }
      
      return payouts;
    }).flat();

    res.json({ success: true, data: formattedPayouts });
  } catch (error) {
    console.error('Error getting pending payouts:', error);
    res.status(500).json({ error: 'Failed to get pending payouts' });
  }
});

// POST /api/admin/payment/mark-paid/:tournamentId - Mark organizer payment as paid
router.post('/mark-paid/:tournamentId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { paymentType, transactionRef, notes } = req.body; // paymentType: 'first' or 'second'

    const updateData = paymentType === 'first' 
      ? { 
          payout50Status1: 'paid',
          payout50PaidAt1: new Date(),
          payout50PaidBy1: req.user.id,
          payout50Notes1: notes
        }
      : {
          payout50Status2: 'paid',
          payout50PaidAt2: new Date(),
          payout50PaidBy2: req.user.id,
          payout50Notes2: notes
        };

    await prisma.tournamentPayment.update({
      where: { tournamentId },
      data: updateData
    });

    // Get tournament and organizer info
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { organizer: true, payment: true }
    });

    const amount = paymentType === 'first' 
      ? tournament.payment.payout50Percent1 
      : tournament.payment.payout50Percent2;

    // Save payment record
    await adminPaymentService.savePaymentRecord({
      type: 'PAID_OUT',
      organizerName: tournament.organizer.name,
      tournamentName: tournament.name,
      amount,
      status: 'COMPLETED',
      timestamp: new Date(),
      notes: `${paymentType === 'first' ? '30%' : '65%'} payment to organizer. Ref: ${transactionRef}`
    });

    // Notify organizer about payment
    await notificationService.createNotification(tournament.organizerId, {
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received',
      message: `You received ₹${amount} (${paymentType === 'first' ? '30%' : '65%'}) for ${tournament.name}`,
      data: JSON.stringify({ 
        tournamentId, 
        amount, 
        paymentType,
        transactionRef 
      })
    });

    res.json({ success: true, message: 'Payment marked as paid successfully' });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({ error: 'Failed to mark payment as paid' });
  }
});

// ============================================
// REPORTS & FILES
// ============================================

// GET /api/admin/payment/daily-report - Generate and download daily report
router.get('/daily-report', authenticate, requireAdmin, async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];
    
    const report = await adminPaymentService.generateDailyReport();
    
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({ error: 'Failed to generate daily report' });
  }
});

// GET /api/admin/payment/monthly-report - Generate monthly report
router.get('/monthly-report', authenticate, requireAdmin, async (req, res) => {
  try {
    const report = await adminPaymentService.generateMonthlyReport();
    res.json({ success: true, data: report });
  } catch (error) {
    console.error('Error generating monthly report:', error);
    res.status(500).json({ error: 'Failed to generate monthly report' });
  }
});

// GET /api/admin/payment/export-csv - Export payment data as CSV
router.get('/export-csv', authenticate, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    
    // Generate CSV content based on parameters
    let csvContent = 'Date,Time,Type,Player/Organizer,Tournament,Amount,Status,Notes\n';
    
    // This would fetch actual data from database
    // For now, returning sample data
    const today = new Date().toISOString().split('T')[0];
    csvContent += `${today},10:30,RECEIVED,Rahul Kumar,Bangalore Open,1000,APPROVED,Entry fee\n`;
    csvContent += `${today},11:15,RECEIVED,Priya Sharma,City Open,800,PENDING,Waiting verification\n`;
    csvContent += `${today},14:20,PAID_OUT,John Doe,Ace Tournament,300,COMPLETED,30% before tournament\n`;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=payment_export_${today}.csv`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(500).json({ error: 'Failed to export CSV' });
  }
});

// ============================================
// MANUAL TRIGGERS
// ============================================

// POST /api/admin/payment/run-daily-tasks - Manually trigger daily tasks
router.post('/run-daily-tasks', authenticate, requireAdmin, async (req, res) => {
  try {
    await adminPaymentService.runDailyTasks();
    res.json({ success: true, message: 'Daily tasks completed successfully' });
  } catch (error) {
    console.error('Error running daily tasks:', error);
    res.status(500).json({ error: 'Failed to run daily tasks' });
  }
});

// GET /api/admin/payment/quick-stats - Get quick stats for dashboard
router.get('/quick-stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const quickStats = await adminPaymentService.getQuickStats();
    res.json({ success: true, data: quickStats });
  } catch (error) {
    console.error('Error getting quick stats:', error);
    res.status(500).json({ error: 'Failed to get quick stats' });
  }
});

// POST /api/admin/payment/check-due-payments - Check for payments due
router.post('/check-due-payments', authenticate, requireAdmin, async (req, res) => {
  try {
    await adminPaymentService.checkAllPaymentsDue();
    res.json({ success: true, message: 'Payment due checks completed' });
  } catch (error) {
    console.error('Error checking due payments:', error);
    res.status(500).json({ error: 'Failed to check due payments' });
  }
});

export default router;