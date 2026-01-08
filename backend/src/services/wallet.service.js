import { PrismaClient } from '@prisma/client';
import razorpayService from './razorpay.service.js';

const prisma = new PrismaClient();

// Transaction types
export const TRANSACTION_TYPES = {
  TOPUP: 'TOPUP',
  REGISTRATION_FEE: 'REGISTRATION_FEE',
  REFUND: 'REFUND',
  WITHDRAWAL: 'WITHDRAWAL',
  ADMIN_CREDIT: 'ADMIN_CREDIT',
  ADMIN_DEBIT: 'ADMIN_DEBIT'
};

// Transaction statuses
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REFUNDED: 'REFUNDED'
};

class WalletService {
  // Get user's wallet balance
  async getBalance(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    });

    if (!user) throw new Error('User not found');
    return user.walletBalance;
  }

  // Create top-up order
  async createTopupOrder(userId, amount) {
    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    if (amount < 25 || amount > 100000) {
      throw new Error('Amount must be between ₹25 and ₹100,000');
    }

    // Get current balance
    const currentBalance = await this.getBalance(userId);

    // Create Razorpay order
    const order = await razorpayService.createOrder(amount, userId);

    // Create pending transaction
    const transaction = await prisma.walletTransaction.create({
      data: {
        userId: userId,
        type: TRANSACTION_TYPES.TOPUP,
        amount: amount,
        balanceBefore: currentBalance,
        balanceAfter: currentBalance + amount, // Expected balance
        description: `Wallet top-up of ₹${amount}`,
        paymentGateway: 'razorpay',
        razorpayOrderId: order.id,
        status: TRANSACTION_STATUS.PENDING,
      },
    });

    return {
      transactionId: transaction.id,
      orderId: order.id,
      amount: amount,
      currency: 'INR',
      razorpayKey: process.env.RAZORPAY_KEY_ID,
    };
  }

  // Complete top-up after payment verification
  async completeTopup(orderId, paymentId, signature) {
    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature(
      orderId,
      paymentId,
      signature
    );

    if (!isValid) {
      throw new Error('Invalid payment signature');
    }

    // Find transaction
    const transaction = await prisma.walletTransaction.findFirst({
      where: { razorpayOrderId: orderId },
    });

    if (!transaction) throw new Error('Transaction not found');
    if (transaction.status === TRANSACTION_STATUS.COMPLETED) {
      throw new Error('Transaction already completed');
    }

    // Update transaction and user balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update transaction
      const updatedTransaction = await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TRANSACTION_STATUS.COMPLETED,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          updatedAt: new Date(),
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          walletBalance: { increment: transaction.amount },
        },
      });

      return updatedTransaction;
    });

    return result;
  }

  // Get user transactions (paginated)
  async getTransactions(userId, page = 1, limit = 20, type = null) {
    const skip = (page - 1) * limit;

    const where = { userId: userId };
    if (type && Object.values(TRANSACTION_TYPES).includes(type)) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.walletTransaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Deduct amount from wallet (for registrations)
  async deductAmount(userId, amount, description, referenceId = null) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const balance = await this.getBalance(userId);

    if (balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: userId,
          type: TRANSACTION_TYPES.REGISTRATION_FEE,
          amount: -amount, // Negative for deduction
          balanceBefore: balance,
          balanceAfter: balance - amount,
          description,
          referenceId: referenceId,
          paymentGateway: 'wallet',
          status: TRANSACTION_STATUS.COMPLETED,
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: amount },
        },
      });

      return transaction;
    });

    return result;
  }

  // Refund amount to wallet
  async refundAmount(userId, amount, description, referenceId = null) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const balance = await this.getBalance(userId);

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: userId,
          type: TRANSACTION_TYPES.REFUND,
          amount: amount,
          balanceBefore: balance,
          balanceAfter: balance + amount,
          description,
          referenceId: referenceId,
          paymentGateway: 'wallet',
          status: TRANSACTION_STATUS.COMPLETED,
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: amount },
        },
      });

      return transaction;
    });

    return result;
  }

  // Admin credit/debit functions
  async adminCredit(userId, amount, description, adminId) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const balance = await this.getBalance(userId);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: userId,
          type: TRANSACTION_TYPES.ADMIN_CREDIT,
          amount: amount,
          balanceBefore: balance,
          balanceAfter: balance + amount,
          description: `Admin Credit: ${description}`,
          referenceId: adminId,
          paymentGateway: 'admin',
          status: TRANSACTION_STATUS.COMPLETED,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: amount },
        },
      });

      return transaction;
    });

    return result;
  }

  async adminDebit(userId, amount, description, adminId) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const balance = await this.getBalance(userId);

    if (balance < amount) {
      throw new Error('Insufficient wallet balance');
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: userId,
          type: TRANSACTION_TYPES.ADMIN_DEBIT,
          amount: -amount,
          balanceBefore: balance,
          balanceAfter: balance - amount,
          description: `Admin Debit: ${description}`,
          referenceId: adminId,
          paymentGateway: 'admin',
          status: TRANSACTION_STATUS.COMPLETED,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { decrement: amount },
        },
      });

      return transaction;
    });

    return result;
  }

  // Get wallet summary
  async getWalletSummary(userId) {
    const [balance, totalTopups, totalSpent, totalRefunds, recentTransactions] = await Promise.all([
      this.getBalance(userId),
      prisma.walletTransaction.aggregate({
        where: { userId, type: TRANSACTION_TYPES.TOPUP, status: TRANSACTION_STATUS.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { userId, type: TRANSACTION_TYPES.REGISTRATION_FEE, status: TRANSACTION_STATUS.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.aggregate({
        where: { userId, type: TRANSACTION_TYPES.REFUND, status: TRANSACTION_STATUS.COMPLETED },
        _sum: { amount: true },
      }),
      prisma.walletTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    return {
      currentBalance: balance,
      totalTopups: totalTopups._sum.amount || 0,
      totalSpent: Math.abs(totalSpent._sum.amount || 0),
      totalRefunds: totalRefunds._sum.amount || 0,
      recentTransactions,
    };
  }
}

export default new WalletService();