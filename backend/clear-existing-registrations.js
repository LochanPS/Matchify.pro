import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearExistingRegistrations() {
  try {
    console.log('🧹 Clearing existing tournament registrations...');
    
    // Find the tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: { contains: 'ace badhbhj', mode: 'insensitive' }
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log('✅ Found tournament:', tournament.name);

    // Delete related data first (due to foreign key constraints)
    console.log('🗑️ Deleting payment verifications...');
    await prisma.paymentVerification.deleteMany({
      where: { tournamentId: tournament.id }
    });

    console.log('🗑️ Deleting user payment ledger entries...');
    await prisma.userPaymentLedger.deleteMany({
      where: { tournamentId: tournament.id }
    });

    console.log('🗑️ Deleting notifications...');
    await prisma.notification.deleteMany({
      where: { 
        type: 'PAYMENT_VERIFICATION',
        message: { contains: tournament.name }
      }
    });

    console.log('🗑️ Deleting registrations...');
    const deletedRegistrations = await prisma.registration.deleteMany({
      where: { tournamentId: tournament.id }
    });

    console.log(`✅ Deleted ${deletedRegistrations.count} registrations`);

    // Reset user payment summaries
    console.log('🔄 Resetting user payment summaries...');
    await prisma.userPaymentSummary.deleteMany({});

    console.log('✅ All existing tournament data cleared!');
    console.log('🚀 Ready for fresh registrations');

  } catch (error) {
    console.error('❌ Error clearing registrations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearExistingRegistrations();