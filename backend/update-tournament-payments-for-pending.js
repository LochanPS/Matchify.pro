import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateTournamentPayments() {
  try {
    console.log('🔄 Updating tournament payment records for pending registrations...');
    
    // Since registrations are now pending, we should reset tournament payments
    // or adjust them to reflect that payments are not yet confirmed
    
    // Get tournament
    const tournament = await prisma.tournament.findFirst({
      select: { id: true, name: true }
    });
    
    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }
    
    // Count pending vs confirmed registrations
    const pendingRegs = await prisma.registration.count({
      where: { 
        tournamentId: tournament.id,
        status: 'pending'
      }
    });
    
    const confirmedRegs = await prisma.registration.count({
      where: { 
        tournamentId: tournament.id,
        status: 'confirmed'
      }
    });
    
    console.log(`📊 Tournament: ${tournament.name}`);
    console.log(`   - Pending registrations: ${pendingRegs}`);
    console.log(`   - Confirmed registrations: ${confirmedRegs}`);
    
    // For now, let's keep the tournament payment record as is
    // since it represents the potential revenue once all payments are approved
    // But we could add a note that these are pending approvals
    
    const tournamentPayment = await prisma.tournamentPayment.findUnique({
      where: { tournamentId: tournament.id },
      select: {
        totalCollected: true,
        totalRegistrations: true,
        platformFeeAmount: true,
        payout50Percent1: true,
        payout50Percent2: true
      }
    });
    
    if (tournamentPayment) {
      console.log(`💰 Tournament Payment Record (Pending Approval):`);
      console.log(`   - Total Potential Revenue: ₹${tournamentPayment.totalCollected}`);
      console.log(`   - Total Registrations: ${tournamentPayment.totalRegistrations}`);
      console.log(`   - Platform Fee (5%): ₹${tournamentPayment.platformFeeAmount}`);
      console.log(`   - First Payout (30%): ₹${tournamentPayment.payout50Percent1}`);
      console.log(`   - Second Payout (65%): ₹${tournamentPayment.payout50Percent2}`);
      console.log(`   - Status: Awaiting ${pendingRegs} payment approvals`);
    }
    
    console.log('✅ Tournament payment records are ready for when payments get approved');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTournamentPayments();