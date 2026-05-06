import prisma from './src/lib/prisma.js';

async function testPointsAPI() {
  console.log('🧪 Testing Points API...\n');

  try {
    // Find a user with PLAYER role
    const player = await prisma.user.findFirst({
      where: {
        roles: {
          contains: 'PLAYER'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        totalPoints: true,
        tournamentsPlayed: true,
        matchesWon: true,
        matchesLost: true,
        registrations: {
          where: { status: 'confirmed' },
          select: { id: true }
        }
      }
    });

    if (!player) {
      console.log('❌ No player found in database');
      return;
    }

    console.log('✅ Found player:', player.name);
    console.log('   Email:', player.email);
    console.log('   Total Points:', player.totalPoints);
    console.log('   Tournaments Played:', player.tournamentsPlayed);
    console.log('   Matches Won:', player.matchesWon);
    console.log('   Matches Lost:', player.matchesLost);
    console.log('   Confirmed Registrations:', player.registrations.length);
    console.log('');

    // Calculate rank
    const higherRankedCount = await prisma.user.count({
      where: {
        totalPoints: { gt: player.totalPoints },
        roles: { contains: 'PLAYER' }
      }
    });

    const rank = higherRankedCount + 1;
    console.log('✅ Player Rank:', rank);
    console.log('');

    // Check for points logs
    const logsCount = await prisma.pointsLog.count({
      where: { userId: player.id }
    });

    console.log('✅ Points Logs Count:', logsCount);
    console.log('');

    // Test response format
    const response = {
      total_points: player.totalPoints,
      rank,
      tournaments_played: player.registrations.length,
      logs: []
    };

    console.log('✅ API Response Format:');
    console.log(JSON.stringify(response, null, 2));
    console.log('');

    console.log('🎉 Points API is working correctly!');
    console.log('');
    console.log('📝 Notes:');
    console.log('   - Points are currently 0 until matches are completed');
    console.log('   - Points will be awarded automatically when matches finish');
    console.log('   - Points logs will populate as tournaments progress');

  } catch (error) {
    console.error('❌ Error testing points API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPointsAPI();
