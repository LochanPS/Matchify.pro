import express from 'express';
import walletService from '../services/wallet.service.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const balance = await walletService.getBalance(req.user.id);
    res.json({
      success: true,
      balance,
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get wallet summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    const summary = await walletService.getWalletSummary(req.user.id);
    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Create top-up order
router.post('/topup', authenticate, async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount',
      });
    }

    const order = await walletService.createTopupOrder(
      req.user.id,
      parseFloat(amount)
    );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Create topup order error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Verify payment and complete top-up
router.post('/topup/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing payment details',
      });
    }

    const transaction = await walletService.completeTopup(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.json({
      success: true,
      message: 'Top-up successful',
      data: transaction,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    const result = await walletService.getTransactions(
      req.user.id,
      parseInt(page),
      parseInt(limit),
      type
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Deduct amount (for internal use - tournament registrations)
router.post('/deduct', authenticate, async (req, res) => {
  try {
    const { amount, description, referenceId } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'Amount and description are required',
      });
    }

    const transaction = await walletService.deductAmount(
      req.user.id,
      parseFloat(amount),
      description,
      referenceId
    );

    res.json({
      success: true,
      message: 'Amount deducted successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Deduct amount error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// Refund amount (for internal use - tournament cancellations)
router.post('/refund', authenticate, async (req, res) => {
  try {
    const { amount, description, referenceId } = req.body;

    if (!amount || !description) {
      return res.status(400).json({
        success: false,
        error: 'Amount and description are required',
      });
    }

    const transaction = await walletService.refundAmount(
      req.user.id,
      parseFloat(amount),
      description,
      referenceId
    );

    res.json({
      success: true,
      message: 'Amount refunded successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Refund amount error:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;