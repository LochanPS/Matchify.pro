import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkKnockoutStructure() {
  try {
    console.log('🔍 Checking Knockout Structure...\n');

    const draw = await prisma.draw.findFirst({
      where: {
        format: 'ROUND_ROBIN_KNOCKOUT'
      },
      include: {
        tournament: true,
        category: true
      }
    });

    if (!draw) {
      console.log('❌ No Round Robin + Knockout draw found');
      return;
    }

    console.log(`📊 Tournament: ${draw.tournament.name} - ${draw.category.name}\n`);

    const bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    // Check bracket JSON
    console.log('📋 BRACKET JSON STRUCTURE:');
    if (bracketJson.knockout && bracketJson.knockout.rounds) {
      console.log(`   Total Rounds: ${bracketJson.knockout.rounds.length}`);
      
      bracketJson.knockout.rounds.forEach((round, idx) => {
        console.log(`\n   Round ${round.roundNumber} (Index ${idx}):`);
        console.log(`   Matches: ${round.matches.length}`);
        
        round.matches.forEach((match, matchIdx) => {
          console.log(`      Match ${matchIdx + 1}:`);
          console.log(`         Player 1: ${match.player1?.name || 'NULL'} (ID: ${match.player1?.id || 'NULL'})`);
          console.log(`         Player 2: ${match.player2?.name || 'NULL'} (ID: ${match.player2?.id || 'NULL'})`);
          console.log(`         Status: ${match.status || 'N/A'}`);
          console.log(`         Winner: ${match.winner || 'NULL'}`);
          console.log(`         Score: ${match.score1 || 'NULL'} - ${match.score2 || 'NULL'}`);
        });
      });
    }

    // Check database matches
    console.log('\n\n📊 DATABASE MATCHES:');
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: draw.tournamentId,
        categoryId: draw.categoryId,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`   Total Knockout Matches: ${matches.length}\n`);

    // Get player names
    for (const match of matches) {
      const player1 = match.player1Id ? await prisma.user.findUnique({ where: { id: match.player1Id }, select: { name: true } }) : null;
      const player2 = match.player2Id ? await prisma.user.findUnique({ where: { id: match.player2Id }, select: { name: true } }) : null;
      const winner = match.winnerId ? await prisma.user.findUnique({ where: { id: match.winnerId }, select: { name: true } }) : null;
      
      console.log(`   Match ${match.matchNumber} (Round ${match.round}):`);
      console.log(`      Player 1: ${player1?.name || 'NULL'} (ID: ${match.player1Id || 'NULL'})`);
      console.log(`      Player 2: ${player2?.name || 'NULL'} (ID: ${match.player2Id || 'NULL'})`);
      console.log(`      Status: ${match.status}`);
      console.log(`      Winner: ${winner?.name || 'NULL'}`);
      console.log(`      Score: ${match.scoreJson || 'NULL'}`);
      console.log(`      Started: ${match.startedAt || 'NULL'}`);
      console.log(`      Completed: ${match.completedAt || 'NULL'}`);
      console.log('');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKnockoutStructure();
