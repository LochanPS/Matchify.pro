import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllDraws() {
  try {
    const draws = await prisma.draw.findMany({
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    console.log(`Found ${draws.length} draws:\n`);

    for (const draw of draws) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Tournament: ${draw.tournament.name}`);
      console.log(`Category: ${draw.category.name}`);
      console.log(`Format: ${draw.format}`);
      console.log(`Draw ID: ${draw.id}`);
      
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      if (draw.format === 'ROUND_ROBIN_KNOCKOUT' && bracketJson.knockout?.rounds) {
        console.log('\nKnockout Matches:');
        bracketJson.knockout.rounds.forEach((round, idx) => {
          console.log(`\n  Round ${idx + 1} (${round.matches.length} matches):`);
          round.matches.forEach((match, matchIdx) => {
            console.log(`    Match ${matchIdx + 1}: ${match.player1?.name || 'NULL'} vs ${match.player2?.name || 'NULL'}`);
            if (match.winner || match.score1 || match.status === 'COMPLETED') {
              console.log(`      ⚠️ HAS DATA: Winner=${match.winner}, Score=${match.score1}-${match.score2}, Status=${match.status}`);
            }
          });
        });
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllDraws();
