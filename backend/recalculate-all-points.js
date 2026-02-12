import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recalculateAllPoints() {
  console.log('🔧 Recalculating points based on ACTUAL tournament results...\n');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      include: {
        registrations: {
          where: { status: 'confirmed' },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                status: true,
                winnerId: true,
                runnerUpId: true
              }
            }
          }
        },
        playerProfile: true
      }
    });

    console.log(`📊 Processing ${users.length} users...\n`);

    for (const user of users) {
      // Count confirmed tournaments
      const tournamentsPlayed = user.registrations.length;

      // Count actual matches
      const matches = await prisma.match.findMany({
        where: {
          OR: [
            { player1Id: user.id },
            { player2Id: user.id }
          ],
          status: 'COMPLETED'
        }
      });

      let matchesWon = 0;
      let matchesLost = 0;

      matches.forEach(match => {
        if (match.winnerId === user.id) {
          matchesWon++;
        } else if (match.winnerId) {
          matchesLost++;
        }
      });

      // Calculate REAL points from completed categories only
      let realPoints = 0;
      
      for (const reg of user.registrations) {
        const category = reg.category;

        if (category && category.status === 'completed') {
          // Check if user won this category
          if (category.winnerId === user.id) {
            realPoints += 10;
            console.log(`   🏆 ${user.name} won ${category.name}: +10 pts`);
          }
          // Check if user was runner-up
          else if (category.runnerUpId === user.id) {
            realPoints += 8;
            console.log(`   🥈 ${user.name} runner-up in ${category.name}: +8 pts`);
          }
          // Otherwise, give participation points
          else {
            realPoints += 2;
            console.log(`   ✓ ${user.name} participated in ${category.name}: +2 pts`);
          }
        }
      }

      // Update user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: realPoints,
          tournamentsPlayed: tournamentsPlayed,
          matchesWon: matchesWon,
          matchesLost: matchesLost
        }
      });

      // Update player profile
      if (user.playerProfile) {
        await prisma.playerProfile.update({
          where: { userId: user.id },
          data: {
            matchifyPoints: realPoints,
            tournamentsPlayed: tournamentsPlayed,
            matchesWon: matchesWon,
            matchesLost: matchesLost
          }
        });
      } else {
        await prisma.playerProfile.create({
          data: {
            userId: user.id,
            matchifyPoints: realPoints,
            tournamentsPlayed: tournamentsPlayed,
            matchesWon: matchesWon,
            matchesLost: matchesLost
          }
        });
      }

      const winRate = matchesWon + matchesLost > 0 
        ? ((matchesWon / (matchesWon + matchesLost)) * 100).toFixed(1)
        : 0;

      if (user.totalPoints !== realPoints) {
        console.log(`\n👤 ${user.name}:`);
        console.log(`   OLD: ${user.totalPoints} pts`);
        console.log(`   NEW: ${realPoints} pts`);
        console.log(`   Stats: ${tournamentsPlayed} tournaments | ${matchesWon}W-${matchesLost}L (${winRate}%)\n`);
      }
    }

    console.log('\n🎉 Points recalculation complete!\n');

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
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

recalculateAllPoints()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
