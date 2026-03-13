import express from 'express';
import razorpayService from '../services/razorpay.service.js';
import walletService from '../services/wallet.service.js';

const router = express.Router();

// Razorpay webhook (NO authentication middleware!)
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    
    if (!signature) {
      console.log('No signature provided in webhook');
      return res.status(400).json({ error: 'No signature provided' });
    }

    // Verify webhook signature
    const isValid = razorpayService.verifyWebhookSignature(
      req.body,
      signature
    );

    if (!isValid) {
      console.log('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const event = JSON.parse(req.body.toString());
    console.log('Webhook event received:', event.event);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      
      try {
        await walletService.completeTopup(
          payment.order_id,
          payment.id,
          signature // This will be verified again in service
        );
        
        console.log('Payment captured and processed:', payment.id);
      } catch (error) {
        console.error('Error processing captured payment:', error.message);
        // Don't return error to Razorpay, as payment was successful
      }
    }

    // Handle payment.failed event
    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity;
      console.log('Payment failed:', payment.id);
      
      // TODO: Mark transaction as failed in database
      // This can be implemented later when needed
    }

    // Handle order.paid event (backup for payment.captured)
    if (event.event === 'order.paid') {
      const order = event.payload.order.entity;
      console.log('Order paid:', order.id);
      
      // This is a backup event, payment.captured should handle the main logic
    }

    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test webhook endpoint (for development)
router.post('/test', async (req, res) => {
  try {
    console.log('Test webhook received:', req.body);
    res.json({ status: 'test webhook received', data: req.body });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;