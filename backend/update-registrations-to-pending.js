import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function updateRegistrationsToPending() {
  try {
    console.log('🔄 Updating registrations to pending verification...\n');

    // Find the ace badminton tournament
    const tournament = await prisma.tournament.findFirst({
      where: {
        name: {
          contains: 'ace',
          mode: 'insensitive'
        }
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found!');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}\n`);

    // Update all registrations for this tournament to pending status
    const result = await prisma.registration.updateMany({
      where: {
        tournamentId: tournament.id,
        paymentStatus: 'verified'
      },
      data: {
        paymentStatus: 'submitted', // Change to submitted so they appear in verification queue
        status: 'pending' // Change status to pending
      }
    });

    console.log(`✅ Updated ${result.count} registrations to pending verification`);
    console.log(`\nThese registrations will now appear in the Payment Verification page!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRegistrationsToPending();
