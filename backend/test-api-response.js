import fetch from 'node-fetch';

async function testAPIResponse() {
  try {
    console.log('🧪 Testing API Response...\n');

    // You'll need to get your auth token from the browser
    // For now, let's check the database directly
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const draw = await prisma.draw.findFirst({
      where: { format: 'ROUND_ROBIN_KNOCKOUT' }
    });

    if (!draw) {
      console.log('No draw found');
      return;
    }

    const bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log('📊 What the API will return:\n');
    console.log('Knockout Rounds:', bracketJson.knockout.rounds.length);
    
    bracketJson.knockout.rounds.forEach((round, idx) => {
      const roundName = idx === 0 ? 'Semi Finals' : 'Final';
      console.log(`\n${roundName}:`);
      round.matches.forEach((match, matchIdx) => {
        console.log(`  Match ${match.matchNumber}:`);
        console.log(`    Player 1: ${match.player1?.name || 'TBD'}`);
        console.log(`    Player 2: ${match.player2?.name || 'TBD'}`);
        console.log(`    Status: ${match.status}`);
        console.log(`    Winner: ${match.winner || 'None'}`);
        console.log(`    Score: ${match.score1 || 'N/A'} - ${match.score2 || 'N/A'}`);
      });
    });

    await prisma.$disconnect();

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPIResponse();
