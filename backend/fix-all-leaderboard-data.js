import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllLeaderboardData() {
  console.log('🔧 Starting comprehensive data cleanup...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        registrations: {
          where: { status: 'confirmed' },
          include: {
            tournament: true,
            category: true
          }
        },
        playerProfile: true
      }
    });

    console.log(`📊 Found ${users.length} users to process\n`);

    for (const user of users) {
      console.log(`\n👤 Processing: ${user.name}`);

      // Calculate actual tournaments played (confirmed registrations)
      const tournamentsPlayed = user.registrations.length;

      // Calculate matches won and lost by querying Match table
      const matchesWon = await prisma.match.count({
        where: {
          status: 'COMPLETED',
          winnerId: user.id
        }
      });

      const matchesLost = await prisma.match.count({
        where: {
          status: 'COMPLETED',
          winnerId: { not: null },
          OR: [
            { player1Id: user.id },
            { player2Id: user.id }
          ],
          NOT: {
            winnerId: user.id
          }
        }
      });

      // Keep current points (will be set by tournament end)
      const finalPoints = user.totalPoints;

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: finalPoints,
          tournamentsPlayed: tournamentsPlayed,
          matchesWon: matchesWon,
          matchesLost: matchesLost
        }
      });

      // Update or create player profile
      if (user.playerProfile) {
        await prisma.playerProfile.update({
          where: { userId: user.id },
          data: {
            matchifyPoints: finalPoints,
            tournamentsPlayed: tournamentsPlayed,
            matchesWon: matchesWon,
            matchesLost: matchesLost
          }
        });
      } else {
        await prisma.playerProfile.create({
          data: {
            userId: user.id,
            matchifyPoints: finalPoints,
            tournamentsPlayed: tournamentsPlayed,
            matchesWon: matchesWon,
            matchesLost: matchesLost
          }
        });
      }

      const winRate = matchesWon + matchesLost > 0 
        ? ((matchesWon / (matchesWon + matchesLost)) * 100).toFixed(1)
        : 0;

      console.log(`   ✅ Updated:`);
      console.log(`      Points: ${finalPoints}`);
      console.log(`      Tournaments: ${tournamentsPlayed}`);
      console.log(`      Matches: ${matchesWon}W-${matchesLost}L`);
      console.log(`      Win Rate: ${winRate}%`);
    }

    console.log('\n\n🎉 Data cleanup complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total users processed: ${users.length}`);

    // Show top 10 leaderboard
    console.log('\n🏆 Top 10 Leaderboard:');
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
    console.error('❌ Error fixing data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixAllLeaderboardData()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
