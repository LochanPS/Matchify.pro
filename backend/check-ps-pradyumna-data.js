import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPSPradyumnaData() {
  console.log('🔍 Checking PS Pradyumna data...\n');

  try {
    // Get PS Pradyumna
    const user = await prisma.user.findFirst({
      where: { name: 'PS Pradyumna' },
      include: {
        playerProfile: true,
        registrations: {
          where: { status: 'confirmed' },
          include: {
            tournament: { select: { name: true } },
            category: { select: { name: true } }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 PS Pradyumna:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   City: ${user.city}`);
    console.log(`   State: ${user.state}`);
    console.log('');

    console.log('📊 User Table Stats:');
    console.log(`   Total Points: ${user.totalPoints}`);
    console.log(`   Tournaments Played: ${user.tournamentsPlayed}`);
    console.log(`   Matches Won: ${user.matchesWon}`);
    console.log(`   Matches Lost: ${user.matchesLost}`);
    console.log('');

    if (user.playerProfile) {
      console.log('📊 PlayerProfile Table Stats:');
      console.log(`   Matchify Points: ${user.playerProfile.matchifyPoints}`);
      console.log(`   Tournaments Played: ${user.playerProfile.tournamentsPlayed}`);
      console.log(`   Matches Won: ${user.playerProfile.matchesWon}`);
      console.log(`   Matches Lost: ${user.playerProfile.matchesLost}`);
      console.log('');
    }

    console.log('🏆 Registrations:');
    user.registrations.forEach((reg, i) => {
      console.log(`   ${i + 1}. ${reg.tournament.name} - ${reg.category.name}`);
      console.log(`      Status: ${reg.status}`);
    });
    console.log('');

    // Get matches
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { player1Id: user.id },
          { player2Id: user.id }
        ]
      },
      include: {
        tournament: { select: { name: true } },
        category: { select: { name: true } }
      }
    });

    console.log(`🎯 Matches: ${matches.length} total`);
    matches.forEach((match, i) => {
      const isPlayer1 = match.player1Id === user.id;
      const isWinner = match.winnerId === user.id;
      console.log(`   ${i + 1}. ${match.tournament.name} - ${match.category.name}`);
      console.log(`      Position: ${isPlayer1 ? 'Player 1' : 'Player 2'}`);
      console.log(`      Status: ${match.status}`);
      console.log(`      Winner: ${match.winnerId ? (isWinner ? 'YOU' : 'Opponent') : 'None'}`);
    });
    console.log('');

    // Calculate actual rank
    const allUsers = await prisma.user.findMany({
      orderBy: [
        { totalPoints: 'desc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        totalPoints: true,
        city: true,
        state: true
      }
    });

    const countryRank = allUsers.findIndex(u => u.id === user.id) + 1;
    const cityUsers = allUsers.filter(u => u.city === user.city);
    const cityRank = cityUsers.findIndex(u => u.id === user.id) + 1;
    const stateUsers = allUsers.filter(u => u.state === user.state);
    const stateRank = stateUsers.findIndex(u => u.id === user.id) + 1;

    console.log('🏅 Actual Ranks:');
    console.log(`   Country Rank: #${countryRank} out of ${allUsers.length}`);
    console.log(`   State Rank: #${stateRank} out of ${stateUsers.length}`);
    console.log(`   City Rank: #${cityRank} out of ${cityUsers.length}`);
    console.log('');

    // Show users with same points
    const samePointsUsers = allUsers.filter(u => u.totalPoints === user.totalPoints);
    console.log(`👥 Users with ${user.totalPoints} points: ${samePointsUsers.length}`);
    samePointsUsers.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.name} - ${u.totalPoints} pts`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkPSPradyumnaData()
  .then(() => {
    console.log('\n✅ Check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
