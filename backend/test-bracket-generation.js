import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBracketGeneration() {
  console.log('🧪 Testing Bracket Generation Fix...\n');

  try {
    // Find the test tournament
    const tournament = await prisma.tournament.findFirst({
      where: { name: { contains: 'ace badminton', mode: 'insensitive' } },
      include: {
        categories: true
      }
    });

    if (!tournament) {
      console.log('❌ Tournament not found');
      return;
    }

    console.log(`✅ Found tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}\n`);

    // Get the first category
    const category = tournament.categories[0];
    if (!category) {
      console.log('❌ No categories found');
      return;
    }

    console.log(`✅ Testing category: ${category.name}`);
    console.log(`   ID: ${category.id}\n`);

    // Get all matches for this category
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`📊 Total matches: ${matches.length}\n`);

    // Group by round
    const matchesByRound = {};
    matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    // Display bracket structure
    console.log('🏆 BRACKET STRUCTURE:\n');
    
    Object.keys(matchesByRound).sort((a, b) => b - a).forEach(round => {
      const roundMatches = matchesByRound[round];
      const roundName = round === '1' ? 'FINALS' : 
                       round === '2' ? 'SEMI-FINALS' : 
                       round === '3' ? 'QUARTER-FINALS' : 
                       `ROUND ${round}`;
      
      console.log(`\n${roundName} (Round ${round}):`);
      console.log('─'.repeat(80));
      
      roundMatches.forEach(match => {
        console.log(`Match #${match.matchNumber}:`);
        console.log(`  Round: ${match.round}`);
        console.log(`  Status: ${match.status}`);
        console.log(`  Parent Match ID: ${match.parentMatchId || 'None (Finals)'}`);
        console.log(`  Winner Position: ${match.winnerPosition || 'N/A'}`);
        console.log(`  Player 1: ${match.player1Id ? 'Assigned' : 'TBD'}`);
        console.log(`  Player 2: ${match.player2Id ? 'Assigned' : 'TBD'}`);
        console.log('');
      });
    });

    // Verify parent relationships
    console.log('\n🔍 VERIFYING PARENT RELATIONSHIPS:\n');
    
    let allCorrect = true;
    
    for (const match of matches) {
      // Finals should have no parent
      if (match.round === 1) {
        if (match.parentMatchId !== null) {
          console.log(`❌ Finals match #${match.matchNumber} should NOT have a parent`);
          allCorrect = false;
        }
        continue;
      }

      // All other matches should have a parent
      if (!match.parentMatchId) {
        console.log(`❌ Match #${match.matchNumber} (Round ${match.round}) is MISSING parentMatchId`);
        allCorrect = false;
        continue;
      }

      if (!match.winnerPosition) {
        console.log(`❌ Match #${match.matchNumber} (Round ${match.round}) is MISSING winnerPosition`);
        allCorrect = false;
        continue;
      }

      // Verify parent exists and is in the correct round
      const parentMatch = matches.find(m => m.id === match.parentMatchId);
      if (!parentMatch) {
        console.log(`❌ Match #${match.matchNumber} has invalid parentMatchId`);
        allCorrect = false;
        continue;
      }

      if (parentMatch.round !== match.round - 1) {
        console.log(`❌ Match #${match.matchNumber} (Round ${match.round}) parent is in wrong round (${parentMatch.round}, expected ${match.round - 1})`);
        allCorrect = false;
        continue;
      }

      console.log(`✅ Match #${match.matchNumber} → Parent Match #${parentMatch.matchNumber} (${match.winnerPosition})`);
    }

    if (allCorrect) {
      console.log('\n✅ ALL PARENT RELATIONSHIPS ARE CORRECT!\n');
    } else {
      console.log('\n❌ SOME PARENT RELATIONSHIPS ARE INCORRECT\n');
    }

    // Test winner advancement
    console.log('\n🎯 TESTING WINNER ADVANCEMENT:\n');
    
    const completedMatches = matches.filter(m => m.status === 'COMPLETED' && m.winnerId);
    
    for (const match of completedMatches) {
      if (!match.parentMatchId) continue;

      const parentMatch = matches.find(m => m.id === match.parentMatchId);
      if (!parentMatch) continue;

      const expectedPosition = match.winnerPosition === 'player1' ? 'player1Id' : 'player2Id';
      const actualPlayerId = parentMatch[expectedPosition];

      if (actualPlayerId === match.winnerId) {
        console.log(`✅ Match #${match.matchNumber} winner advanced to Match #${parentMatch.matchNumber} ${match.winnerPosition}`);
      } else {
        console.log(`❌ Match #${match.matchNumber} winner NOT advanced correctly`);
        console.log(`   Expected: ${match.winnerId} in ${match.winnerPosition}`);
        console.log(`   Actual: ${actualPlayerId}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testBracketGeneration();
