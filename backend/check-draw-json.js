import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDrawJson() {
  try {
    const draw = await prisma.draw.findFirst({
      where: {
        format: 'ROUND_ROBIN_KNOCKOUT'
      }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    console.log('Draw ID:', draw.id);
    console.log('\nBracket JSON (raw):');
    console.log(draw.bracketJson.substring(0, 500) + '...\n');

    const bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log('Knockout Structure:');
    console.log('Total Rounds:', bracketJson.knockout?.rounds?.length);
    
    if (bracketJson.knockout?.rounds) {
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`\nRound ${idx + 1}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`  Match ${matchIdx + 1}:`);
          console.log(`    Player 1: ${match.player1?.name || 'NULL'}`);
          console.log(`    Player 2: ${match.player2?.name || 'NULL'}`);
          console.log(`    Winner: ${match.winner || 'NULL'}`);
          console.log(`    Score: ${match.score1 || 'NULL'} - ${match.score2 || 'NULL'}`);
          console.log(`    Status: ${match.status || 'N/A'}`);
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDrawJson();
