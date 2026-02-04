import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function advanceWinnersNow() {
  try {
    console.log('🏆 Advancing winners to next round...\n');

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('❌ No draw found');
      return;
    }

    // Get all completed knockout matches
    const completedMatches = await prisma.match.findMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        stage: 'KNOCKOUT',
        status: 'COMPLETED'
      }
    });

    console.log(`Found ${completedMatches.length} completed matches\n`);

    for (const match of completedMatches) {
      if (!match.winnerId) {
        console.log(`⚠️ Match ${match.matchNumber} (Round ${match.round}) has no winner set`);
        continue;
      }

      if (!match.parentMatchId) {
        console.log(`ℹ️ Match ${match.matchNumber} (Round ${match.round}) has no parent (probably the final)`);
        continue;
      }

      const winner = await prisma.user.findUnique({
        where: { id: match.winnerId },
        select: { name: true }
      });

      // Update parent match with winner
      const updateData = {};
      if (match.winnerPosition === 'player1') {
        updateData.player1Id = match.winnerId;
      } else if (match.winnerPosition === 'player2') {
        updateData.player2Id = match.winnerId;
      } else {
        console.log(`⚠️ Match ${match.matchNumber} has no winnerPosition set`);
        continue;
      }

      // Check if parent match now has both players
      const parentMatch = await prisma.match.findUnique({
        where: { id: match.parentMatchId }
      });

      if (parentMatch) {
        const bothPlayersReady = 
          (match.winnerPosition === 'player1' && parentMatch.player2Id) ||
          (match.winnerPosition === 'player2' && parentMatch.player1Id);

        if (bothPlayersReady) {
          updateData.status = 'READY';
        }

        await prisma.match.update({
          where: { id: match.parentMatchId },
          data: updateData
        });

        console.log(`✅ Advanced ${winner?.name} from Match ${match.matchNumber} (Round ${match.round}) to parent match as ${match.winnerPosition}`);
      }
    }

    console.log('\n✅ Winners advanced! Refresh your browser to see the updated bracket.\n');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

advanceWinnersNow();
