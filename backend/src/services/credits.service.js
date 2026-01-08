import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Credit transaction types
export const CREDIT_TYPES = {
  ADMIN_GRANT: 'ADMIN_GRANT',           // Admin manually grants credits
  PROMOTIONAL: 'PROMOTIONAL',            // Promotional/welcome credits
  PLATFORM_FEE_DEDUCTION: 'PLATFORM_FEE_DEDUCTION', // Used for platform fees
  EXPIRED: 'EXPIRED',                    // Credits expired
  ADJUSTMENT: 'ADJUSTMENT'               // Manual adjustment
};

// Credit transaction statuses
export const CREDIT_STATUS = {
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  REVERSED: 'REVERSED'
};

class CreditsService {
  // Get or create user's credits account
  async getOrCreateCreditsAccount(userId) {
    let credits = await prisma.matchifyCredits.findUnique({
      where: { userId }
    });

    if (!credits) {
      credits = await prisma.matchifyCredits.create({
        data: {
          userId,
          balance: 0,
          lifetimeEarned: 0,
          lifetimeUsed: 0
        }
      });
    }

    return credits;
  }

  // Get user's credits balance
  async getBalance(userId) {
    const credits = await this.getOrCreateCreditsAccount(userId);
    return credits.balance;
  }

  // Get credits summary
  async getCreditsSummary(userId) {
    const credits = await this.getOrCreateCreditsAccount(userId);
    
    const recentTransactions = await prisma.creditTransaction.findMany({
      where: { creditsId: credits.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return {
      balance: credits.balance,
      lifetimeEarned: credits.lifetimeEarned,
      lifetimeUsed: credits.lifetimeUsed,
      recentTransactions
    };
  }

  // Get credits transaction history
  async getTransactions(userId, page = 1, limit = 20, type = null) {
    const credits = await this.getOrCreateCreditsAccount(userId);
    const skip = (page - 1) * limit;

    const where = { creditsId: credits.id };
    if (type && Object.values(CREDIT_TYPES).includes(type)) {
      where.type = type;
    }

    const [transactions, total] = await Promise.all([
      prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.creditTransaction.count({ where })
    ]);

    return {
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Admin grants credits to user
  async grantCredits(userId, amount, description, adminId, expiresAt = null) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const credits = await this.getOrCreateCreditsAccount(userId);

    const result = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const transaction = await tx.creditTransaction.create({
        data: {
          creditsId: credits.id,
          type: CREDIT_TYPES.ADMIN_GRANT,
          amount: amount,
          balanceBefore: credits.balance,
          balanceAfter: credits.balance + amount,
          description,
          referenceId: adminId,
          referenceType: 'ADMIN',
          grantedBy: adminId,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          status: CREDIT_STATUS.COMPLETED
        }
      });

      // Update credits balance
      await tx.matchifyCredits.update({
        where: { id: credits.id },
        data: {
          balance: { increment: amount },
          lifetimeEarned: { increment: amount }
        }
      });

      return transaction;
    });

    return result;
  }


  // Grant promotional credits (welcome bonus, etc.)
  async grantPromotionalCredits(userId, amount, description, expiresAt = null) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const credits = await this.getOrCreateCreditsAccount(userId);

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: {
          creditsId: credits.id,
          type: CREDIT_TYPES.PROMOTIONAL,
          amount: amount,
          balanceBefore: credits.balance,
          balanceAfter: credits.balance + amount,
          description,
          referenceType: 'PROMOTION',
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          status: CREDIT_STATUS.COMPLETED
        }
      });

      await tx.matchifyCredits.update({
        where: { id: credits.id },
        data: {
          balance: { increment: amount },
          lifetimeEarned: { increment: amount }
        }
      });

      return transaction;
    });

    return result;
  }

  // Deduct credits for platform fees (tournament creation, etc.)
  async deductPlatformFee(userId, amount, description, tournamentId = null) {
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid amount');
    }

    const credits = await this.getOrCreateCreditsAccount(userId);

    if (credits.balance < amount) {
      throw new Error('Insufficient credits balance');
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: {
          creditsId: credits.id,
          type: CREDIT_TYPES.PLATFORM_FEE_DEDUCTION,
          amount: -amount,
          balanceBefore: credits.balance,
          balanceAfter: credits.balance - amount,
          description,
          referenceId: tournamentId,
          referenceType: 'TOURNAMENT',
          status: CREDIT_STATUS.COMPLETED
        }
      });

      await tx.matchifyCredits.update({
        where: { id: credits.id },
        data: {
          balance: { decrement: amount },
          lifetimeUsed: { increment: amount }
        }
      });

      return transaction;
    });

    return result;
  }

  // Check if user has enough credits
  async hasEnoughCredits(userId, amount) {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  // Admin adjustment (can be positive or negative)
  async adjustCredits(userId, amount, description, adminId) {
    if (!amount || isNaN(amount) || amount === 0) {
      throw new Error('Invalid amount');
    }

    const credits = await this.getOrCreateCreditsAccount(userId);

    // If negative adjustment, check balance
    if (amount < 0 && credits.balance < Math.abs(amount)) {
      throw new Error('Insufficient credits for negative adjustment');
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.creditTransaction.create({
        data: {
          creditsId: credits.id,
          type: CREDIT_TYPES.ADJUSTMENT,
          amount: amount,
          balanceBefore: credits.balance,
          balanceAfter: credits.balance + amount,
          description: `Adjustment: ${description}`,
          referenceId: adminId,
          referenceType: 'ADMIN',
          grantedBy: adminId,
          status: CREDIT_STATUS.COMPLETED
        }
      });

      const updateData = {
        balance: amount > 0 ? { increment: amount } : { decrement: Math.abs(amount) }
      };

      if (amount > 0) {
        updateData.lifetimeEarned = { increment: amount };
      } else {
        updateData.lifetimeUsed = { increment: Math.abs(amount) };
      }

      await tx.matchifyCredits.update({
        where: { id: credits.id },
        data: updateData
      });

      return transaction;
    });

    return result;
  }

  // Get all users with credits (for admin)
  async getAllUsersCredits(page = 1, limit = 20, search = '') {
    const skip = (page - 1) * limit;

    const where = search ? {
      user: {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } }
        ]
      }
    } : {};

    const [credits, total] = await Promise.all([
      prisma.matchifyCredits.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { balance: 'desc' },
        skip,
        take: limit
      }),
      prisma.matchifyCredits.count({ where })
    ]);

    return {
      credits,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }
}

export default new CreditsService();
