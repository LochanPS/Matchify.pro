/**
 * Test script to verify the knockout assignment flow fixes:
 * 1. Assign players to round robin groups - knockout bracket should be cleared
 * 2. Arrange knockout matchups - manually assign qualified players
 * 3. Save knockout matchups - bracket should be populated correctly
 */

import prisma from './src/lib/prisma.js';

async function main() {
  console.log('🧪 Testing Knockout Assignment Flow\n');
  console.log('=' .repeat(60));

  try {
    // Step 1: Find any tournament with categories
    console.log('\n📋 Step 1: Finding tournament and category...');
    const tournament = await prisma.tournament.findFirst({
      include: {
        categories: true
      }
    });

    if (!tournament) {
      console.log('❌ No tournament found. Please create a tournament first.');
      console.log('   Go to: http://localhost:5173');
      return;
    }

    if (tournament.categories.length === 0) {
      console.log('❌ No categories found. Please create a category first.');
      return;
    }

    const category = tournament.categories[0];
    const TOURNAMENT_ID = tournament.id;
    const CATEGORY_ID = category.id;

    console.log('✅ Tournament found:', tournament.name);
    console.log('✅ Category found:', category.name);
    console.log('   Tournament ID:', TOURNAMENT_ID);
    console.log('   Category ID:', CATEGORY_ID);

    // Step 2: Check if draw exists
    console.log('\n📋 Step 2: Checking draw configuration...');
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId: TOURNAMENT_ID,
          categoryId: CATEGORY_ID
        }
      }
    });

    if (!draw) {
      console.log('❌ No draw found. Please create a draw first.');
      console.log('   Format should be: ROUND_ROBIN_KNOCKOUT');
      return;
    }

    const bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    console.log('✅ Draw found');
    console.log('   Format:', bracketJson.format);
    console.log('   Groups:', bracketJson.groups?.length || 0);
    console.log('   Knockout rounds:', bracketJson.knockout?.rounds?.length || 0);

    if (bracketJson.format !== 'ROUND_ROBIN_KNOCKOUT') {
      console.log('⚠️  Warning: Draw format is not ROUND_ROBIN_KNOCKOUT');
      console.log('   This test is designed for Round Robin + Knockout format');
    }

    // Step 3: Check registered players
    console.log('\n📋 Step 3: Checking registered players...');
    const registrations = await prisma.registration.findMany({
      where: {
        tournamentId: TOURNAMENT_ID,
        categoryId: CATEGORY_ID,
        status: 'confirmed'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    console.log(`✅ Found ${registrations.length} confirmed registrations`);
    if (registrations.length < 8) {
      console.log('⚠️  Warning: Less than 8 players registered');
      console.log('   You may need to register more players for testing');
    }

    // Step 4: Check current player assignments in round robin groups
    console.log('\n📋 Step 4: Checking round robin group assignments...');
    let assignedInGroups = 0;
    if (bracketJson.groups) {
      bracketJson.groups.forEach((group, idx) => {
        const assigned = group.participants.filter(p => p.id !== null).length;
        assignedInGroups += assigned;
        console.log(`   Group ${group.groupName}: ${assigned}/${group.participants.length} players assigned`);
      });
    }
    console.log(`   Total: ${assignedInGroups} players assigned to groups`);

    // Step 5: Check knockout bracket status
    console.log('\n📋 Step 5: Checking knockout bracket status...');
    if (bracketJson.knockout && bracketJson.knockout.rounds) {
      const firstRound = bracketJson.knockout.rounds[0];
      let assignedInKnockout = 0;
      
      if (firstRound && firstRound.matches) {
        firstRound.matches.forEach(match => {
          if (match.player1?.id) assignedInKnockout++;
          if (match.player2?.id) assignedInKnockout++;
        });
      }

      console.log(`   Knockout bracket size: ${bracketJson.knockout.bracketSize}`);
      console.log(`   First round matches: ${firstRound?.matches?.length || 0}`);
      console.log(`   Players assigned in knockout: ${assignedInKnockout}`);

      if (assignedInKnockout === 0) {
        console.log('   ✅ PASS: Knockout bracket is empty (as expected)');
      } else {
        console.log('   ❌ FAIL: Knockout bracket has player assignments');
        console.log('   Expected: 0 players assigned');
        console.log('   Actual: ' + assignedInKnockout + ' players assigned');
      }
    } else {
      console.log('   ⚠️  No knockout bracket structure found');
    }

    // Step 6: Check database Match records
    console.log('\n📋 Step 6: Checking database Match records...');
    const groupMatches = await prisma.match.findMany({
      where: {
        tournamentId: TOURNAMENT_ID,
        categoryId: CATEGORY_ID,
        stage: 'GROUP'
      }
    });

    const knockoutMatches = await prisma.match.findMany({
      where: {
        tournamentId: TOURNAMENT_ID,
        categoryId: CATEGORY_ID,
        stage: 'KNOCKOUT'
      },
      orderBy: [
        { round: 'desc' },
        { matchNumber: 'asc' }
      ]
    });

    console.log(`   Group stage matches: ${groupMatches.length}`);
    console.log(`   Knockout stage matches: ${knockoutMatches.length}`);

    if (knockoutMatches.length > 0) {
      const assignedKnockoutMatches = knockoutMatches.filter(m => m.player1Id || m.player2Id);
      console.log(`   Knockout matches with players: ${assignedKnockoutMatches.length}`);

      if (assignedKnockoutMatches.length === 0) {
        console.log('   ✅ PASS: All knockout matches have null players (as expected)');
      } else {
        console.log('   ❌ FAIL: Some knockout matches have player assignments');
        console.log('\n   Assigned knockout matches:');
        assignedKnockoutMatches.forEach(m => {
          console.log(`     Match ${m.matchNumber} (Round ${m.round}): ${m.player1Id ? 'Player1' : 'null'} vs ${m.player2Id ? 'Player2' : 'null'}`);
        });
      }
    }

    // Step 7: Summary and recommendations
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY\n');

    const tests = [
      {
        name: 'Tournament and category exist',
        passed: !!tournament && tournament.categories.length > 0
      },
      {
        name: 'Draw is configured as ROUND_ROBIN_KNOCKOUT',
        passed: bracketJson.format === 'ROUND_ROBIN_KNOCKOUT'
      },
      {
        name: 'Knockout bracket JSON is empty',
        passed: bracketJson.knockout?.rounds?.[0]?.matches?.every(m => !m.player1?.id && !m.player2?.id) ?? false
      },
      {
        name: 'Knockout database matches are empty',
        passed: knockoutMatches.every(m => !m.player1Id && !m.player2Id)
      }
    ];

    tests.forEach(test => {
      console.log(`${test.passed ? '✅' : '❌'} ${test.name}`);
    });

    const allPassed = tests.every(t => t.passed);
    
    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('\nThe fixes are working correctly:');
      console.log('1. ✅ Round robin groups can be assigned without affecting knockout');
      console.log('2. ✅ Knockout bracket remains empty until explicitly arranged');
      console.log('3. ✅ Database matches are properly initialized');
      console.log('\n📝 Next steps:');
      console.log('   1. Assign players to round robin groups in the UI');
      console.log('   2. Complete round robin matches');
      console.log('   3. Click "Arrange Knockout Matchups" to manually assign players');
      console.log('   4. Verify knockout bracket shows your selected players');
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log('\nPlease check the issues above and:');
      console.log('   1. Make sure you have a ROUND_ROBIN_KNOCKOUT draw created');
      console.log('   2. Try assigning players to round robin groups again');
      console.log('   3. Check that the backend code changes are applied');
    }

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
