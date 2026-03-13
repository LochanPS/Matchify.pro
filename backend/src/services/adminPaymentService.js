import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../lib/prisma.js';
import notificationService from './notificationService.js';
import userPaymentLedgerService from './userPaymentLedgerService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdminPaymentService {
  constructor() {
    this.paymentsDir = path.join(__dirname, '../../payment_records');
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.paymentsDir, { recursive: true });
    } catch (error) {
      console.error('Error creating payments directory:', error);
    }
  }

  // ============================================
  // PAYMENT TRACKING & NOTIFICATIONS
  // ============================================

  async handlePlayerPayment(registrationId, paymentData) {
    try {
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          user: true,
          tournament: { include: { organizer: true } },
          category: true
        }
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Save payment record
      await this.savePaymentRecord({
        type: 'RECEIVED',
        playerName: registration.user.name,
        tournamentName: registration.tournament.name,
        amount: registration.amountTotal,
        status: 'PENDING',
        timestamp: new Date(),
        screenshot: paymentData.screenshot,
        registrationId
      });

      // Notify admin about new payment
      await this.notifyAdminNewPayment(registration);

      // Generate daily report update
      await this.updateDailyReport();

      return { success: true, message: 'Payment recorded and admin notified' };
    } catch (error) {
      console.error('Error handling player payment:', error);
      throw error;
    }
  }

  async approvePayment(registrationId, adminId) {
    try {
      const registration = await prisma.registration.findUnique({
        where: { id: registrationId },
        include: {
          user: true,
          tournament: { include: { organizer: true } },
          category: true,
          paymentVerification: true
        }
      });

      if (!registration) {
        throw new Error('Registration not found');
      }

      // Update both registration and payment verification status
      await prisma.$transaction([
        prisma.registration.update({
          where: { id: registrationId },
          data: { 
            status: 'confirmed',
            paymentStatus: 'verified'
          }
        }),
        prisma.paymentVerification.update({
          where: { registrationId },
          data: {
            status: 'approved',
            verifiedBy: adminId,
            verifiedAt: new Date()
          }
        })
      ]);

      // Calculate payment breakdown
      const totalAmount = registration.amountTotal;
      const platformFee = totalAmount * 0.05; // 5% of total
      const organizerShare = totalAmount - platformFee; // For display only (95%)
      const firstPayment = totalAmount * 0.30; // 30% of TOTAL
      const secondPayment = totalAmount * 0.65; // 65% of TOTAL

      // Create or update tournament payment record
      await this.updateTournamentPayment(registration.tournamentId, {
        totalAmount,
        platformFee,
        organizerShare,
        firstPayment,
        secondPayment
      });

      // Update payment record
      await this.updatePaymentRecord(registrationId, 'APPROVED');

      // Record in user payment ledger
      await userPaymentLedgerService.recordUserPayment({
        userId: registration.userId,
        amount: registration.amountTotal,
        tournamentId: registration.tournamentId,
        registrationId: registration.id,
        description: `Badminton tournament entry fee for ${registration.tournament.name}`,
        paymentMethod: 'UPI',
        screenshot: registration.paymentScreenshot,
        adminId
      });

      // Notify player about approval
      await notificationService.createNotification(registration.userId, {
        type: 'REGISTRATION_CONFIRMED',
        title: 'Payment Approved',
        message: `Your payment for ${registration.tournament.name} has been approved`,
        data: JSON.stringify({ tournamentId: registration.tournamentId })
      });

      // Check if organizer payment is due
      await this.checkOrganizerPaymentDue(registration.tournamentId);

      // Update daily report
      await this.updateDailyReport();

      return { success: true, message: 'Payment approved successfully' };
    } catch (error) {
      console.error('Error approving payment:', error);
      throw error;
    }
  }

  async checkOrganizerPaymentDue(tournamentId) {
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { 
          organizer: true,
          payment: true
        }
      });

      if (!tournament || !tournament.payment) return;

      const tournamentDate = new Date(tournament.startDate);
      const today = new Date();
      const daysDiff = Math.ceil((tournamentDate - today) / (1000 * 60 * 60 * 24));

      // Notify admin 1 day before tournament for 30% payment
      if (daysDiff === 1 && tournament.payment.payout50Status1 === 'pending') {
        await this.notifyAdminPaymentDue(tournament, 'first');
      }

      // Notify admin 1 day after tournament for 65% payment
      if (daysDiff === -1 && tournament.payment.payout50Status2 === 'pending') {
        await this.notifyAdminPaymentDue(tournament, 'second');
      }

      // Check for overdue payments
      if (daysDiff < -3 && tournament.payment.payout50Status2 === 'pending') {
        await this.notifyAdminPaymentOverdue(tournament);
      }
    } catch (error) {
      console.error('Error checking organizer payment due:', error);
    }
  }

  // ============================================
  // ADMIN NOTIFICATIONS
  // ============================================

  async notifyAdminNewPayment(registration) {
    try {
      // Get admin user (assuming there's an admin user)
      const admin = await prisma.user.findFirst({
        where: { roles: { contains: 'ADMIN' } }
      });

      if (!admin) return;

      await notificationService.createNotification(admin.id, {
        type: 'PAYMENT_RECEIVED',
        title: 'New Tournament Payment Received',
        message: `${registration.user.name} paid ₹${registration.amountTotal} for ${registration.tournament.name} badminton tournament`,
        data: JSON.stringify({ 
          registrationId: registration.id,
          amount: registration.amountTotal,
          playerName: registration.user.name,
          tournamentName: registration.tournament.name,
          action: 'verify_payment'
        })
      });

      console.log(`✅ Admin notified about payment from ${registration.user.name}`);
    } catch (error) {
      console.error('Error notifying admin about new payment:', error);
    }
  }

  async notifyAdminPaymentDue(tournament, paymentType) {
    try {
      const admin = await prisma.user.findFirst({
        where: { roles: { contains: 'ADMIN' } }
      });

      if (!admin) return;

      const amount = paymentType === 'first' 
        ? tournament.payment.payout50Percent1 
        : tournament.payment.payout50Percent2;
      
      const percentage = paymentType === 'first' ? '30%' : '65%';
      const timing = paymentType === 'first' ? 'before tournament' : 'after tournament';

      await notificationService.createNotification(admin.id, {
        type: 'PAYMENT_DUE',
        title: `Organizer Payment Due: ${percentage}`,
        message: `Pay ${tournament.organizer.name} ₹${amount} (${percentage} ${timing}) for ${tournament.name} badminton tournament`,
        data: JSON.stringify({
          tournamentId: tournament.id,
          organizerId: tournament.organizerId,
          amount,
          paymentType,
          organizerName: tournament.organizer.name,
          tournamentName: tournament.name,
          action: 'pay_organizer'
        })
      });

      console.log(`✅ Admin notified about ${percentage} payment due for ${tournament.name}`);
    } catch (error) {
      console.error('Error notifying admin about payment due:', error);
    }
  }

  async notifyAdminPaymentOverdue(tournament) {
    try {
      const admin = await prisma.user.findFirst({
        where: { roles: { contains: 'ADMIN' } }
      });

      if (!admin) return;

      const daysPastDue = Math.abs(Math.ceil((new Date(tournament.startDate) - new Date()) / (1000 * 60 * 60 * 24))) - 1;

      await notificationService.createNotification(admin.id, {
        type: 'PAYMENT_OVERDUE',
        title: 'Tournament Payment Overdue!',
        message: `Payment to ${tournament.organizer.name} is ${daysPastDue} days overdue (₹${tournament.payment.payout50Percent2}) for ${tournament.name}`,
        data: JSON.stringify({
          tournamentId: tournament.id,
          organizerId: tournament.organizerId,
          amount: tournament.payment.payout50Percent2,
          daysPastDue,
          organizerName: tournament.organizer.name,
          tournamentName: tournament.name,
          action: 'pay_overdue'
        })
      });

      console.log(`🚨 Admin notified about overdue payment for ${tournament.name}`);
    } catch (error) {
      console.error('Error notifying admin about overdue payment:', error);
    }
  }

  // ============================================
  // FILE MANAGEMENT
  // ============================================

  async savePaymentRecord(paymentData) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const filename = `payments_${today}.csv`;
      const filepath = path.join(this.paymentsDir, filename);

      // Check if file exists, if not create with headers
      let fileExists = false;
      try {
        await fs.access(filepath);
        fileExists = true;
      } catch (error) {
        // File doesn't exist
      }

      let csvContent = '';
      if (!fileExists) {
        csvContent = 'Date,Time,Type,Player/Organizer,Tournament,Amount,Status,Screenshot,Notes\n';
      }

      // Add new record
      const timestamp = new Date();
      const csvRow = [
        timestamp.toISOString().split('T')[0],
        timestamp.toTimeString().split(' ')[0],
        paymentData.type,
        paymentData.playerName || paymentData.organizerName || '',
        paymentData.tournamentName,
        paymentData.amount,
        paymentData.status,
        paymentData.screenshot || '',
        paymentData.notes || ''
      ].join(',') + '\n';

      csvContent += csvRow;

      await fs.appendFile(filepath, csvContent);
      console.log(`✅ Payment record saved to ${filename}`);
    } catch (error) {
      console.error('Error saving payment record:', error);
    }
  }

  async updatePaymentRecord(registrationId, status) {
    try {
      // Update the CSV file with new status
      const today = new Date().toISOString().split('T')[0];
      const filename = `payments_${today}.csv`;
      const filepath = path.join(this.paymentsDir, filename);

      // For now, just add a new entry with updated status
      // In a real implementation, you'd update the existing row
      await this.savePaymentRecord({
        type: 'UPDATE',
        notes: `Registration ${registrationId} status updated to ${status}`,
        amount: 0,
        status: status,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error updating payment record:', error);
    }
  }

  async generateDailyReport() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get all payments for today
      const payments = await prisma.registration.findMany({
        where: {
          createdAt: {
            gte: new Date(today),
            lt: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
          }
        },
        include: {
          user: true,
          tournament: true,
          category: true
        }
      });

      // Calculate summary
      const totalReceived = payments.reduce((sum, p) => sum + p.amountTotal, 0);
      const totalTransactions = payments.length;
      const platformEarnings = totalReceived * 0.05;

      // Generate summary report
      const summaryData = {
        date: today,
        totalReceived,
        totalTransactions,
        platformEarnings,
        paymentsApproved: payments.filter(p => p.paymentStatus === 'verified').length,
        paymentsPending: payments.filter(p => p.paymentStatus === 'pending').length
      };

      // Save summary to file
      const summaryFilename = `daily_summary_${today}.json`;
      const summaryFilepath = path.join(this.paymentsDir, summaryFilename);
      await fs.writeFile(summaryFilepath, JSON.stringify(summaryData, null, 2));

      console.log(`✅ Daily report generated: ${summaryFilename}`);
      return summaryData;
    } catch (error) {
      console.error('Error generating daily report:', error);
      throw error;
    }
  }

  async generateMonthlyReport() {
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;

      // Get all payments for the month
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const payments = await prisma.registration.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          },
          paymentStatus: 'verified'
        },
        include: {
          user: true,
          tournament: { include: { organizer: true } },
          category: true
        }
      });

      const totalReceived = payments.reduce((sum, p) => sum + p.amountTotal, 0);
      const platformEarnings = totalReceived * 0.05;
      const organizerPayments = totalReceived * 0.95;

      const monthlyData = {
        month: monthStr,
        totalReceived,
        platformEarnings,
        organizerPayments,
        totalTransactions: payments.length,
        uniqueOrganizers: [...new Set(payments.map(p => p.tournament.organizerId))].length,
        uniquePlayers: [...new Set(payments.map(p => p.userId))].length
      };

      // Save monthly report
      const monthlyFilename = `monthly_summary_${monthStr}.json`;
      const monthlyFilepath = path.join(this.paymentsDir, monthlyFilename);
      await fs.writeFile(monthlyFilepath, JSON.stringify(monthlyData, null, 2));

      console.log(`✅ Monthly report generated: ${monthlyFilename}`);
      return monthlyData;
    } catch (error) {
      console.error('Error generating monthly report:', error);
      throw error;
    }
  }

  // ============================================
  // DASHBOARD DATA
  // ============================================

  async getPaymentDashboardData() {
    try {
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Today's received payments
      const todayPayments = await prisma.registration.findMany({
        where: {
          createdAt: { gte: todayStart, lt: todayEnd },
          paymentStatus: 'verified'
        }
      });

      const todayReceived = todayPayments.reduce((sum, p) => sum + p.amountTotal, 0);
      const platformEarnings = todayReceived * 0.05;

      // Pending verifications with details
      const pendingVerifications = await prisma.registration.findMany({
        where: { paymentStatus: 'pending' },
        include: {
          tournament: { select: { name: true } },
          user: { select: { name: true } }
        }
      });

      // Payments due today (30% payments for tournaments starting tomorrow)
      const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      const paymentsDueToday = await prisma.tournament.findMany({
        where: {
          startDate: tomorrow.toISOString().split('T')[0],
          payment: { payout50Status1: 'pending' }
        },
        include: { 
          payment: true,
          organizer: { select: { name: true } }
        }
      });

      const todayToPay = paymentsDueToday.reduce((sum, t) => sum + (t.payment?.payout50Percent1 || 0), 0);

      // Overdue payments with details
      const overduePayments = await prisma.tournament.findMany({
        where: {
          startDate: { lt: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000).toISOString() },
          payment: { payout50Status2: 'pending' }
        },
        include: {
          payment: true,
          organizer: { select: { name: true } }
        }
      });

      const overdueAmount = overduePayments.reduce((sum, t) => sum + (t.payment?.payout50Percent2 || 0), 0);

      // Create detailed action items only if there are actual items
      const actionItems = [];
      
      if (pendingVerifications.length > 0) {
        const totalVerificationAmount = pendingVerifications.reduce((sum, p) => sum + p.amountTotal, 0);
        actionItems.push({ 
          type: 'verify', 
          count: pendingVerifications.length, 
          description: 'payments to verify',
          details: {
            totalAmount: totalVerificationAmount,
            tournaments: [...new Set(pendingVerifications.map(p => p.tournament.name))].slice(0, 3)
          }
        });
      }
      
      if (paymentsDueToday.length > 0) {
        actionItems.push({ 
          type: 'pay', 
          count: paymentsDueToday.length, 
          description: 'organizers to pay today (30%)',
          details: {
            totalAmount: todayToPay,
            tournaments: paymentsDueToday.map(t => t.name).slice(0, 3)
          }
        });
      }
      
      if (overduePayments.length > 0) {
        actionItems.push({ 
          type: 'overdue', 
          count: overduePayments.length, 
          description: 'overdue payments (65%)',
          details: {
            totalAmount: overdueAmount,
            tournaments: overduePayments.map(t => t.name).slice(0, 3)
          }
        });
      }

      return {
        todayReceived,
        todayToPay,
        platformEarnings,
        pendingVerifications: pendingVerifications.length,
        overduePayments: overduePayments.length,
        actionItems
      };
    } catch (error) {
      console.error('Error getting dashboard data:', error);
      // Return empty state instead of throwing error
      return {
        todayReceived: 0,
        todayToPay: 0,
        platformEarnings: 0,
        pendingVerifications: 0,
        overduePayments: 0,
        actionItems: []
      };
    }
  }

  async getQuickStats() {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // Get all verified payments for this month
      const monthlyPayments = await prisma.registration.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          paymentStatus: 'verified'
        }
      });

      // Calculate monthly revenue (total collected from players)
      const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amountTotal, 0);
      
      // Calculate platform earnings (5% of total revenue)
      const monthlyEarnings = monthlyRevenue * 0.05;

      // Count unique organizers paid this month
      const paidOrganizers = await prisma.tournamentPayment.count({
        where: {
          OR: [
            { payout50PaidAt1: { gte: monthStart, lte: monthEnd } },
            { payout50PaidAt2: { gte: monthStart, lte: monthEnd } }
          ]
        }
      });

      // Calculate success rate (approved payments vs total payments)
      const totalPayments = await prisma.registration.count({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          paymentStatus: { in: ['verified', 'rejected'] }
        }
      });

      const approvedPayments = monthlyPayments.length;
      const successRate = totalPayments > 0 ? Math.round((approvedPayments / totalPayments) * 100) : 0;

      return {
        monthlyRevenue,
        monthlyEarnings,
        organizersPaid: paidOrganizers,
        successRate
      };
    } catch (error) {
      console.error('Error getting quick stats:', error);
      // Return zeros instead of throwing error
      return {
        monthlyRevenue: 0,
        monthlyEarnings: 0,
        organizersPaid: 0,
        successRate: 0
      };
    }
  }

  // ============================================
  // PAYMENT AUDIT TRAIL
  // ============================================

  async logPaymentTransaction(transactionData) {
    try {
      const logEntry = {
        timestamp: new Date().toISOString(),
        type: transactionData.type,
        tournamentId: transactionData.tournamentId,
        registrationId: transactionData.registrationId,
        amount: transactionData.amount,
        platformFee: transactionData.platformFee,
        organizerShare: transactionData.organizerShare,
        adminId: transactionData.adminId,
        metadata: transactionData.metadata || {}
      };

      // Save to CSV audit log
      const today = new Date().toISOString().split('T')[0];
      const auditFilename = `payment_audit_${today}.csv`;
      const auditFilepath = path.join(this.paymentsDir, auditFilename);

      // Check if file exists, if not create with headers
      let fileExists = false;
      try {
        await fs.access(auditFilepath);
        fileExists = true;
      } catch (error) {
        // File doesn't exist
      }

      let csvContent = '';
      if (!fileExists) {
        csvContent = 'Timestamp,Type,TournamentId,RegistrationId,Amount,PlatformFee,OrganizerShare,AdminId,Metadata\n';
      }

      // Add audit entry
      const csvRow = [
        logEntry.timestamp,
        logEntry.type,
        logEntry.tournamentId || '',
        logEntry.registrationId || '',
        logEntry.amount || 0,
        logEntry.platformFee || 0,
        logEntry.organizerShare || 0,
        logEntry.adminId || '',
        JSON.stringify(logEntry.metadata).replace(/,/g, ';') // Replace commas to avoid CSV issues
      ].join(',') + '\n';

      csvContent += csvRow;
      await fs.appendFile(auditFilepath, csvContent);

      console.log(`📝 Payment transaction logged: ${transactionData.type}`);
    } catch (error) {
      console.error('Error logging payment transaction:', error);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async updateTournamentPayment(tournamentId, paymentData) {
    try {
      const tournament = await prisma.tournament.findUnique({
        where: { id: tournamentId },
        include: { organizer: true }
      });

      if (!tournament) {
        throw new Error('Tournament not found');
      }

      await prisma.tournamentPayment.upsert({
        where: { tournamentId },
        update: {
          totalCollected: { increment: paymentData.totalAmount },
          totalRegistrations: { increment: 1 },
          platformFeeAmount: { increment: paymentData.platformFee },
          organizerShare: { increment: paymentData.organizerShare },
          payout50Percent1: { increment: paymentData.firstPayment },
          payout50Percent2: { increment: paymentData.secondPayment }
        },
        create: {
          tournamentId,
          organizerId: tournament.organizerId,
          totalCollected: paymentData.totalAmount,
          totalRegistrations: 1,
          platformFeeAmount: paymentData.platformFee,
          organizerShare: paymentData.organizerShare,
          payout50Percent1: paymentData.firstPayment,
          payout50Percent2: paymentData.secondPayment,
          platformFeePercent: 5.0
        }
      });

      // Log the payment transaction for audit trail
      await this.logPaymentTransaction({
        type: 'PAYMENT_APPROVED',
        tournamentId,
        registrationId: paymentData.registrationId,
        amount: paymentData.totalAmount,
        platformFee: paymentData.platformFee,
        organizerShare: paymentData.organizerShare,
        adminId: paymentData.adminId || null,
        metadata: {
          firstPayment: paymentData.firstPayment,
          secondPayment: paymentData.secondPayment
        }
      });

      console.log(`✅ Tournament payment updated: ${tournamentId}, Total: ₹${paymentData.totalAmount}`);
    } catch (error) {
      console.error('Error updating tournament payment:', error);
      throw error;
    }
  }

  async updateDailyReport() {
    try {
      await this.generateDailyReport();
    } catch (error) {
      console.error('Error updating daily report:', error);
    }
  }

  // ============================================
  // SCHEDULED TASKS
  // ============================================

  async runDailyTasks() {
    try {
      console.log('🔄 Running daily payment tasks...');
      
      // Generate daily report
      await this.generateDailyReport();
      
      // Check for payments due today
      await this.checkAllPaymentsDue();
      
      // Send daily summary to admin
      await this.sendDailySummaryToAdmin();
      
      console.log('✅ Daily payment tasks completed');
    } catch (error) {
      console.error('Error running daily tasks:', error);
    }
  }

  async checkAllPaymentsDue() {
    try {
      const tournaments = await prisma.tournament.findMany({
        include: { 
          organizer: true,
          payment: true
        }
      });

      for (const tournament of tournaments) {
        await this.checkOrganizerPaymentDue(tournament.id);
      }
    } catch (error) {
      console.error('Error checking all payments due:', error);
    }
  }

  async sendDailySummaryToAdmin() {
    try {
      const admin = await prisma.user.findFirst({
        where: { roles: { contains: 'ADMIN' } }
      });

      if (!admin) return;

      const dashboardData = await this.getPaymentDashboardData();

      await notificationService.createNotification(admin.id, {
        type: 'DAILY_SUMMARY',
        title: 'Daily MATCHIFY.PRO Payment Summary',
        message: `Tournament Payments - Received: ₹${dashboardData.todayReceived}, To Pay: ₹${dashboardData.todayToPay}, Platform Earnings: ₹${dashboardData.platformEarnings}`,
        data: JSON.stringify(dashboardData)
      });

      console.log('✅ Daily summary sent to admin');
    } catch (error) {
      console.error('Error sending daily summary:', error);
    }
  }
}

export default new AdminPaymentService();