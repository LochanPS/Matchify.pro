import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get all tournament payments
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    // For simplified SQLite schema, return empty data
    res.json({
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0
      }
    });
  } catch (error) {
    console.error('Error fetching tournament payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament payments'
    });
  }
});

// Get tournament payment by ID
router.get('/:tournamentId', authenticate, requireAdmin, async (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Tournament payment not found'
    });
  } catch (error) {
    console.error('Error fetching tournament payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournament payment'
    });
  }
});

// Get payment stats
router.get('/stats/overview', authenticate, requireAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalCollected: 0,
        totalPending: 0,
        totalPaid: 0,
        platformFees: 0
      }
    });
  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment stats'
    });
  }
});

// Get pending payouts (for organizer payout page)
router.get('/pending/payouts', authenticate, requireAdmin, async (req, res) => {
  try {
    // For simplified SQLite schema, return empty data
    res.json({
      success: true,
      data: []
    });
  } catch (error) {
    console.error('Error fetching pending payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending payouts'
    });
  }
});

// Mark payment as paid
router.post('/:tournamentId/mark-paid', authenticate, requireAdmin, async (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Tournament payment not found'
    });
  } catch (error) {
    console.error('Error marking payment as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payment as paid'
    });
  }
});

// Mark first 30% payout as paid
router.post('/:tournamentId/payout-50-1/mark-paid', authenticate, requireAdmin, async (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Tournament payment not found'
    });
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid'
    });
  }
});

// Mark second 65% payout as paid
router.post('/:tournamentId/payout-50-2/mark-paid', authenticate, requireAdmin, async (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Tournament payment not found'
    });
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payout as paid'
    });
  }
});

export default router;
