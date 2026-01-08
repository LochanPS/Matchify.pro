import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function deleteAllTournaments() {
  try {
    console.log('🧹 Deleting ALL tournaments...');

    // Get all tournaments
    const tournaments = await prisma.tournament.findMany();
    console.log(`Found ${tournaments.length} tournaments to delete`);

    for (const tournament of tournaments) {
      console.log(`Deleting: ${tournament.name}`);

      // Delete in order due to foreign keys
      await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.draw.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.registration.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.category.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.tournamentPoster.deleteMany({ where: { tournamentId: tournament.id } });
      await prisma.tournament.delete({ where: { id: tournament.id } });
      
      console.log(`  ✅ Deleted: ${tournament.name}`);
    }

    console.log('✨ All tournaments deleted!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllTournaments();