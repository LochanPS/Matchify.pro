import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetKnockoutData() {
  try {
    console.log('🔄 Resetting all knockout match data...\n');

    // Find all knockout matches
    const knockoutMatches = await prisma.match.findMany({
      where: {
        stage: 'KNOCKOUT'
      },
      include: {
        tournament: true,
        category: true
      }
    });

    console.log(`Found ${knockoutMatches.length} knockout matches\n`);

    // Reset each match
    for (const match of knockoutMatches) {
      console.log(`Resetting Match #${match.matchNumber} (${match.tournament.name} - ${match.category.name})`);
      
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'PENDING',
          winnerId: null,
          scoreJson: null,
          startedAt: null,
          completedAt: null,
          umpireId: null
        }
      });
    }

    console.log('\n✅ All knockout matches reset to PENDING status!');
    console.log('✅ All scores, winners, and umpires cleared!');
    console.log('\n🔄 Now resetting bracketJson data...\n');

    // Also reset bracketJson in Draw table
    const draws = await prisma.draw.findMany({
      include: {
        tournament: true,
        category: true
      }
    });

    for (const draw of draws) {
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (bracketJson.format === 'ROUND_ROBIN_KNOCKOUT' && bracketJson.knockout) {
        console.log(`Resetting bracket for ${draw.tournament.name} - ${draw.category.name}`);
        
        // Reset all knockout rounds
        if (bracketJson.knockout.rounds) {
          for (const round of bracketJson.knockout.rounds) {
            if (round.matches) {
              for (const match of round.matches) {
                // Keep player assignments but clear match results
                match.winner = null;
                match.winnerId = null;
                match.score = null;
                match.status = 'PENDING';
                match.startTime = null;
                match.endTime = null;
                match.umpireId = null;
              }
            }
          }
        }

        await prisma.draw.update({
          where: { id: draw.id },
          data: {
            bracketJson: JSON.stringify(bracketJson)
          }
        });

        console.log('  ✅ BracketJson reset');
      }
    }

    console.log('\n✅✅✅ ALL KNOCKOUT DATA RESET SUCCESSFULLY! ✅✅✅');
    console.log('\n📋 Summary:');
    console.log(`   - ${knockoutMatches.length} matches reset to PENDING`);
    console.log(`   - All scores cleared`);
    console.log(`   - All winners cleared`);
    console.log(`   - All umpire assignments cleared`);
    console.log('\n🔄 Please refresh your browser to see the changes!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetKnockoutData();
