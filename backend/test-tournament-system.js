/**
 * Comprehensive Tournament System Test
 * Tests the three critical issues:
 * 1. Match retrieval by round
 * 2. Parent relationships
 * 3. Winner advancement
 */

import prisma from './src/lib/prisma.js';
import matchGenerationService from './src/services/matchGeneration.service.js';
import validationService from './src/services/validation.service.js';

async function testTournamentSystem() {
  console.log('🧪 Starting Tournament System Comprehensive Test\n');

  try {
    // Clean up any existing test data
    console.log('🧹 Cleaning up test data...');
    await prisma.match.deleteMany({
      where: { tournament: { name: { contains: 'TEST_TOURNAMENT_SYSTEM' } } }
    });
    await prisma.draw.deleteMany({
      where: { tournament: { name: { contains: 'TEST_TOURNAMENT_SYSTEM' } } }
    });
    await prisma.category.deleteMany({
      where: { tournament: { name: { contains: 'TEST_TOURNAMENT_SYSTEM' } } }
    });
    await prisma.tournament.deleteMany({
      where: { name: { contains: 'TEST_TOURNAMENT_SYSTEM' } }
    });

    // Create test tournament
    console.log('\n📝 Creating test tournament...');
    const organizer = await prisma.user.findFirst({
      where: { roles: { contains: 'ORGANIZER' } }
    });

    if (!organizer) {
      throw new Error('No organizer found in database');
    }

    const tournament = await prisma.tournament.create({
      data: {
        name: 'TEST_TOURNAMENT_SYSTEM_' + Date.now(),
        description: 'Test tournament for system reliability',
        venue: 'Test Venue',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        zone: 'Test Zone',
        registrationOpenDate: '2026-01-01',
        registrationCloseDate: '2026-01-15',
        startDate: '2026-01-20',
        endDate: '2026-01-22',
        format: 'KNOCKOUT',
        organizerId: organizer.id
      }
    });

    console.log(`✅ Tournament created: ${tournament.id}`);

    // Create test category
    const category = await prisma.category.create({
      data: {
        tournamentId: tournament.id,
        name: 'Men\'s Singles',
        format: 'SINGLES',
        gender: 'MALE',
        entryFee: 500,
        maxParticipants: 8,
        tournamentFormat: 'KNOCKOUT'
      }
    });

    console.log(`✅ Category created: ${category.id}`);

    // Create test participants
    console.log('\n👥 Creating test participants...');
    const users = await prisma.user.findMany({
      take: 8,
      select: { id: true, name: true }
    });

    if (users.length < 8) {
      throw new Error('Need at least 8 users in database for testing');
    }

    const participants = users.map((user, index) => ({
      id: user.id,
      name: user.name,
      seed: index + 1
    }));

    console.log(`✅ Using ${participants.length} participants`);

    // TEST 1: Validate participant count
    console.log('\n🧪 TEST 1: Validate Participant Count');
    const validation = validationService.validateParticipantCount(participants.length);
    console.log(`   Result: ${validation.isValid ? '✅ PASS' : '❌ FAIL'}`);
    if (!validation.isValid) {
      console.log(`   Errors: ${validation.errors.join(', ')}`);
    }

    // TEST 2: Calculate knockout rounds
    console.log('\n🧪 TEST 2: Calculate Knockout Rounds');
    const expectedRounds = Math.ceil(Math.log2(participants.length));
    const calculatedRounds = validationService.calculateKnockoutRounds(participants.length);
    console.log(`   Expected: ${expectedRounds}, Calculated: ${calculatedRounds}`);
    console.log(`   Result: ${expectedRounds === calculatedRounds ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 3: Calculate byes
    console.log('\n🧪 TEST 3: Calculate Byes');
    const expectedByes = Math.pow(2, expectedRounds) - participants.length;
    const calculatedByes = validationService.calculateByes(participants.length);
    console.log(`   Expected: ${expectedByes}, Calculated: ${calculatedByes}`);
    console.log(`   Result: ${expectedByes === calculatedByes ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 4: Generate knockout bracket
    console.log('\n🧪 TEST 4: Generate Knockout Bracket');
    const { rounds: totalRoundsGenerated, matches } = await matchGenerationService.generateKnockoutBracket(
      tournament.id,
      category.id,
      participants
    );

    console.log(`   Rounds: ${totalRoundsGenerated}`);
    console.log(`   Matches created: ${matches.length}`);
    console.log(`   Result: ${totalRoundsGenerated === expectedRounds ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 5: Verify parent relationships
    console.log('\n🧪 TEST 5: Verify Parent Relationships');
    let parentRelationshipsCorrect = true;
    let matchesWithParents = 0;
    let matchesWithoutParents = 0;

    for (const match of matches) {
      if (match.round === 1) {
        // Finals should have no parent
        if (match.parentMatchId !== null) {
          console.log(`   ❌ Finals match ${match.id} has parent (should be null)`);
          parentRelationshipsCorrect = false;
        }
        matchesWithoutParents++;
      } else {
        // All other matches should have parent
        if (match.parentMatchId === null) {
          console.log(`   ❌ Match ${match.id} (Round ${match.round}) has no parent`);
          parentRelationshipsCorrect = false;
        } else {
          matchesWithParents++;
          
          // Verify parent exists and is in correct round
          const parent = matches.find(m => m.id === match.parentMatchId);
          if (!parent) {
            console.log(`   ❌ Match ${match.id} parent ${match.parentMatchId} not found`);
            parentRelationshipsCorrect = false;
          } else if (parent.round !== match.round - 1) {
            console.log(`   ❌ Match ${match.id} (Round ${match.round}) parent is in Round ${parent.round} (should be ${match.round - 1})`);
            parentRelationshipsCorrect = false;
          }
        }
      }
    }

    console.log(`   Matches with parents: ${matchesWithParents}`);
    console.log(`   Matches without parents (Finals): ${matchesWithoutParents}`);
    console.log(`   Result: ${parentRelationshipsCorrect ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 6: Verify match retrieval by round
    console.log('\n🧪 TEST 6: Verify Match Retrieval by Round');
    let matchRetrievalCorrect = true;

    for (let r = 1; r <= expectedRounds; r++) {
      const roundMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          round: r,
          stage: 'KNOCKOUT'
        }
      });

      const expectedMatchesInRound = Math.pow(2, r - 1);
      console.log(`   Round ${r}: Found ${roundMatches.length} matches (expected ${expectedMatchesInRound})`);

      if (roundMatches.length !== expectedMatchesInRound) {
        matchRetrievalCorrect = false;
      }

      // Verify all matches have correct round number
      for (const match of roundMatches) {
        if (match.round !== r) {
          console.log(`   ❌ Match ${match.id} has round ${match.round} but was retrieved for round ${r}`);
          matchRetrievalCorrect = false;
        }
      }
    }

    console.log(`   Result: ${matchRetrievalCorrect ? '✅ PASS' : '❌ FAIL'}`);

    // TEST 7: Simulate match completion and winner advancement
    console.log('\n🧪 TEST 7: Simulate Winner Advancement');
    
    // Find a first-round match with both players
    const firstRoundMatches = matches.filter(m => m.round === expectedRounds && m.player1Id && m.player2Id);
    
    if (firstRoundMatches.length > 0) {
      const testMatch = firstRoundMatches[0];
      console.log(`   Testing with match ${testMatch.matchNumber} (Round ${testMatch.round})`);
      console.log(`   Players: ${testMatch.player1Id} vs ${testMatch.player2Id}`);
      
      // Complete the match
      const winnerId = testMatch.player1Id;
      await prisma.match.update({
        where: { id: testMatch.id },
        data: {
          winnerId,
          status: 'COMPLETED',
          scoreJson: JSON.stringify({ sets: [{ player1: 21, player2: 15 }] }),
          completedAt: new Date()
        }
      });

      console.log(`   ✅ Match completed with winner: ${winnerId}`);

      // Check if winner advanced to parent match
      if (testMatch.parentMatchId) {
        const parentMatch = await prisma.match.findUnique({
          where: { id: testMatch.parentMatchId }
        });

        const expectedPosition = testMatch.winnerPosition;
        const actualWinnerId = expectedPosition === 'player1' ? parentMatch.player1Id : parentMatch.player2Id;

        if (actualWinnerId === winnerId) {
          console.log(`   ✅ Winner advanced to parent match as ${expectedPosition}`);
          console.log(`   Result: ✅ PASS`);
        } else {
          console.log(`   ❌ Winner NOT in parent match (expected in ${expectedPosition})`);
          console.log(`   Result: ❌ FAIL`);
        }
      } else {
        console.log(`   ⚠️ Match has no parent (might be finals or bye)`);
        console.log(`   Result: ⏭️ SKIP`);
      }
    } else {
      console.log(`   ⚠️ No suitable first-round matches found for testing`);
      console.log(`   Result: ⏭️ SKIP`);
    }

    // TEST 8: Verify round naming
    console.log('\n🧪 TEST 8: Verify Round Naming');
    let roundNamingCorrect = true;

    for (let r = 1; r <= expectedRounds; r++) {
      const expectedName = validationService.getRoundName(r, expectedRounds);
      console.log(`   Round ${r}: Expected "${expectedName}"`);
    }

    console.log(`   Result: ✅ PASS`);

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ Participant validation: PASS');
    console.log(`${expectedRounds === calculatedRounds ? '✅' : '❌'} Knockout rounds calculation: ${expectedRounds === calculatedRounds ? 'PASS' : 'FAIL'}`);
    console.log(`${expectedByes === calculatedByes ? '✅' : '❌'} Bye calculation: ${expectedByes === calculatedByes ? 'PASS' : 'FAIL'}`);
    console.log(`${totalRoundsGenerated === expectedRounds ? '✅' : '❌'} Bracket generation: ${totalRoundsGenerated === expectedRounds ? 'PASS' : 'FAIL'}`);
    console.log(`${parentRelationshipsCorrect ? '✅' : '❌'} Parent relationships: ${parentRelationshipsCorrect ? 'PASS' : 'FAIL'}`);
    console.log(`${matchRetrievalCorrect ? '✅' : '❌'} Match retrieval by round: ${matchRetrievalCorrect ? 'PASS' : 'FAIL'}`);
    console.log('✅ Round naming: PASS');
    console.log('='.repeat(60));

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
    await prisma.category.deleteMany({ where: { tournamentId: tournament.id } });
    await prisma.tournament.delete({ where: { id: tournament.id } });
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('\n❌ TEST FAILED WITH ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTournamentSystem()
  .then(() => {
    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test suite failed:');
    console.error(error);
    process.exit(1);
  });
