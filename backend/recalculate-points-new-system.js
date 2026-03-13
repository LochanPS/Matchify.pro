import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recalculatePoints() {
  try {
    console.log('🔄 Recalculating points with new system...\n');
    console.log('📋 New System:');
    console.log('   - Knockout match win: 2 points');
    console.log('   - Round robin match win: 1 point\n');

    // Step 1: Reset all user points to 0
    console.log('1️⃣ Resetting all user points to 0...');
    await prisma.user.updateMany({
      data: {
        totalPoints: 0
      }
    });
    console.log('✅ All user points reset\n');

    // Step 2: Get all completed matches
    console.log('2️⃣ Fetching all completed matches...');
    const matches = await prisma.match.findMany({
      where: {
        status: 'COMPLETED',
        winnerId: { not: null }
      },
      select: {
        id: true,
        winnerId: true,
        stage: true,
        tournamentId: true,
        categoryId: true,
        tournament: {
          select: { name: true }
        },
        category: {
          select: { name: true }
        }
      }
    });

    console.log(`✅ Found ${matches.length} completed matches\n`);

    // Step 3: Calculate points for each player
    console.log('3️⃣ Calculating points for each player...');
    const playerPoints = new Map();
    const playerMatchDetails = new Map();

    matches.forEach(match => {
      const winnerId = match.winnerId;
      if (!winnerId) return;

      // Determine points based on match stage
      let points = 0;
      let matchType = '';
      
      if (match.stage === 'KNOCKOUT') {
        points = 2;
        matchType = 'Knockout';
      } else if (match.stage === 'GROUP') {
        points = 1;
        matchType = 'Round Robin';
      } else {
        // Fallback: if stage is not set, assume knockout
        points = 2;
        matchType = 'Knockout (default)';
      }

      // Add points to player's total
      if (playerPoints.has(winnerId)) {
        playerPoints.set(winnerId, playerPoints.get(winnerId) + points);
        playerMatchDetails.get(winnerId).push({
          tournament: match.tournament.name,
          category: match.category.name,
          type: matchType,
          points
        });
      } else {
        playerPoints.set(winnerId, points);
        playerMatchDetails.set(winnerId, [{
          tournament: match.tournament.name,
          category: match.category.name,
          type: matchType,
          points
        }]);
      }
    });

    console.log(`✅ Calculated points for ${playerPoints.size} players\n`);

    // Step 4: Update each player's points
    console.log('4️⃣ Updating player points in database...\n');
    let updatedCount = 0;

    for (const [userId, points] of playerPoints.entries()) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });

      if (user) {
        await prisma.user.update({
          where: { id: userId },
          data: { totalPoints: points }
        });

        const matchDetails = playerMatchDetails.get(userId);
        console.log(`✅ ${user.name} (${user.email})`);
        console.log(`   Total Points: ${points}`);
        console.log(`   Matches Won: ${matchDetails.length}`);
        
        // Show breakdown
        const knockoutWins = matchDetails.filter(m => m.type.includes('Knockout')).length;
        const roundRobinWins = matchDetails.filter(m => m.type.includes('Round Robin')).length;
        
        if (knockoutWins > 0) {
          console.log(`   - ${knockoutWins} Knockout wins × 2 = ${knockoutWins * 2} points`);
        }
        if (roundRobinWins > 0) {
          console.log(`   - ${roundRobinWins} Round Robin wins × 1 = ${roundRobinWins} points`);
        }
        console.log('');
        
        updatedCount++;
      }
    }

    console.log(`\n✅ Updated ${updatedCount} players with new points\n`);

    // Step 5: Show summary
    console.log('📊 SUMMARY:');
    console.log(`   Total matches processed: ${matches.length}`);
    console.log(`   Players with points: ${playerPoints.size}`);
    console.log(`   Total points awarded: ${Array.from(playerPoints.values()).reduce((a, b) => a + b, 0)}`);
    console.log('');

    // Step 6: Show top 10 leaderboard
    console.log('🏆 TOP 10 LEADERBOARD (New System):');
    const topPlayers = await prisma.user.findMany({
      where: {
        totalPoints: { gt: 0 }
      },
      orderBy: { totalPoints: 'desc' },
      take: 10,
      select: {
        name: true,
        totalPoints: true,
        matchesWon: true,
        matchesLost: true
      }
    });

    topPlayers.forEach((player, index) => {
      const winRate = player.matchesWon + player.matchesLost > 0
        ? Math.round((player.matchesWon / (player.matchesWon + player.matchesLost)) * 100)
        : 0;
      console.log(`   ${index + 1}. ${player.name} - ${player.totalPoints} points (${player.matchesWon}W-${player.matchesLost}L, ${winRate}% win rate)`);
    });

    console.log('\n🎉 Points recalculation complete!');

  } catch (error) {
    console.error('❌ Error recalculating points:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculatePoints()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
