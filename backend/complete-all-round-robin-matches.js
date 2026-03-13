/**
 * Manually complete all round robin matches with dummy scores
 * FOR TESTING ONLY - Use this to quickly test the knockout arrangement
 */

import prisma from './src/lib/prisma.js';

async function main() {
  console.log('🔧 COMPLETING ALL ROUND ROBIN MATCHES\n');
  console.log('='.repeat(80));
  console.log('⚠️  WARNING: This will complete matches with dummy scores!');
  console.log('   Use this ONLY for testing the knockout arrangement feature.');
  console.log('='.repeat(80));

  try {
    const tournament = await prisma.tournament.findFirst({
      include: { categories: true }
    });

    if (!tournament) {
      console.log('\n❌ No tournament found');
      return;
    }

    const category = tournament.categories[0];
    console.log(`\n📋 Tournament: ${tournament.name}`);
    console.log(`📂 Category: ${category.name}`);

    // Get all pending group matches
    const matches = await prisma.match.findMany({
      where: {
        tournamentId: tournament.id,
        categoryId: category.id,
        stage: 'GROUP',
        status: 'PENDING'
      },
      orderBy: { matchNumber: 'asc' }
    });

    console.log(`\n📊 Found ${matches.length} pending group matches`);

    if (matches.length === 0) {
      console.log('\n✅ All matches are already completed!');
      return;
    }

    console.log('\n🎲 Completing matches with random winners...\n');

    for (const match of matches) {
      // Randomly pick a winner (player1 or player2)
      const winnerId = Math.random() > 0.5 ? match.player1Id : match.player2Id;
      const winnerName = winnerId === match.player1Id ? 'Player 1' : 'Player 2';

      // Create dummy score (2-0 or 2-1)
      const sets = Math.random() > 0.5 ? 2 : 3;
      const score = {
        sets: [],
        matchConfig: {
          maxSets: 3,
          pointsPerSet: 21,
          extension: true
        }
      };

      // Add sets
      for (let i = 0; i < sets; i++) {
        if (i < 2) {
          // Winner wins first 2 sets
          score.sets.push({
            player1: winnerId === match.player1Id ? 21 : Math.floor(Math.random() * 15) + 5,
            player2: winnerId === match.player2Id ? 21 : Math.floor(Math.random() * 15) + 5,
            winner: winnerId === match.player1Id ? 1 : 2
          });
        } else {
          // Loser wins 3rd set (if 3 sets)
          score.sets.push({
            player1: winnerId === match.player2Id ? 21 : Math.floor(Math.random() * 15) + 5,
            player2: winnerId === match.player1Id ? 21 : Math.floor(Math.random() * 15) + 5,
            winner: winnerId === match.player2Id ? 1 : 2
          });
        }
      }

      // Update match
      await prisma.match.update({
        where: { id: match.id },
        data: {
          status: 'COMPLETED',
          winnerId: winnerId,
          scoreJson: JSON.stringify(score),
          startedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
          completedAt: new Date()
        }
      });

      console.log(`✅ Match ${match.matchNumber}: ${winnerName} wins`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('✅ ALL MATCHES COMPLETED!');
    console.log('='.repeat(80));

    // Now update standings
    console.log('\n📊 Calculating standings...\n');

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
      console.log('❌ No draw found');
      return;
    }

    const bracketJson = typeof draw.bracketJson === 'string' 
      ? JSON.parse(draw.bracketJson) 
      : draw.bracketJson;

    if (!bracketJson.groups) {
      console.log('❌ No groups found in bracket');
      return;
    }

    // Calculate standings for each group
    for (const group of bracketJson.groups) {
      const standings = {};

      // Initialize standings for all participants
      group.participants.forEach(p => {
        if (p.id) {
          standings[p.id] = {
            playerId: p.id,
            playerName: p.name,
            played: 0,
            wins: 0,
            losses: 0,
            points: 0
          };
        }
      });

      // Get all completed matches for this group
      const groupMatches = await prisma.match.findMany({
        where: {
          tournamentId: tournament.id,
          categoryId: category.id,
          stage: 'GROUP',
          status: 'COMPLETED',
          OR: [
            { player1Id: { in: group.participants.filter(p => p.id).map(p => p.id) } },
            { player2Id: { in: group.participants.filter(p => p.id).map(p => p.id) } }
          ]
        }
      });

      // Calculate standings from matches
      groupMatches.forEach(match => {
        if (standings[match.player1Id]) {
          standings[match.player1Id].played++;
          if (match.winnerId === match.player1Id) {
            standings[match.player1Id].wins++;
            standings[match.player1Id].points += 2;
          } else {
            standings[match.player1Id].losses++;
          }
        }

        if (standings[match.player2Id]) {
          standings[match.player2Id].played++;
          if (match.winnerId === match.player2Id) {
            standings[match.player2Id].wins++;
            standings[match.player2Id].points += 2;
          } else {
            standings[match.player2Id].losses++;
          }
        }
      });

      // Update group standings
      group.standings = Object.values(standings).sort((a, b) => b.points - a.points);

      console.log(`Group ${group.groupName} Standings:`);
      group.standings.forEach((s, rank) => {
        console.log(`  ${rank + 1}. ${s.playerName}: ${s.points} pts (${s.wins}W-${s.losses}L)`);
      });
      console.log('');
    }

    // Save updated bracket
    await prisma.draw.update({
      where: { id: draw.id },
      data: { bracketJson: JSON.stringify(bracketJson) }
    });

    console.log('='.repeat(80));
    console.log('✅ STANDINGS CALCULATED AND SAVED!');
    console.log('='.repeat(80));

    console.log('\n💡 NEXT STEPS:');
    console.log('   1. Refresh the frontend (F5)');
    console.log('   2. Go to the tournament draws page');
    console.log('   3. Click "Arrange Knockout Matchups"');
    console.log('   4. Verify top 2 from each group appear');
    console.log('   5. Arrange the matchups');
    console.log('   6. Save and verify knockout bracket is populated');

  } catch (error) {
    console.error('\n❌ Error:', error);
    console.error(error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
