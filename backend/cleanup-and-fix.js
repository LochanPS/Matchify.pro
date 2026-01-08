import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupAndFix() {
  console.log('🧹 Starting cleanup and fixes...\n');

  try {
    // 1. Give 25 credits to all organizers who have 0 balance
    console.log('💰 Giving 25 free Matchify credits to organizers...');
    const organizersUpdated = await prisma.user.updateMany({
      where: {
        role: 'ORGANIZER',
        walletBalance: 0
      },
      data: {
        walletBalance: 25
      }
    });
    console.log(`✅ Updated ${organizersUpdated.count} organizers with 25 credits\n`);

    // 2. Delete all demo/test tournaments
    console.log('🗑️  Deleting demo tournaments...');
    
    // Get all tournaments to check
    const allTournaments = await prisma.tournament.findMany({
      select: {
        id: true,
        name: true,
        organizerId: true
      }
    });

    let deletedCount = 0;
    for (const tournament of allTournaments) {
      const name = tournament.name.toLowerCase();
      // Delete if name contains test, demo, sample, or dummy
      if (
        name.includes('test') ||
        name.includes('demo') ||
        name.includes('sample') ||
        name.includes('dummy') ||
        name.includes('example')
      ) {
        try {
          // Delete related data first
          await prisma.registration.deleteMany({
            where: { tournamentId: tournament.id }
          });
          await prisma.category.deleteMany({
            where: { tournamentId: tournament.id }
          });
          await prisma.tournamentPoster.deleteMany({
            where: { tournamentId: tournament.id }
          });
          await prisma.match.deleteMany({
            where: { tournamentId: tournament.id }
          });
          
          // Delete tournament
          await prisma.tournament.delete({
            where: { id: tournament.id }
          });
          
          console.log(`   ✓ Deleted: ${tournament.name}`);
          deletedCount++;
        } catch (err) {
          console.log(`   ✗ Failed to delete: ${tournament.name} - ${err.message}`);
        }
      }
    }
    console.log(`✅ Deleted ${deletedCount} demo tournaments\n`);

    // 3. Update all existing tournaments to be public (visible to everyone)
    console.log('🌍 Making all tournaments public...');
    const tournamentsUpdated = await prisma.tournament.updateMany({
      where: {
        privacy: 'private'
      },
      data: {
        privacy: 'public'
      }
    });
    console.log(`✅ Updated ${tournamentsUpdated.count} tournaments to public\n`);

    // 4. Show summary
    console.log('📊 Summary:');
    const stats = await prisma.$transaction([
      prisma.user.count({ where: { role: 'ORGANIZER' } }),
      prisma.user.count({ where: { role: 'PLAYER' } }),
      prisma.user.count({ where: { role: 'UMPIRE' } }),
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: 'published' } }),
    ]);

    console.log(`   Organizers: ${stats[0]}`);
    console.log(`   Players: ${stats[1]}`);
    console.log(`   Umpires: ${stats[2]}`);
    console.log(`   Total Tournaments: ${stats[3]}`);
    console.log(`   Published Tournaments: ${stats[4]}`);

    console.log('\n✅ Cleanup and fixes completed successfully!');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupAndFix()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
