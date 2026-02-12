import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestData() {
  console.log('🧹 Cleaning unrealistic test data...\n');

  try {
    // Reset users with unrealistic points (>100 points with 0-1 tournaments)
    const usersToReset = await prisma.user.findMany({
      where: {
        OR: [
          {
            totalPoints: { gt: 100 },
            tournamentsPlayed: { lt: 2 }
          },
          {
            // Reset playerProfile with unrealistic data
            playerProfile: {
              matchifyPoints: { gt: 100 },
              tournamentsPlayed: { lt: 2 }
            }
          }
        ]
      },
      include: {
        playerProfile: true,
        registrations: {
          where: { status: 'confirmed' }
        }
      }
    });

    console.log(`Found ${usersToReset.length} users with unrealistic data:\n`);

    for (const user of usersToReset) {
      console.log(`👤 ${user.name}:`);
      console.log(`   Current: ${user.totalPoints} pts, ${user.tournamentsPlayed} tournaments`);
      
      // Calculate realistic points based on actual registrations
      const actualTournaments = user.registrations.length;
      
      // If they have 0 tournaments, set points to 0
      // If they have tournaments, keep their current points (from tournament end)
      const realisticPoints = actualTournaments === 0 ? 0 : user.totalPoints;
      
      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: realisticPoints,
          tournamentsPlayed: actualTournaments
        }
      });

      // Update player profile
      if (user.playerProfile) {
        await prisma.playerProfile.update({
          where: { userId: user.id },
          data: {
            matchifyPoints: realisticPoints,
            tournamentsPlayed: actualTournaments
          }
        });
      }

      console.log(`   ✅ Reset to: ${realisticPoints} pts, ${actualTournaments} tournaments\n`);
    }

    console.log('\n🎉 Test data cleanup complete!\n');

    // Show updated top 10
    console.log('🏆 Updated Top 10 Leaderboard:');
    const topPlayers = await prisma.user.findMany({
      orderBy: [
        { totalPoints: 'desc' },
        { name: 'asc' }
      ],
      take: 10,
      select: {
        name: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        city: true,
        state: true
      }
    });

    topPlayers.forEach((player, index) => {
      const winRate = player.matchesWon + player.matchesLost > 0 
        ? ((player.matchesWon / (player.matchesWon + player.matchesLost)) * 100).toFixed(1)
        : 0;
      
      console.log(`   ${index + 1}. ${player.name}`);
      console.log(`      📍 ${player.city}, ${player.state}`);
      console.log(`      ⭐ ${player.totalPoints} pts | 🏆 ${player.tournamentsPlayed} tournaments`);
      console.log(`      🎯 ${player.matchesWon}W-${player.matchesLost}L (${winRate}% win rate)`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error cleaning data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
