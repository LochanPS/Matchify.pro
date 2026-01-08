import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

class RazorpayService {
  // Create order for wallet top-up
  async createOrder(amount, userId) {
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise and ensure integer
        currency: 'INR',
        receipt: `topup_${userId}_${Date.now()}`,
        notes: {
          user_id: userId,
          type: 'TOPUP',
        },
      };

      const order = await razorpay.orders.create(options);
      return order;
    } catch (error) {
      console.error('Razorpay order creation failed:', error);
      throw new Error('Failed to create payment order');
    }
  }

  // Verify payment signature
  verifyPaymentSignature(orderId, paymentId, signature) {
    const text = `${orderId}|${paymentId}`;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    return generated_signature === signature;
  }

  // Verify webhook signature
  verifyWebhookSignature(webhookBody, webhookSignature) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(webhookBody)
      .digest('hex');

    return expectedSignature === webhookSignature;
  }

  // Fetch payment details
  async getPaymentDetails(paymentId) {
    try {
      return await razorpay.payments.fetch(paymentId);
    } catch (error) {
      console.error('Failed to fetch payment:', error);
      throw error;
    }
  }

  // Create refund
  async createRefund(paymentId, amount, notes = {}) {
    try {
      const refundData = {
        amount: Math.round(amount * 100), // Convert to paise
        notes,
      };

      return await razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      console.error('Failed to create refund:', error);
      throw error;
    }
  }
}

export default new RazorpayService();