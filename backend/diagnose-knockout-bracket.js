/**
 * Diagnostic script to check knockout bracket state
 * Identifies issues with player assignments and match progression
 */

import prisma from './src/lib/prisma.js';

async function main() {
  console.log('🔍 KNOCKOUT BRACKET DIAGNOSTIC\n');
  console.log('='.repeat(70));

  try {
    // Find the tournament
    const tournament = await prisma.tournament.findFirst({
      include: { categories: true }
    });

    if (!tournament) {
      console.log('❌ No tournament found');
      return;
    }

    console.log(`\n📋 Tournament: ${tournament.name}`);
    console.log(`   ID: ${tournament.id}`);

    // Check each category
    for (const category of tournament.categories) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📂 Category: ${category.name} (${category.id})`);
      console.log(`${'='.repeat(70)}`);

      // Get draw
      const draw = await prisma.draw.findUnique({
        where: {
          tournamentId_categoryId: {
            tournamentId: tournament.id,
            categoryId: category.id
          }
        }
      });

      if (!draw) {
        console.log('   ⚠️  No draw found for this category');
        continue;
      }

      const bracketJson = typeof draw.bracketJson === 'string' 
        ? JSON.parse(draw.bracketJson) 
        : draw.bracketJson;

      console.log(`\n   Format: ${bracketJson.format}`);

      // Get all knockout matches
      const knockoutMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          stage: 'KNOCKOUT'
        },
        include: {
          parentMatch: { select: { id: true, matchNumber: true, round: true } }
        },
        orderBy: [
          { round: 'desc' },
          { matchNumber: 'asc' }
        ]
      });

      // Fetch player details for each match
      for (const match of knockoutMatches) {
        if (match.player1Id) {
          match.player1 = await prisma.user.findUnique({
            where: { id: match.player1Id },
            select: { id: true, name: true }
          });
        }
        if (match.player2Id) {
          match.player2 = await prisma.user.findUnique({
            where: { id: match.player2Id },
            select: { id: true, name: true }
          });
        }
        if (match.winnerId) {
          match.winner = await prisma.user.findUnique({
            where: { id: match.winnerId },
            select: { id: true, name: true }
          });
        }
      }

      if (knockoutMatches.length === 0) {
        console.log('   ⚠️  No knockout matches found');
        continue;
      }

      console.log(`\n   Total Knockout Matches: ${knockoutMatches.length}`);

      // Group by round
      const rounds = {};
      knockoutMatches.forEach(match => {
        if (!rounds[match.round]) {
          rounds[match.round] = [];
        }
        rounds[match.round].push(match);
      });

      // Display each round
      const sortedRounds = Object.keys(rounds).sort((a, b) => b - a); // Highest round first
      
      sortedRounds.forEach(roundNum => {
        const roundMatches = rounds[roundNum];
        const roundName = getRoundName(parseInt(roundNum), sortedRounds.length);
        
        console.log(`\n   ${'─'.repeat(66)}`);
        console.log(`   ${roundName} (Round ${roundNum}) - ${roundMatches.length} match(es)`);
        console.log(`   ${'─'.repeat(66)}`);

        roundMatches.forEach(match => {
          const player1 = match.player1?.name || 'TBD';
          const player2 = match.player2?.name || 'TBD';
          const winner = match.winner?.name || 'None';
          const status = match.status;
          
          console.log(`\n   Match ${match.matchNumber}:`);
          console.log(`     Player 1: ${player1} ${match.player1Id ? '✅' : '❌'}`);
          console.log(`     Player 2: ${player2} ${match.player2Id ? '✅' : '❌'}`);
          console.log(`     Status: ${status}`);
          console.log(`     Winner: ${winner}`);
          
          if (match.parentMatchId) {
            console.log(`     Advances to: Match ${match.parentMatch?.matchNumber} (Round ${match.parentMatch?.round}) as ${match.winnerPosition}`);
          } else {
            console.log(`     Advances to: FINAL (No parent)`);
          }

          // Check for issues
          const issues = [];
          
          if (!match.player1Id && !match.player2Id) {
            issues.push('⚠️  Both players are TBD');
          } else if (!match.player1Id || !match.player2Id) {
            issues.push('⚠️  One player is TBD');
          }
          
          if (match.status === 'COMPLETED' && !match.winnerId) {
            issues.push('❌ Match completed but no winner set');
          }
          
          if (match.status === 'COMPLETED' && match.winnerId && match.parentMatchId) {
            // Check if winner was advanced (need to fetch parent match separately)
            issues.push(`✅ Match completed with winner`);
          }

          if (issues.length > 0) {
            console.log(`     Issues:`);
            issues.forEach(issue => console.log(`       ${issue}`));
          }
        });
      });

      // Summary
      console.log(`\n   ${'='.repeat(66)}`);
      console.log(`   📊 SUMMARY`);
      console.log(`   ${'='.repeat(66)}`);
      
      const totalMatches = knockoutMatches.length;
      const matchesWithBothPlayers = knockoutMatches.filter(m => m.player1Id && m.player2Id).length;
      const matchesWithOnlyOnePlayer = knockoutMatches.filter(m => (m.player1Id && !m.player2Id) || (!m.player1Id && m.player2Id)).length;
      const matchesWithNoPlayers = knockoutMatches.filter(m => !m.player1Id && !m.player2Id).length;
      const completedMatches = knockoutMatches.filter(m => m.status === 'COMPLETED').length;
      const pendingMatches = knockoutMatches.filter(m => m.status === 'PENDING').length;
      
      console.log(`\n   Total Matches: ${totalMatches}`);
      console.log(`   Matches with both players: ${matchesWithBothPlayers} ✅`);
      console.log(`   Matches with one player: ${matchesWithOnlyOnePlayer} ⚠️`);
      console.log(`   Matches with no players: ${matchesWithNoPlayers} ❌`);
      console.log(`   Completed: ${completedMatches}`);
      console.log(`   Pending: ${pendingMatches}`);

      // Recommendations
      console.log(`\n   💡 RECOMMENDATIONS:`);
      
      if (matchesWithNoPlayers > 0) {
        console.log(`   - ${matchesWithNoPlayers} match(es) have no players assigned`);
        console.log(`     Action: Assign players to these matches`);
      }
      
      if (matchesWithOnlyOnePlayer > 0) {
        console.log(`   - ${matchesWithOnlyOnePlayer} match(es) have only one player`);
        console.log(`     Action: Check if these are waiting for winners from previous rounds`);
      }
      
      if (completedMatches > 0) {
        console.log(`   - ${completedMatches} match(es) completed`);
        console.log(`     Action: Verify winners were advanced correctly`);
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

function getRoundName(roundNum, totalRounds) {
  const participants = Math.pow(2, roundNum);
  
  if (participants === 2) return 'FINAL';
  if (participants === 4) return 'SEMI FINALS';
  if (participants === 8) return 'QUARTER FINALS';
  if (participants === 16) return 'ROUND OF 16';
  
  return `ROUND ${totalRounds - roundNum + 1}`;
}

main();
