import express from 'express';
import prisma from '../../lib/prisma.js';
import { authenticate, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();

// Get all payment verifications (with filters)
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
    console.error('Error fetching payment verifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment verifications'
    });
  }
});

// Get payment verification stats
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    // For simplified SQLite schema, return zero stats
    res.json({
      success: true,
      data: {
        pending: 0,
        approved: 0,
        rejected: 0,
        totalAmount: 0
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

// Approve payment
router.post('/:id/approve', authenticate, requireAdmin, async (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Payment verification not found'
    });
  } catch (error) {
    console.error('Error approving payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve payment'
    });
  }
});

// Reject payment
router.post('/:id/reject', authenticate, requireAdmin, async (req, res) => {
  try {
    res.status(404).json({
      success: false,
      message: 'Payment verification not found'
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject payment'
    });
  }
});

export default router;
