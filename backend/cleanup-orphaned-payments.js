import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupOrphanedPayments() {
  try {
    console.log('🔍 Finding orphaned tournament payments...');
    
    // Get all tournament payments
    const allPayments = await prisma.tournamentPayment.findMany({
      select: {
        tournamentId: true
      }
    });
    
    console.log(`📋 Found ${allPayments.length} tournament payments`);
    
    // Check each payment for valid tournament
    const orphanedIds = [];
    for (const payment of allPayments) {
      const tournament = await prisma.tournament.findUnique({
        where: { id: payment.tournamentId }
      });
      
      if (!tournament) {
        console.log(`❌ Orphaned payment found: ${payment.tournamentId}`);
        orphanedIds.push(payment.tournamentId);
      }
    }
    
    if (orphanedIds.length === 0) {
      console.log('✅ No orphaned payments found!');
      return;
    }
    
    console.log(`\n🗑️  Deleting ${orphanedIds.length} orphaned payments...`);
    
    const result = await prisma.tournamentPayment.deleteMany({
      where: {
        tournamentId: {
          in: orphanedIds
        }
      }
    });
    
    console.log(`✅ Deleted ${result.count} orphaned payments`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanedPayments();
