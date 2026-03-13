import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllCompletedMatches() {
  console.log('🔧 Fixing all completed matches to advance winners...\n');

  try {
    // Get all completed matches that have a parent
    const completedMatches = await prisma.match.findMany({
      where: {
        tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
        categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748',
        status: 'COMPLETED',
        parentMatchId: { not: null }
      },
      orderBy: { round: 'desc' }
    });

    console.log(`Found ${completedMatches.length} completed matches with parents\n`);

    for (const match of completedMatches) {
      console.log(`\n📋 Match #${match.matchNumber}:`);
      console.log(`   Winner: ${match.winnerId}`);
      console.log(`   Parent: ${match.parentMatchId}`);
      console.log(`   Winner Position: ${match.winnerPosition}`);

      if (match.winnerId && match.parentMatchId && match.winnerPosition) {
        // Get parent match
        const parentMatch = await prisma.match.findUnique({
          where: { id: match.parentMatchId }
        });

        console.log(`   Parent Match #${parentMatch.matchNumber} before:`);
        console.log(`     Player 1: ${parentMatch.player1Id || 'TBD'}`);
        console.log(`     Player 2: ${parentMatch.player2Id || 'TBD'}`);

        // Update parent match with winner
        const updateData = {};
        if (match.winnerPosition === 'player1') {
          updateData.player1Id = match.winnerId;
        } else if (match.winnerPosition === 'player2') {
          updateData.player2Id = match.winnerId;
        }

        await prisma.match.update({
          where: { id: match.parentMatchId },
          data: updateData
        });

        console.log(`   ✅ Advanced winner to ${match.winnerPosition}`);

        // Get updated parent
        const updatedParent = await prisma.match.findUnique({
          where: { id: match.parentMatchId }
        });

        console.log(`   Parent Match #${updatedParent.matchNumber} after:`);
        console.log(`     Player 1: ${updatedParent.player1Id || 'TBD'}`);
        console.log(`     Player 2: ${updatedParent.player2Id || 'TBD'}`);
      } else {
        console.log('   ⚠️ Missing winnerId or parent info');
      }
    }

    console.log('\n\n🏆 FINAL BRACKET STATE:\n');

    const allMatches = await prisma.match.findMany({
      where: {
        tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
        categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    // Get player names
    const playerIds = new Set();
    allMatches.forEach(m => {
      if (m.player1Id) playerIds.add(m.player1Id);
      if (m.player2Id) playerIds.add(m.player2Id);
    });

    const players = await prisma.user.findMany({
      where: { id: { in: Array.from(playerIds) } },
      select: { id: true, name: true }
    });

    const playerMap = {};
    players.forEach(p => {
      playerMap[p.id] = p.name;
    });

    const matchesByRound = {};
    allMatches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    Object.keys(matchesByRound).sort((a, b) => b - a).forEach(round => {
      const roundMatches = matchesByRound[round];
      const roundName = round === '1' ? 'FINALS' : 
                       round === '2' ? 'SEMI-FINALS' : 
                       round === '3' ? 'QUARTER-FINALS' : 
                       `ROUND ${round}`;
      
      console.log(`${roundName}:`);
      roundMatches.forEach(match => {
        const p1 = match.player1Id ? playerMap[match.player1Id] : 'TBD';
        const p2 = match.player2Id ? playerMap[match.player2Id] : 'TBD';
        const status = match.status;
        const winner = match.winnerId ? `(Winner: ${playerMap[match.winnerId]})` : '';
        console.log(`  Match #${match.matchNumber}: ${p1} vs ${p2} - ${status} ${winner}`);
      });
      console.log('');
    });

    console.log('✅ All completed matches have been processed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllCompletedMatches();
