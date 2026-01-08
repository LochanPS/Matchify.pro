import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteTestTournaments() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'testorganizer@matchify.com' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    // Get all tournaments by this organizer
    const tournaments = await prisma.tournament.findMany({
      where: { organizerId: user.id }
    });

    console.log(`Found ${tournaments.length} tournaments to delete`);

    for (const tournament of tournaments) {
      // Delete related data
      await prisma.registration.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.category.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.tournamentPoster.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
      
      // Delete tournament
      await prisma.tournament.delete({ where: { id: tournament.id } });
      console.log(`✅ Deleted: ${tournament.name}`);
    }

    console.log('\n✅ All test tournaments deleted');
    console.log('   Organizer can now create their first tournament!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteTestTournaments();
