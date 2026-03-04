import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePlayerStats() {
  console.log('🔄 Updating player stats from match history...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    console.log(`Found ${users.length} users\n`);

    for (const user of users) {
      console.log(`\n📊 Processing: ${user.name} (${user.email})`);

      // Get all completed matches where this user participated
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: user.id },
            { player2Id: user.id }
          ],
          status: 'COMPLETED'
        },
        select: {
          id: true,
          player1Id: true,
          player2Id: true,
          winnerId: true,
          tournamentId: true,
          categoryId: true
        }
      });

      console.log(`   Found ${matches.length} completed matches`);

      // Calculate wins and losses
      let matchesWon = 0;
      let matchesLost = 0;

      matches.forEach(match => {
        if (match.winnerId === user.id) {
          matchesWon++;
        } else if (match.winnerId) {
          // Only count as loss if there's a winner and it's not this user
          matchesLost++;
        }
      });

      console.log(`   Wins: ${matchesWon}, Losses: ${matchesLost}`);

      // Get unique tournaments this user participated in
      const registrations = await prisma.registration.findMany({
        where: {
          userId: user.id,
          status: 'confirmed'
        },
        select: {
          tournamentId: true
        },
        distinct: ['tournamentId']
      });

      const tournamentsPlayed = registrations.length;
      console.log(`   Tournaments played: ${tournamentsPlayed}`);

      // Update user stats
      await prisma.user.update({
        where: { id: user.id },
        data: {
          matchesWon,
          matchesLost,
          tournamentsPlayed
        }
      });

      console.log(`   ✅ Updated stats for ${user.name}`);
    }

    console.log('\n\n✅ All player stats updated successfully!');
    console.log('\n📊 Summary:');
    
    // Show summary
    const updatedUsers = await prisma.user.findMany({
      where: {
        OR: [
          { matchesWon: { gt: 0 } },
          { matchesLost: { gt: 0 } },
          { tournamentsPlayed: { gt: 0 } }
        ]
      },
      select: {
        name: true,
        matchesWon: true,
        matchesLost: true,
        tournamentsPlayed: true,
        totalPoints: true
      },
      orderBy: {
        totalPoints: 'desc'
      }
    });

    console.log('\nPlayers with activity:');
    updatedUsers.forEach(user => {
      const totalMatches = user.matchesWon + user.matchesLost;
      const winRate = totalMatches > 0 ? ((user.matchesWon / totalMatches) * 100).toFixed(1) : 0;
      console.log(`   ${user.name}: ${user.matchesWon}W-${user.matchesLost}L (${winRate}% win rate), ${user.tournamentsPlayed} tournaments, ${user.totalPoints} pts`);
    });

  } catch (error) {
    console.error('❌ Error updating player stats:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePlayerStats();
