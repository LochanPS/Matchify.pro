/**
 * Check match completion status and standings
 */

import prisma from './src/lib/prisma.js';

async function main() {
  console.log('🔍 CHECKING MATCH COMPLETION STATUS\n');
  console.log('='.repeat(80));

  try {
    const tournament = await prisma.tournament.findFirst({
      include: { categories: true }
    });

    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }

    const category = tournament.categories[0];
    console.log(`\n📋 Tournament: ${tournament.name}`);
    console.log(`📂 Category: ${category.name}`);

    // Get all matches
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`\n📊 Total Matches: ${matches.length}`);

    // Group by stage
    const groupMatches = matches.filter(m => m.stage === 'GROUP');
    const knockoutMatches = matches.filter(m => m.stage === 'KNOCKOUT');

    console.log(`\n   Group Stage: ${groupMatches.length} matches`);
    console.log(`   Knockout Stage: ${knockoutMatches.length} matches`);

    // Check group matches in detail
    console.log(`\n${'='.repeat(80)}`);
    console.log('GROUP STAGE MATCHES');
    console.log('='.repeat(80));

    if (groupMatches.length === 0) {
      console.log('\n❌ No group stage matches found!');
      console.log('   This might be why standings aren\'t calculated.');
    } else {
      groupMatches.forEach((match, index) => {
        console.log(`\nMatch ${match.matchNumber}:`);
        console.log(`  Status: ${match.status}`);
        console.log(`  Player 1 ID: ${match.player1Id || 'NULL'}`);
        console.log(`  Player 2 ID: ${match.player2Id || 'NULL'}`);
        console.log(`  Winner ID: ${match.winnerId || 'NULL'}`);
        console.log(`  Score: ${match.scoreJson || 'NULL'}`);
        console.log(`  Started: ${match.startedAt || 'NULL'}`);
        console.log(`  Completed: ${match.completedAt || 'NULL'}`);
      });

      const completed = groupMatches.filter(m => m.status === 'COMPLETED').length;
      const pending = groupMatches.filter(m => m.status === 'PENDING').length;
      const inProgress = groupMatches.filter(m => m.status === 'IN_PROGRESS').length;

      console.log(`\n${'─'.repeat(80)}`);
      console.log(`Summary:`);
      console.log(`  ✅ Completed: ${completed}`);
      console.log(`  ⏳ In Progress: ${inProgress}`);
      console.log(`  ⏸️  Pending: ${pending}`);

      if (completed === 0) {
        console.log(`\n⚠️  WARNING: No matches are marked as COMPLETED!`);
        console.log(`   Standings cannot be calculated until matches are completed.`);
      }
    }

    // Check draw
    const draw = await prisma.draw.findUnique({
      where: {
        tournamentId_categoryId: {
          tournamentId: tournament.id,
          categoryId: category.id
        }
      }
    });

    if (draw) {
      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      console.log(`\n${'='.repeat(80)}`);
      console.log('DRAW BRACKET JSON');
      console.log('='.repeat(80));

      if (bracketJson.groups) {
        console.log(`\nGroups: ${bracketJson.groups.length}`);
        
        bracketJson.groups.forEach((group, index) => {
          console.log(`\n  Group ${group.groupName}:`);
          console.log(`    Participants: ${group.participants?.length || 0}`);
          console.log(`    Matches: ${group.matches?.length || 0}`);
          console.log(`    Standings: ${group.standings?.length || 0}`);

          if (group.standings && group.standings.length > 0) {
            console.log(`\n    Standings:`);
            group.standings
              .sort((a, b) => b.points - a.points)
              .forEach((s, rank) => {
                console.log(`      ${rank + 1}. ${s.playerName}: ${s.points} pts (${s.wins}W-${s.losses}L)`);
              });
          } else {
            console.log(`    ⚠️  No standings calculated yet`);
          }
        });
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('💡 DIAGNOSIS');
    console.log('='.repeat(80));

    if (groupMatches.length === 0) {
      console.log('\n❌ ISSUE: No group stage matches in database');
      console.log('   SOLUTION: Assign players to round robin groups');
    } else if (groupMatches.filter(m => m.status === 'COMPLETED').length === 0) {
      console.log('\n❌ ISSUE: Matches exist but none are COMPLETED');
      console.log('   SOLUTION: Complete the matches by:');
      console.log('     1. Starting a match (status → IN_PROGRESS)');
      console.log('     2. Scoring the match');
      console.log('     3. Ending the match (status → COMPLETED)');
    } else {
      console.log('\n✅ Matches are completed');
      console.log('   Check if standings are being calculated in bracket JSON');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
