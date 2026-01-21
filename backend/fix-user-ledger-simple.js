// Simple script to create user ledger entries for recent registrations
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserLedger() {
  try {
    console.log('🔧 Creating missing user ledger entries...');
    
    // Find recent registrations with screenshots
    const recentRegistrations = await prisma.registration.findMany({
      where: {
        AND: [
          { paymentScreenshot: { not: null } },
          { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } // Last 24 hours
        ]
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        tournament: {
          select: { id: true, name: true }
        },
        category: {
          select: { name: true }
        }
      }
    });
    
    console.log(`\n📋 Found ${recentRegistrations.length} recent registrations for ledger entries`);
    
    for (const registration of recentRegistrations) {
      console.log(`\n💰 Creating ledger entry for: ${registration.user.name} - ₹${registration.amountTotal}`);
      
      try {
        // Check if ledger entry already exists
        const existingEntry = await prisma.userPaymentLedger.findFirst({
          where: {
            userId: registration.userId,
            registrationId: registration.id
          }
        });
        
        if (existingEntry) {
          console.log('  ⚠️ Ledger entry already exists, skipping');
          continue;
        }
        
        // Create ledger entry
        await prisma.userPaymentLedger.create({
          data: {
            userId: registration.userId,
            type: 'CREDIT', // User paid to admin
            category: 'TOURNAMENT_ENTRY',
            amount: registration.amountTotal,
            description: `Tournament entry fee for ${registration.tournament.name} - ${registration.category.name}`,
            transactionRef: `REG-${registration.id}`,
            paymentMethod: 'UPI',
            screenshot: registration.paymentScreenshot,
            registrationId: registration.id,
            tournamentId: registration.tournamentId,
            status: 'pending', // Pending admin approval
            transactionDate: registration.createdAt
          }
        });
        console.log('  ✅ Created ledger entry');
        
        // Update or create user payment summary
        const existingSummary = await prisma.userPaymentSummary.findUnique({
          where: { userId: registration.userId }
        });
        
        if (existingSummary) {
          await prisma.userPaymentSummary.update({
            where: { userId: registration.userId },
            data: {
              totalCredits: { increment: registration.amountTotal },
              totalTransactions: { increment: 1 },
              creditTransactions: { increment: 1 },
              currentBalance: { increment: registration.amountTotal },
              lastTransactionDate: registration.createdAt,
              lastTransactionAmount: registration.amountTotal,
              lastTransactionType: 'CREDIT'
            }
          });
          console.log('  ✅ Updated payment summary');
        } else {
          await prisma.userPaymentSummary.create({
            data: {
              userId: registration.userId,
              totalCredits: registration.amountTotal,
              totalDebits: 0,
              currentBalance: registration.amountTotal,
              totalTransactions: 1,
              creditTransactions: 1,
              debitTransactions: 0,
              lastTransactionDate: registration.createdAt,
              lastTransactionAmount: registration.amountTotal,
              lastTransactionType: 'CREDIT'
            }
          });
          console.log('  ✅ Created payment summary');
        }
        
      } catch (error) {
        console.error(`  ❌ Error creating ledger entry:`, error.message);
      }
    }
    
    // Show summary
    const totalLedgerEntries = await prisma.userPaymentLedger.count();
    const totalSummaries = await prisma.userPaymentSummary.count();
    
    console.log('\n📊 User Ledger Summary:');
    console.log(`  Total ledger entries: ${totalLedgerEntries}`);
    console.log(`  Total user summaries: ${totalSummaries}`);
    
    // Show recent entries
    const recentEntries = await prisma.userPaymentLedger.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        user: {
          select: { name: true }
        }
      }
    });
    
    console.log('\n💰 Recent ledger entries:');
    recentEntries.forEach((entry, index) => {
      console.log(`${index + 1}. ${entry.user.name} - ${entry.type} - ₹${entry.amount}`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing user ledger:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserLedger();