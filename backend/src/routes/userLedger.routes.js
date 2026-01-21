import express from 'express';
import userPaymentLedgerService from '../services/userPaymentLedgerService.js';
import { authenticate } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Middleware to ensure only admins can access these routes
const requireAdmin = (req, res, next) => {
  if (!req.user.roles.includes('ADMIN')) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================
// USER LEDGER MANAGEMENT
// ============================================

// GET /api/user-ledger/users - Get all users with payment summaries
router.get('/users', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sortBy = 'currentBalance', order = 'desc' } = req.query;
    
    const result = await userPaymentLedgerService.getAllUsersSummary({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      order
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting users summary:', error);
    res.status(500).json({ error: 'Failed to get users summary' });
  }
});

// GET /api/user-ledger/user/:userId - Get specific user's payment summary
router.get('/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const summary = await userPaymentLedgerService.getUserSummary(userId);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting user summary:', error);
    res.status(500).json({ error: 'Failed to get user summary' });
  }
});

// GET /api/user-ledger/user/:userId/transactions - Get user's complete transaction history
router.get('/user/:userId/transactions', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 50, 
      type, 
      category, 
      startDate, 
      endDate 
    } = req.query;
    
    const result = await userPaymentLedgerService.getUserLedger(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      category,
      startDate,
      endDate
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({ error: 'Failed to get user transactions' });
  }
});

// POST /api/user-ledger/record-payment - Record a payment transaction
router.post('/record-payment', authenticate, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      type, // CREDIT (user to admin) or DEBIT (admin to user)
      category, // TOURNAMENT_ENTRY, REFUND, PRIZE_MONEY, etc.
      amount,
      description,
      tournamentId,
      registrationId,
      transactionRef,
      paymentMethod
    } = req.body;

    let result;
    if (type === 'CREDIT') {
      // User paid to admin
      result = await userPaymentLedgerService.recordUserPayment({
        userId,
        amount,
        tournamentId,
        registrationId,
        description,
        transactionRef,
        paymentMethod,
        adminId: req.user.id
      });
    } else if (type === 'DEBIT') {
      // Admin paid to user
      result = await userPaymentLedgerService.recordAdminPayment({
        userId,
        amount,
        category,
        description,
        tournamentId,
        registrationId,
        transactionRef,
        paymentMethod,
        adminId: req.user.id
      });
    } else {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/user-ledger/user/:userId/export - Export user's complete ledger as CSV
router.get('/user/:userId/export', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    const filepath = await userPaymentLedgerService.exportUserLedgerCSV(userId, startDate, endDate);
    
    // Send file for download
    res.download(filepath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
  } catch (error) {
    console.error('Error exporting user ledger:', error);
    res.status(500).json({ error: 'Failed to export user ledger' });
  }
});

// GET /api/user-ledger/stats - Get overall payment statistics
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // Get overall statistics
    const stats = await prisma.userPaymentSummary.aggregate({
      _sum: {
        totalCredits: true,
        totalDebits: true,
        totalTransactions: true
      },
      _count: {
        userId: true
      }
    });

    // Get users with highest balances
    const topCreditors = await prisma.userPaymentSummary.findMany({
      where: { currentBalance: { gt: 0 } },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { currentBalance: 'desc' },
      take: 10
    });

    // Get users with negative balances (admin owes them)
    const topDebtors = await prisma.userPaymentSummary.findMany({
      where: { currentBalance: { lt: 0 } },
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { currentBalance: 'asc' },
      take: 10
    });

    // Recent transactions
    const recentTransactions = await prisma.userPaymentLedger.findMany({
      include: {
        user: { select: { name: true, email: true } },
        tournament: { select: { name: true } }
      },
      orderBy: { transactionDate: 'desc' },
      take: 20
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers: stats._count.userId || 0,
          totalCredits: stats._sum.totalCredits || 0,
          totalDebits: stats._sum.totalDebits || 0,
          totalTransactions: stats._sum.totalTransactions || 0,
          netBalance: (stats._sum.totalCredits || 0) - (stats._sum.totalDebits || 0)
        },
        topCreditors,
        topDebtors,
        recentTransactions
      }
    });
  } catch (error) {
    console.error('Error getting ledger stats:', error);
    res.status(500).json({ error: 'Failed to get ledger stats' });
  }
});

// ============================================
// PLAYER ACCESS (Limited)
// ============================================

// GET /api/user-ledger/my-summary - Get current user's payment summary
router.get('/my-summary', authenticate, async (req, res) => {
  try {
    const summary = await userPaymentLedgerService.getUserSummary(req.user.id);
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error getting my summary:', error);
    res.status(500).json({ error: 'Failed to get payment summary' });
  }
});

// GET /api/user-ledger/my-transactions - Get current user's transaction history
router.get('/my-transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    
    const result = await userPaymentLedgerService.getUserLedger(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      startDate,
      endDate
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting my transactions:', error);
    res.status(500).json({ error: 'Failed to get transaction history' });
  }
});

export default router;