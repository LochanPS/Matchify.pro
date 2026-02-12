import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWinnerAdvancement() {
  console.log('🧪 Testing Winner Advancement...\n');

  try {
    // Get Match #2 (Quarter-Final)
    const match2 = await prisma.match.findFirst({
      where: {
        tournamentId: '4a54977d-bfbc-42e0-96c3-b020000d81f6',
        categoryId: '68a7a3eb-1ba0-446e-9a0f-cf8597b8b748',
        matchNumber: 2
      }
    });

    if (!match2) {
      console.log('❌ Match #2 not found');
      return;
    }

    console.log('📋 Match #2 Details:');
    console.log(`   Status: ${match2.status}`);
    console.log(`   Player 1: ${match2.player1Id}`);
    console.log(`   Player 2: ${match2.player2Id}`);
    console.log(`   Parent Match: ${match2.parentMatchId}`);
    console.log(`   Winner Position: ${match2.winnerPosition}\n`);

    // Get parent match (Semi-Final Match #5) BEFORE
    const parentBefore = await prisma.match.findUnique({
      where: { id: match2.parentMatchId }
    });

    console.log('📋 Parent Match #5 BEFORE:');
    console.log(`   Player 1: ${parentBefore.player1Id || 'TBD'}`);
    console.log(`   Player 2: ${parentBefore.player2Id || 'TBD'}\n`);

    // Simulate completing Match #2 with Player 1 as winner
    console.log('⚡ Simulating Match #2 completion with Player 1 as winner...\n');

    const winnerId = match2.player1Id;
    const finalScore = {
      sets: [
        { player1: 21, player2: 15, winner: 1 },
        { player1: 21, player2: 18, winner: 1 }
      ],
      currentSet: 1,
      matchConfig: {
        pointsPerSet: 21,
        setsToWin: 2,
        maxSets: 3
      }
    };

    // Update match as completed
    await prisma.match.update({
      where: { id: match2.id },
      data: {
        status: 'COMPLETED',
        winnerId: winnerId,
        completedAt: new Date(),
        scoreJson: JSON.stringify(finalScore)
      }
    });

    // Advance winner to parent match (THIS IS THE KEY LOGIC)
    if (match2.parentMatchId && match2.winnerPosition) {
      const updateData = {};
      if (match2.winnerPosition === 'player1') {
        updateData.player1Id = winnerId;
      } else if (match2.winnerPosition === 'player2') {
        updateData.player2Id = winnerId;
      }

      await prisma.match.update({
        where: { id: match2.parentMatchId },
        data: updateData
      });

      console.log(`✅ Advanced winner to ${match2.winnerPosition} of parent match\n`);
    }

    // Get parent match AFTER
    const parentAfter = await prisma.match.findUnique({
      where: { id: match2.parentMatchId }
    });

    console.log('📋 Parent Match #5 AFTER:');
    console.log(`   Player 1: ${parentAfter.player1Id || 'TBD'}`);
    console.log(`   Player 2: ${parentAfter.player2Id || 'TBD'}\n`);

    // Verify advancement
    if (match2.winnerPosition === 'player2' && parentAfter.player2Id === winnerId) {
      console.log('✅ SUCCESS! Winner advanced to player2 position in parent match\n');
    } else if (match2.winnerPosition === 'player1' && parentAfter.player1Id === winnerId) {
      console.log('✅ SUCCESS! Winner advanced to player1 position in parent match\n');
    } else {
      console.log('❌ FAILED! Winner did not advance correctly\n');
    }

    // Show the complete bracket
    console.log('🏆 UPDATED BRACKET:\n');
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
        const p1 = match.player1Id ? '✓' : 'TBD';
        const p2 = match.player2Id ? '✓' : 'TBD';
        console.log(`  Match #${match.matchNumber}: ${p1} vs ${p2} (${match.status})`);
      });
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testWinnerAdvancement();
