import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetTournamentKnockout() {
  try {
    console.log('🔄 Resetting knockout stage for ACE tournament...\n');

    // Find the tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'ace', mode: 'insensitive' } },
      include: {
        categories: {
          include: {
            draws: true
          }
        }
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);

    for (const category of tournament.categories) {
      const draw = category.draws && category.draws[0];
      if (!draw) continue;

      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') continue;

      console.log(`\n📋 Category: ${category.name}`);
      console.log(`   Format: ${bracketJson.format}`);

      // Reset knockout bracket in JSON to empty
      if (bracketJson.knockout && bracketJson.knockout.rounds) {
        console.log('   Clearing knockout bracket data...');
        
        bracketJson.knockout.rounds.forEach(round => {
          round.matches.forEach(match => {
            match.player1 = null;
            match.player2 = null;
            match.score1 = null;
            match.score2 = null;
            match.winner = null;
          });
        });

        // Save updated bracket
        await prisma.draw.update({
          where: { id: draw.id },
          data: { bracketJson: JSON.stringify(bracketJson) }
        });

        console.log('   ✅ Knockout bracket cleared');
      }

      // Delete all knockout matches from database
      const deletedMatches = await prisma.match.deleteMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          OR: [
            { stage: 'KNOCKOUT' },
            { round: { gt: 1 } }
          ]
        }
      });

      console.log(`   ✅ Deleted ${deletedMatches.count} knockout matches from database`);
    }

    console.log('\n✅ Reset complete! Now click "Continue to Knockout Stage" button.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTournamentKnockout();
