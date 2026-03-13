import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDrawAPI() {
  try {
    // Simulate what the API endpoint returns
    const draw = await prisma.draw.findFirst({
      where: {
        format: 'ROUND_ROBIN_KNOCKOUT'
      },
      include: {
        tournament: {
          select: {
            name: true,
            startDate: true
          }
        },
        category: {
          select: {
            name: true,
            format: true
          }
        }
      }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    // This is what the API returns
    const apiResponse = {
      success: true,
      draw: {
        id: draw.id,
        tournament: draw.tournament,
        category: draw.category,
        format: draw.format,
        bracketJson: draw.bracketJson, // This is what frontend receives
        createdAt: draw.createdAt
      }
    };

    console.log('API Response Structure:');
    console.log('- Draw ID:', apiResponse.draw.id);
    console.log('- Format:', apiResponse.draw.format);
    console.log('- Tournament:', apiResponse.draw.tournament.name);
    console.log('- Category:', apiResponse.draw.category.name);
    
    // Parse the bracketJson like the frontend does
    const bracketData = typeof apiResponse.draw.bracketJson === 'string' 
      ? JSON.parse(apiResponse.draw.bracketJson) 
      : apiResponse.draw.bracketJson;

    console.log('\nKnockout Data (what frontend will display):');
    if (bracketData.knockout?.rounds) {
      bracketData.knockout.rounds.forEach((round, idx) => {
        const roundName = idx === 0 ? 'Semi Finals' : idx === 1 ? 'Final' : `Round ${idx + 1}`;
        console.log(`\n${roundName}:`);
        round.matches.forEach((match, matchIdx) => {
          console.log(`  Match ${match.matchNumber || matchIdx + 1}:`);
          console.log(`    Player 1: ${match.player1?.name || 'NULL'}`);
          console.log(`    Player 2: ${match.player2?.name || 'NULL'}`);
          console.log(`    Status: ${match.status || 'PENDING'}`);
          console.log(`    Winner: ${match.winner || 'NULL'}`);
          console.log(`    Score: ${match.score1 || 'NULL'} - ${match.score2 || 'NULL'}`);
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDrawAPI();
