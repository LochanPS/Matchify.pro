import prisma from '../lib/prisma.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class UserPaymentLedgerService {
  constructor() {
    this.ledgerDir = path.join(__dirname, '../../user_ledgers');
    this.ensureDirectoryExists();
  }

  async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.ledgerDir, { recursive: true });
    } catch (error) {
      console.error('Error creating ledger directory:', error);
    }
  }

  // ============================================
  // LEDGER ENTRY CREATION
  // ============================================

  /**
   * Record a payment from user to admin (CREDIT)
   * Example: Ravi pays ₹10,000 for tournament entry
   */
  async recordUserPayment(data) {
    try {
      const {
        userId,
        amount,
        tournamentId,
        registrationId,
        description,
        transactionRef,
        paymentMethod = 'UPI',
        screenshot,
        adminId
      } = data;

      // Create ledger entry
      const ledgerEntry = await prisma.userPaymentLedger.create({
        data: {
          userId,
          type: 'CREDIT', // User paid to admin
          category: 'TOURNAMENT_ENTRY',
          amount,
          description: description || `Badminton tournament entry fee payment`,
          tournamentId,
          registrationId,
          adminId,
          transactionRef,
          paymentMethod,
          screenshot,
          status: 'confirmed',
          verifiedBy: adminId,
          verifiedAt: new Date(),
          transactionDate: new Date()
        }
      });

      // Update user's running balance and summary
      await this.updateUserBalance(userId, amount, 'CREDIT');

      // Save to CSV file
      await this.saveLedgerToCSV(userId, ledgerEntry);

      console.log(`✅ User payment recorded: ${userId} paid ₹${amount}`);
      return ledgerEntry;
    } catch (error) {
      console.error('Error recording user payment:', error);
      throw error;
    }
  }

  /**
   * Record a payment from admin to user (DEBIT)
   * Example: Admin pays ₹5,000 refund to Ravi
   */
  async recordAdminPayment(data) {
    try {
      const {
        userId,
        amount,
        category, // REFUND, PRIZE_MONEY, BONUS, PENALTY_REVERSAL
        description,
        tournamentId,
        registrationId,
        transactionRef,
        paymentMethod = 'UPI',
        adminId
      } = data;

      // Create ledger entry
      const ledgerEntry = await prisma.userPaymentLedger.create({
        data: {
          userId,
          type: 'DEBIT', // Admin paid to user
          category,
          amount,
          description,
          tournamentId,
          registrationId,
          adminId,
          transactionRef,
          paymentMethod,
          status: 'confirmed',
          verifiedBy: adminId,
          verifiedAt: new Date(),
          transactionDate: new Date()
        }
      });

      // Update user's running balance and summary
      await this.updateUserBalance(userId, amount, 'DEBIT');

      // Save to CSV file
      await this.saveLedgerToCSV(userId, ledgerEntry);

      console.log(`✅ Admin payment recorded: Admin paid ₹${amount} to ${userId}`);
      return ledgerEntry;
    } catch (error) {
      console.error('Error recording admin payment:', error);
      throw error;
    }
  }

  // ============================================
  // BALANCE MANAGEMENT
  // ============================================

  async updateUserBalance(userId, amount, type) {
    try {
      // Get or create user payment summary
      let summary = await prisma.userPaymentSummary.findUnique({
        where: { userId }
      });

      if (!summary) {
        summary = await prisma.userPaymentSummary.create({
          data: {
            userId,
            totalCredits: 0,
            totalDebits: 0,
            currentBalance: 0,
            totalTransactions: 0,
            creditTransactions: 0,
            debitTransactions: 0
          }
        });
      }

      // Calculate new balances
      const updates = {
        totalTransactions: { increment: 1 },
        lastTransactionDate: new Date(),
        lastTransactionAmount: amount,
        lastTransactionType: type
      };

      if (type === 'CREDIT') {
        // User paid to admin
        updates.totalCredits = { increment: amount };
        updates.creditTransactions = { increment: 1 };
        updates.currentBalance = { increment: amount }; // Positive balance = user has paid more
      } else {
        // Admin paid to user
        updates.totalDebits = { increment: amount };
        updates.debitTransactions = { increment: 1 };
        updates.currentBalance = { decrement: amount }; // Negative balance = admin owes user
      }

      // Update summary
      const updatedSummary = await prisma.userPaymentSummary.update({
        where: { userId },
        data: updates
      });

      // Update running balance in the ledger entry
      const runningBalance = updatedSummary.currentBalance;
      await prisma.userPaymentLedger.updateMany({
        where: {
          userId,
          runningBalance: 0 // Find the entry we just created
        },
        data: { runningBalance }
      });

      return updatedSummary;
    } catch (error) {
      console.error('Error updating user balance:', error);
      throw error;
    }
  }

  // ============================================
  // LEDGER RETRIEVAL
  // ============================================

  /**
   * Get complete payment history for a user
   * Example: Get all of Ravi's transactions
   */
  async getUserLedger(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        type, // CREDIT, DEBIT
        category, // TOURNAMENT_ENTRY, REFUND, etc.
        startDate,
        endDate
      } = options;

      const where = { userId };
      
      if (type) where.type = type;
      if (category) where.category = category;
      if (startDate || endDate) {
        where.transactionDate = {};
        if (startDate) where.transactionDate.gte = new Date(startDate);
        if (endDate) where.transactionDate.lte = new Date(endDate);
      }

      const [ledgerEntries, total] = await Promise.all([
        prisma.userPaymentLedger.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true }
            },
            tournament: {
              select: { id: true, name: true, startDate: true }
            },
            registration: {
              select: { id: true, amountTotal: true }
            }
          },
          orderBy: { transactionDate: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.userPaymentLedger.count({ where })
      ]);

      return {
        ledgerEntries,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user ledger:', error);
      throw error;
    }
  }

  /**
   * Get user payment summary
   * Example: Ravi's total credits, debits, and balance
   */
  async getUserSummary(userId) {
    try {
      const summary = await prisma.userPaymentSummary.findUnique({
        where: { userId },
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true }
          }
        }
      });

      if (!summary) {
        // Create empty summary if doesn't exist
        return await prisma.userPaymentSummary.create({
          data: {
            userId,
            totalCredits: 0,
            totalDebits: 0,
            currentBalance: 0,
            totalTransactions: 0,
            creditTransactions: 0,
            debitTransactions: 0
          },
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true }
            }
          }
        });
      }

      return summary;
    } catch (error) {
      console.error('Error getting user summary:', error);
      throw error;
    }
  }

  /**
   * Get all users with their payment summaries
   * For admin to see all users' payment status
   */
  async getAllUsersSummary(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        search,
        sortBy = 'currentBalance',
        order = 'desc'
      } = options;

      const where = {};
      
      if (search) {
        where.user = {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        };
      }

      const [summaries, total] = await Promise.all([
        prisma.userPaymentSummary.findMany({
          where,
          include: {
            user: {
              select: { id: true, name: true, email: true, phone: true, city: true }
            }
          },
          orderBy: { [sortBy]: order },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.userPaymentSummary.count({ where })
      ]);

      return {
        summaries: summaries || [],
        pagination: {
          page,
          limit,
          total: total || 0,
          pages: Math.ceil((total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error getting all users summary:', error);
      // Return empty state instead of throwing error
      return {
        summaries: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // ============================================
  // FILE MANAGEMENT
  // ============================================

  async saveLedgerToCSV(userId, ledgerEntry) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const filename = `user_${userId}_ledger_${today}.csv`;
      const filepath = path.join(this.ledgerDir, filename);

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
        csvContent = 'Date,Time,Type,Category,Amount,Description,TournamentId,RegistrationId,TransactionRef,PaymentMethod,RunningBalance,Status\n';
      }

      // Add ledger entry
      const timestamp = new Date(ledgerEntry.transactionDate);
      const csvRow = [
        timestamp.toISOString().split('T')[0],
        timestamp.toTimeString().split(' ')[0],
        ledgerEntry.type,
        ledgerEntry.category,
        ledgerEntry.amount,
        `"${ledgerEntry.description}"`, // Quoted to handle commas
        ledgerEntry.tournamentId || '',
        ledgerEntry.registrationId || '',
        ledgerEntry.transactionRef || '',
        ledgerEntry.paymentMethod || '',
        ledgerEntry.runningBalance,
        ledgerEntry.status
      ].join(',') + '\n';

      csvContent += csvRow;
      await fs.appendFile(filepath, csvContent);

      console.log(`✅ Ledger entry saved to ${filename}`);
    } catch (error) {
      console.error('Error saving ledger to CSV:', error);
    }
  }

  async exportUserLedgerCSV(userId, startDate, endDate) {
    try {
      const ledgerData = await this.getUserLedger(userId, {
        startDate,
        endDate,
        limit: 10000 // Get all entries
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      const filename = `${user.name.replace(/\s+/g, '_')}_complete_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      const filepath = path.join(this.ledgerDir, filename);

      let csvContent = `User: ${user.name} (${user.email})\n`;
      csvContent += `Export Date: ${new Date().toISOString()}\n`;
      csvContent += `Period: ${startDate || 'All'} to ${endDate || 'All'}\n\n`;
      csvContent += 'Date,Time,Type,Category,Amount,Description,Tournament,TransactionRef,RunningBalance,Status\n';

      for (const entry of ledgerData.ledgerEntries) {
        const timestamp = new Date(entry.transactionDate);
        const csvRow = [
          timestamp.toISOString().split('T')[0],
          timestamp.toTimeString().split(' ')[0],
          entry.type,
          entry.category,
          entry.amount,
          `"${entry.description}"`,
          entry.tournament?.name || '',
          entry.transactionRef || '',
          entry.runningBalance,
          entry.status
        ].join(',') + '\n';
        csvContent += csvRow;
      }

      await fs.writeFile(filepath, csvContent);
      return filepath;
    } catch (error) {
      console.error('Error exporting user ledger CSV:', error);
      throw error;
    }
  }
}

export default new UserPaymentLedgerService();