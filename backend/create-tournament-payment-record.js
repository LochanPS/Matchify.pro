import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function createTournamentPaymentRecord() {
  try {
    console.log('🔄 Creating TournamentPayment record...\n');

    // Find the ace badminton tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      },
      include: {
        organizer: true
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found!');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);
    console.log(`   Organizer: ${tournament.organizer.name}\n`);

    // Check if TournamentPayment already exists
    const existingPayment = await prisma.tournamentPayment.findUnique({
      where: {
        tournamentId: tournament.id
      }
    });

    if (existingPayment) {
      console.log('⚠️  TournamentPayment record already exists');
      console.log(`   Total Collected: ₹${existingPayment.totalCollected}`);
      console.log(`   Total Registrations: ${existingPayment.totalRegistrations}`);
      return;
    }

    // Create TournamentPayment record
    const tournamentPayment = await prisma.tournamentPayment.create({
      data: {
        tournamentId: tournament.id,
        organizerId: tournament.organizerId,
        totalCollected: 0,
        totalRegistrations: 0,
        platformFeePercent: 5,
        platformFeeAmount: 0,
        organizerShare: 0,
        payout50Percent1: 0,
        payout50Percent2: 0,
        payout50Percent1Status: 'pending',
        payout50Percent2Status: 'pending'
      }
    });

    console.log('✅ Created TournamentPayment record');
    console.log(`   ID: ${tournamentPayment.id}`);
    console.log(`   Platform Fee: ${tournamentPayment.platformFeePercent}%`);
    console.log('\nNow payment approvals should work correctly!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTournamentPaymentRecord();
