import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanDemoData() {
  try {
    console.log('🧹 Starting database cleanup...');

    // Find all demo tournaments
    const demoTournaments = await prisma.tournament.findMany({
      where: {
        OR: [
          { name: { contains: 'Demo' } },
          { name: { contains: 'Test' } },
          { name: { contains: 'Sample' } },
        ],
      },
    });

    console.log(`Found ${demoTournaments.length} demo tournaments to delete`);

    // Delete each tournament and its related data
    for (const tournament of demoTournaments) {
      console.log(`Deleting tournament: ${tournament.name}`);

      // Delete matches first (due to foreign keys)
      await prisma.match.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`  ✓ Deleted matches`);

      // Delete draws
      await prisma.draw.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`  ✓ Deleted draws`);

      // Delete registrations
      await prisma.registration.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`  ✓ Deleted registrations`);

      // Delete categories
      await prisma.category.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`  ✓ Deleted categories`);

      // Delete posters
      await prisma.tournamentPoster.deleteMany({
        where: { tournamentId: tournament.id },
      });
      console.log(`  ✓ Deleted posters`);

      // Finally delete the tournament itself
      await prisma.tournament.delete({
        where: { id: tournament.id },
      });
      console.log(`  ✅ Tournament deleted: ${tournament.name}\n`);
    }

    console.log('✨ Database cleanup complete!');
    console.log(`Total tournaments deleted: ${demoTournaments.length}`);
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanDemoData();