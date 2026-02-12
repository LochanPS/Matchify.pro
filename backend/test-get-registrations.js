import prisma from './src/lib/prisma.js';

async function testGetRegistrations() {
  try {
    const tournamentId = 'dbac18eb-409d-418b-b1ce-f84306444b46';
    const organizerId = 'c90d83d1-48f5-4b1d-87b5-5078dac92ee7';
    
    console.log('🔍 Testing getTournamentRegistrations...\n');
    console.log(`Tournament ID: ${tournamentId}`);
    console.log(`Organizer ID: ${organizerId}\n`);
    
    // Verify tournament belongs to organizer
    const tournament = await prisma.tournament.findFirst({
      where: {
        id: tournamentId,
        organizerId: organizerId,
      },
    });

    if (!tournament) {
      console.log('❌ Tournament not found or unauthorized');
      return;
    }
    
    console.log('✅ Tournament found:', tournament.name);
    console.log('');

    const registrations = await prisma.registration.findMany({
      where: { tournamentId: tournamentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
          },
        },
        partner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            format: true,
            gender: true,
            entryFee: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`✅ Found ${registrations.length} registration(s)\n`);
    
    if (registrations.length > 0) {
      registrations.forEach((reg, index) => {
        console.log(`${index + 1}. ${reg.user.name}`);
        console.log(`   Category: ${reg.category.name}`);
        console.log(`   Status: ${reg.status}`);
        console.log(`   Payment: ${reg.paymentStatus}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testGetRegistrations();
