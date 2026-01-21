// Create user payment summary
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSummary() {
  try {
    // Find the user from the ledger entry
    const ledgerEntry = await prisma.userPaymentLedger.findFirst({
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });
    
    if (!ledgerEntry) {
      console.log('No ledger entries found');
      return;
    }
    
    console.log(`Creating summary for: ${ledgerEntry.user.name}`);
    
    await prisma.userPaymentSummary.create({
      data: {
        userId: ledgerEntry.userId,
        totalCredits: ledgerEntry.amount,
        totalDebits: 0,
        currentBalance: ledgerEntry.amount,
        totalTransactions: 1,
        creditTransactions: 1,
        debitTransactions: 0,
        lastTransactionDate: ledgerEntry.transactionDate,
        lastTransactionAmount: ledgerEntry.amount,
        lastTransactionType: 'CREDIT'
      }
    });
    
    console.log('✅ Summary created successfully');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSummary();