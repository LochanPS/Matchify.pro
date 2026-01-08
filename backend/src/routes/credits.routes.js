import express from 'express';
import creditsService from '../services/credits.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// USER ROUTES
// ============================================

// Get credits balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await creditsService.getBalance(req.user.id);
    res.json({
      success: true,
      balance
    });
  } catch (error) {
    console.error('Get credits balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get credits summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const summary = await creditsService.getCreditsSummary(req.user.id);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get credits summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get credits transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const result = await creditsService.getTransactions(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      type
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get credits transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Admin: Get all users with credits
router.get('/admin/all', authenticate, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await creditsService.getAllUsersCredits(
      parseInt(page),
      parseInt(limit),
      search
    );
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get all users credits error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Grant credits to user
router.post('/admin/grant', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, description, expiresAt } = req.body;

    if (!userId || !amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and description are required'
      });
    }

    const transaction = await creditsService.grantCredits(
      userId,
      parseFloat(amount),
      description,
      req.user.id,
      expiresAt
    );

    res.json({
      success: true,
      message: `Successfully granted ₹${amount} credits`,
      data: transaction
    });
  } catch (error) {
    console.error('Grant credits error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Adjust credits (positive or negative)
router.post('/admin/adjust', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, description } = req.body;

    if (!userId || amount === undefined || !description) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and description are required'
      });
    }

    const transaction = await creditsService.adjustCredits(
      userId,
      parseFloat(amount),
      description,
      req.user.id
    );

    res.json({
      success: true,
      message: `Successfully adjusted credits by ₹${amount}`,
      data: transaction
    });
  } catch (error) {
    console.error('Adjust credits error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Grant promotional credits to user
router.post('/admin/promotional', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, amount, description, expiresAt } = req.body;

    if (!userId || !amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'userId, amount, and description are required'
      });
    }

    const transaction = await creditsService.grantPromotionalCredits(
      userId,
      parseFloat(amount),
      description,
      expiresAt
    );

    res.json({
      success: true,
      message: `Successfully granted ₹${amount} promotional credits`,
      data: transaction
    });
  } catch (error) {
    console.error('Grant promotional credits error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Admin: Get user's credits details
router.get('/admin/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const summary = await creditsService.getCreditsSummary(userId);
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get user credits error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
