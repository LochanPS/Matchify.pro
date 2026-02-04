import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteGhostKnockoutMatches() {
  try {
    console.log('👻 Deleting ghost knockout matches...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    // Find ALL matches for this category
    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId
      }
    });

    console.log(`Found ${allMatches.length} total matches`);

    // Find knockout matches
    const knockoutMatches = allMatches.filter(m => m.stage === 'KNOCKOUT' || m.stage === null && m.round === 1);

    console.log(`Found ${knockoutMatches.length} knockout matches:\n`);

    for (const match of knockoutMatches) {
      console.log(`Match ${match.matchNumber}:`);
      console.log(`  Player1: ${match.player1Id || 'NULL'}`);
      console.log(`  Player2: ${match.player2Id || 'NULL'}`);
      console.log(`  Status: ${match.status}`);
      console.log(`  Stage: ${match.stage}`);
      
      // Delete it
      await prisma.match.delete({
        where: { id: match.id }
      });
      console.log(`  ✅ DELETED\n`);
    }

    console.log('✅ All ghost knockout matches deleted!');
    console.log('🔄 Refresh your browser now\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteGhostKnockoutMatches();
